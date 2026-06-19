import { create } from 'zustand';
import { Chapter, VoiceSettings, HighlightWord, PlayState, VoiceType } from '@/types';
import { mockChapters, defaultVoiceSettings, defaultHighlights } from '@/data/mockData';
import { createChapter, generateId } from '@/utils/textUtils';

interface AppState {
  chapters: Chapter[];
  voiceSettings: VoiceSettings;
  highlights: HighlightWord[];
  playState: PlayState;
  currentEditingChapter: Chapter | null;

  addChapter: (title: string, rawText: string) => Chapter;
  deleteChapter: (id: string) => void;
  setCurrentEditingChapter: (chapter: Chapter | null) => void;
  updateChapterHighlights: (chapterId: string, paragraphId: string, highlights: string[]) => void;

  setVoiceType: (type: VoiceType) => void;
  setSpeedLevel: (level: number) => void;
  decreaseSpeed: () => void;
  setVolume: (volume: number) => void;

  addHighlight: (word: string, type: HighlightWord['type'], note?: string) => void;
  removeHighlight: (id: string) => void;

  setPlaying: (isPlaying: boolean) => void;
  setCurrentChapter: (chapterId: string) => void;
  setCurrentParagraph: (index: number) => void;
  nextParagraph: () => void;
  prevParagraph: () => void;
  setSleepTimer: (seconds: number | null) => void;
  decrementSleepTimer: () => void;
  stopPlay: () => void;
}

export const useStore = create<AppState>((set, get) => ({
  chapters: [...mockChapters],
  voiceSettings: { ...defaultVoiceSettings },
  highlights: [...defaultHighlights],
  playState: {
    isPlaying: false,
    currentChapterId: mockChapters[0]?.id || null,
    currentParagraphIndex: 0,
    currentProgress: 0,
    totalDuration: 0,
    sleepTimer: null,
    sleepTimerRemaining: null,
  },
  currentEditingChapter: null,

  addChapter: (title, rawText) => {
    const newChapter = createChapter(title, rawText);
    set((state) => ({
      chapters: [newChapter, ...state.chapters],
      currentEditingChapter: newChapter,
      playState: {
        ...state.playState,
        currentChapterId: newChapter.id,
        currentParagraphIndex: 0,
      },
    }));
    console.log('[Store] 新增章节:', newChapter.title, '段落数:', newChapter.paragraphs.length);
    return newChapter;
  },

  deleteChapter: (id) => {
    set((state) => {
      const newChapters = state.chapters.filter((c) => c.id !== id);
      const newCurrentId = state.playState.currentChapterId === id
        ? newChapters[0]?.id || null
        : state.playState.currentChapterId;
      return {
        chapters: newChapters,
        playState: {
          ...state.playState,
          currentChapterId: newCurrentId,
          currentParagraphIndex: 0,
          isPlaying: false,
        },
      };
    });
    console.log('[Store] 删除章节:', id);
  },

  setCurrentEditingChapter: (chapter) => {
    set({ currentEditingChapter: chapter });
  },

  updateChapterHighlights: (chapterId, paragraphId, highlights) => {
    set((state) => ({
      chapters: state.chapters.map((ch) =>
        ch.id === chapterId
          ? {
              ...ch,
              paragraphs: ch.paragraphs.map((p) =>
                p.id === paragraphId ? { ...p, highlights } : p
              ),
            }
          : ch
      ),
    }));
  },

  setVoiceType: (type) => {
    set((state) => ({
      voiceSettings: { ...state.voiceSettings, voiceType: type },
    }));
    console.log('[Store] 切换声音类型:', type);
  },

  setSpeedLevel: (level) => {
    const safeLevel = Math.max(0, Math.min(level, 6));
    set((state) => ({
      voiceSettings: { ...state.voiceSettings, speedLevel: safeLevel },
    }));
  },

  decreaseSpeed: () => {
    const state = get();
    const newLevel = Math.max(0, state.voiceSettings.speedLevel - 1);
    set({
      voiceSettings: { ...state.voiceSettings, speedLevel: newLevel },
    });
    console.log('[Store] 降低语速到等级:', newLevel);
  },

  setVolume: (volume) => {
    const safeVolume = Math.max(0, Math.min(100, volume));
    set((state) => ({
      voiceSettings: { ...state.voiceSettings, volume: safeVolume },
    }));
  },

  addHighlight: (word, type, note) => {
    const exists = get().highlights.some((h) => h.word === word);
    if (exists) return;
    set((state) => ({
      highlights: [
        ...state.highlights,
        { id: generateId(), word, type, note },
      ],
    }));
    console.log('[Store] 添加重点词:', word);
  },

  removeHighlight: (id) => {
    set((state) => ({
      highlights: state.highlights.filter((h) => h.id !== id),
    }));
  },

  setPlaying: (isPlaying) => {
    set((state) => ({
      playState: { ...state.playState, isPlaying },
    }));
  },

  setCurrentChapter: (chapterId) => {
    set((state) => ({
      playState: {
        ...state.playState,
        currentChapterId: chapterId,
        currentParagraphIndex: 0,
        currentProgress: 0,
      },
    }));
    console.log('[Store] 切换播放章节:', chapterId);
  },

  setCurrentParagraph: (index) => {
    set((state) => ({
      playState: { ...state.playState, currentParagraphIndex: index },
    }));
  },

  nextParagraph: () => {
    const state = get();
    const chapter = state.chapters.find((c) => c.id === state.playState.currentChapterId);
    if (!chapter) return;
    const nextIndex = state.playState.currentParagraphIndex + 1;
    if (nextIndex < chapter.paragraphs.length) {
      set({
        playState: {
          ...state.playState,
          currentParagraphIndex: nextIndex,
          currentProgress: 0,
        },
      });
    } else {
      set({
        playState: { ...state.playState, isPlaying: false },
      });
      console.log('[Store] 播放完成');
    }
  },

  prevParagraph: () => {
    const state = get();
    const newIndex = Math.max(0, state.playState.currentParagraphIndex - 1);
    set({
      playState: {
        ...state.playState,
        currentParagraphIndex: newIndex,
        currentProgress: 0,
      },
    });
  },

  setSleepTimer: (seconds) => {
    set((state) => ({
      playState: {
        ...state.playState,
        sleepTimer: seconds,
        sleepTimerRemaining: seconds,
      },
    }));
    if (seconds) {
      console.log('[Store] 设置睡眠定时:', seconds, '秒');
    } else {
      console.log('[Store] 取消睡眠定时');
    }
  },

  decrementSleepTimer: () => {
    const state = get();
    if (state.playState.sleepTimerRemaining === null) return;
    const remaining = state.playState.sleepTimerRemaining - 1;
    if (remaining <= 0) {
      set({
        playState: {
          ...state.playState,
          isPlaying: false,
          sleepTimer: null,
          sleepTimerRemaining: null,
        },
      });
      console.log('[Store] 睡眠定时结束，停止播放');
    } else {
      set({
        playState: { ...state.playState, sleepTimerRemaining: remaining },
      });
    }
  },

  stopPlay: () => {
    set((state) => ({
      playState: {
        ...state.playState,
        isPlaying: false,
        currentProgress: 0,
      },
    }));
  },
}));
