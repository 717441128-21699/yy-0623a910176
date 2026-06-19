import { Paragraph, Chapter } from '@/types';

export const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
};

export const parseTextToParagraphs = (text: string): Paragraph[] => {
  if (!text || !text.trim()) {
    return [];
  }

  const rawParagraphs = text
    .replace(/\r\n/g, '\n')
    .split(/\n{2,}|\n\s+\n/)
    .map(p => p.trim())
    .filter(p => p.length > 0);

  return rawParagraphs.map(p => ({
    id: generateId(),
    text: p,
    highlights: [],
  }));
};

export const createChapter = (title: string, rawText: string): Chapter => {
  const paragraphs = parseTextToParagraphs(rawText);
  return {
    id: generateId(),
    title: title || '未命名章节',
    paragraphs,
    createdAt: Date.now(),
    rawText,
  };
};

export const formatDate = (timestamp: number): string => {
  const date = new Date(timestamp);
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${month}月${day}日 ${hours}:${minutes}`;
};

export const speedLevelToRate = (level: number): number => {
  const speeds = [0.5, 0.65, 0.8, 0.9, 1.0, 1.15, 1.3];
  const index = Math.max(0, Math.min(level, speeds.length - 1));
  return speeds[index];
};

export const getSpeedLabel = (level: number): string => {
  const labels = ['很慢', '较慢', '稍慢', '正常', '稍快', '较快', '很快'];
  const index = Math.max(0, Math.min(level, labels.length - 1));
  return labels[index];
};

export const formatDuration = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export const formatTimerRemaining = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  if (hours > 0) {
    return `${hours}小时${mins}分钟`;
  }
  return `${mins}分钟`;
};

export const extractWords = (text: string): string[] => {
  const chineseRegex = /[\u4e00-\u9fa5]{2,4}/g;
  const matches = text.match(chineseRegex) || [];
  return Array.from(new Set(matches));
};
