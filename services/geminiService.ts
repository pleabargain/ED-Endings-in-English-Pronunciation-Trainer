
import { GoogleGenAI, Modality, Type } from "@google/genai";
import { WordData } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "" });

/**
 * Encodes a Uint8Array into a Base64 string.
 */
function encode(bytes: Uint8Array): string {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Decodes a Base64 string into a Uint8Array.
 */
function decode(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

/**
 * Decodes raw PCM audio data from the Gemini API.
 */
export async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

export const geminiService = {
  /**
   * Generates audio for a specific word using Gemini TTS.
   */
  async speakWord(text: string): Promise<Uint8Array | undefined> {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: `Pronounce clearly: ${text}` }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Kore' },
            },
          },
        },
      });

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (base64Audio) {
        return decode(base64Audio);
      }
    } catch (error) {
      console.error("Error generating speech:", error);
    }
    return undefined;
  },

  /**
   * Generates a list of fresh -ed words for the quiz.
   */
  async generateWords(difficulty: string, excludedWords: string[]): Promise<WordData[]> {
    try {
      const exclusionString = excludedWords.length > 0 ? ` DO NOT use any of these words: ${excludedWords.join(', ')}.` : '';
      const prompt = `Generate 10 English regular verbs in past tense (ending in -ed) suitable for CEFR level ${difficulty}. Include a mix of the three pronunciation sounds: /t/, /d/, and /id/.${exclusionString} Return as JSON.`;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                word: { type: Type.STRING },
                sound: { 
                  type: Type.STRING, 
                  description: "One of: 't', 'd', 'id'" 
                },
                rule: { type: Type.STRING },
                exampleSentence: { type: Type.STRING }
              },
              required: ["word", "sound", "rule", "exampleSentence"]
            }
          }
        }
      });

      const jsonStr = response.text;
      return JSON.parse(jsonStr || "[]") as WordData[];
    } catch (error) {
      console.error("Error generating words:", error);
      return []; 
    }
  },

  /**
   * Generates fresh examples for the rules page.
   */
  async generateExamples(): Promise<any[]> {
    try {
      const prompt = `Generate a set of English regular verb examples for the three -ed pronunciation sounds. 
      Return exactly 3 categories: '/t/ Sound', '/d/ Sound', and '/ɪd/ Sound'.
      For each category, provide a short description of when it's used and exactly 8 example words ending in -ed.
      Return as JSON array.`;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                category: { type: Type.STRING },
                description: { type: Type.STRING },
                examples: { 
                  type: Type.ARRAY,
                  items: { type: Type.STRING }
                }
              },
              required: ["category", "description", "examples"]
            }
          }
        }
      });

      return JSON.parse(response.text || "[]");
    } catch (error) {
      console.error("Error generating examples:", error);
      return [];
    }
  }
};
