export interface Paragraph {
  id: string;
  text: string;
  highlights: string[];
}

export interface Chapter {
  id: string;
  title: string;
  paragraphs: Paragraph[];
  createdAt: number;
  rawText: string;
}

export type VoiceType = 'slow' | 'female' | 'male' | 'dialect';

export interface VoiceOption {
  type: VoiceType;
  name: string;
  description: string;
  sample: string;
}

export interface VoiceSettings {
  voiceType: VoiceType;
  speedLevel: number;
  volume: number;
  pauseBetweenParagraphs: number;
}

export type HighlightType = 'name' | 'place' | 'custom';

export interface HighlightWord {
  id: string;
  word: string;
  type: HighlightType;
  note?: string;
}

export interface PlayState {
  isPlaying: boolean;
  currentChapterId: string | null;
  currentParagraphIndex: number;
  currentProgress: number;
  totalDuration: number;
  sleepTimer: number | null;
  sleepTimerRemaining: number | null;
}
