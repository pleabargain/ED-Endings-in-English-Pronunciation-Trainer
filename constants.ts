
import { WordData } from './types';

export const INITIAL_WORDS: WordData[] = [
  { word: 'walked', sound: 't', rule: 'Ends with voiceless /k/', exampleSentence: 'He walked to the park.' },
  { word: 'played', sound: 'd', rule: 'Ends with voiced vowel /eɪ/', exampleSentence: 'They played soccer all afternoon.' },
  { word: 'wanted', sound: 'id', rule: 'Ends with /t/', exampleSentence: 'She wanted a new bicycle.' },
  { word: 'needed', sound: 'id', rule: 'Ends with /d/', exampleSentence: 'We needed some milk.' },
  { word: 'laughed', sound: 't', rule: 'Ends with voiceless /f/', exampleSentence: 'He laughed at the joke.' },
  { word: 'cleaned', sound: 'd', rule: 'Ends with voiced /n/', exampleSentence: 'She cleaned her room.' },
  { word: 'fixed', sound: 't', rule: 'Ends with voiceless /ks/', exampleSentence: 'The mechanic fixed the car.' },
  { word: 'climbed', sound: 'd', rule: 'Ends with voiced /m/', exampleSentence: 'They climbed the mountain.' },
  { word: 'stopped', sound: 't', rule: 'Ends with voiceless /p/', exampleSentence: 'The bus stopped at the corner.' },
  { word: 'added', sound: 'id', rule: 'Ends with /d/', exampleSentence: 'She added sugar to her tea.' }
];

export const RULES = [
  {
    category: '/t/ Sound',
    description: 'Used after voiceless consonant sounds: /p/, /k/, /f/, /s/, /ʃ/ (sh), /tʃ/ (ch), /θ/ (th).',
    examples: ['jumped', 'kicked', 'sniffed', 'kissed', 'washed', 'watched']
  },
  {
    category: '/d/ Sound',
    description: 'Used after voiced sounds: /b/, /g/, /v/, /z/, /l/, /m/, /n/, /r/, and all vowels.',
    examples: ['robbed', 'hugged', 'lived', 'buzzed', 'called', 'named', 'turned', 'shared']
  },
  {
    category: '/ɪd/ Sound',
    description: 'Used only after the consonant sounds /t/ or /d/.',
    examples: ['painted', 'shouted', 'started', 'decided', 'ended', 'folded']
  }
];
