import { create } from 'zustand';
import Taro from '@tarojs/taro';
import { Chapter, VoiceSettings, HighlightWord, PlayState, VoiceType } from '@/types';
import { mockChapters, defaultVoiceSettings, defaultHighlights } from '@/data/mockData';
import { createChapter, generateId } from '@/utils/textUtils';
import { stopSpeak } from '@/utils/tts';

const STORAGE_KEY = 'family_tts_store_v1';

interface PersistedData {
  chapters: Chapter[];
  voiceSettings: VoiceSettings;
  highlights: HighlightWord[];
  lastChapterId: string | null;
  lastParagraphIndex: number;
}

const loadFromStorage = (): Partial<PersistedData> => {
  try {
    const raw = Taro.getStorageSync(STORAGE_KEY);
    if (raw && typeof raw === 'object') {
      console.log('[Store] 从本地存储加载数据成功');
      return raw as PersistedData;
    }
  } catch (error) {
    console.error('[Store] 读取本地存储失败:', error);
  }
  return {};
};

const saveToStorage = (data: PersistedData): void => {
  try {
    Taro.setStorageSync(STORAGE_KEY, data);
    console.log('[Store] 已保存到本地存储');
  } catch (error) {
    console.error('[Store] 写入本地存储失败:', error);
  }
};

const persisted = loadFromStorage();
const initialChapters = persisted.chapters && persisted.chapters.length > 0
  ? persisted.chapters
  : [...mockChapters];
const initialChapterId = persisted.lastChapterId && initialChapters.some((c) => c.id === persisted.lastChapterId)
  ? persisted.lastChapterId
  : initialChapters[0]?.id || null;

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

  persist: () => void;
}

export const useStore = create<AppState>((set, get) => ({
  chapters: initialChapters,
  voiceSettings: persisted.voiceSettings || { ...defaultVoiceSettings },
  highlights: persisted.highlights && persisted.highlights.length > 0
    ? persisted.highlights
    : [...defaultHighlights],
  playState: {
    isPlaying: false,
    currentChapterId: initialChapterId,
    currentParagraphIndex: persisted.lastParagraphIndex || 0,
    currentProgress: 0,
    totalDuration: 0,
    sleepTimer: null,
    sleepTimerRemaining: null,
  },
  currentEditingChapter: null,

  persist: () => {
    const state = get();
    saveToStorage({
      chapters: state.chapters,
      voiceSettings: state.voiceSettings,
      highlights: state.highlights,
      lastChapterId: state.playState.currentChapterId,
      lastParagraphIndex: state.playState.currentParagraphIndex,
    });
  },

  addChapter: (title, rawText) => {
    const newChapter = createChapter(title, rawText);
    set((state) => {
      const newChapters = [...state.chapters, newChapter];
      setTimeout(() => {
        get().persist();
      }, 0);
      return {
        chapters: newChapters,
        currentEditingChapter: newChapter,
        playState: {
          ...state.playState,
          currentChapterId: newChapter.id,
          currentParagraphIndex: 0,
        },
      };
    });
    console.log('[Store] 新增章节(追加到末尾):', newChapter.title, '段落数:', newChapter.paragraphs.length);
    return newChapter;
  },

  deleteChapter: (id) => {
    set((state) => {
      const newChapters = state.chapters.filter((c) => c.id !== id);
      const newCurrentId = state.playState.currentChapterId === id
        ? newChapters[0]?.id || null
        : state.playState.currentChapterId;
      setTimeout(() => {
        get().persist();
      }, 0);
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
    setTimeout(() => {
      get().persist();
    }, 0);
  },

  setVoiceType: (type) => {
    set((state) => ({
      voiceSettings: { ...state.voiceSettings, voiceType: type },
    }));
    setTimeout(() => {
      get().persist();
    }, 0);
    console.log('[Store] 切换声音类型:', type);
  },

  setSpeedLevel: (level) => {
    const safeLevel = Math.max(0, Math.min(level, 6));
    set((state) => ({
      voiceSettings: { ...state.voiceSettings, speedLevel: safeLevel },
    }));
    setTimeout(() => {
      get().persist();
    }, 0);
  },

  decreaseSpeed: () => {
    const state = get();
    const newLevel = Math.max(0, state.voiceSettings.speedLevel - 1);
    set({
      voiceSettings: { ...state.voiceSettings, speedLevel: newLevel },
    });
    setTimeout(() => {
      get().persist();
    }, 0);
    console.log('[Store] 降低语速到等级:', newLevel);
  },

  setVolume: (volume) => {
    const safeVolume = Math.max(0, Math.min(100, volume));
    set((state) => ({
      voiceSettings: { ...state.voiceSettings, volume: safeVolume },
    }));
    setTimeout(() => {
      get().persist();
    }, 0);
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
    setTimeout(() => {
      get().persist();
    }, 0);
    console.log('[Store] 添加重点词:', word);
  },

  removeHighlight: (id) => {
    set((state) => ({
      highlights: state.highlights.filter((h) => h.id !== id),
    }));
    setTimeout(() => {
      get().persist();
    }, 0);
  },

  setPlaying: (isPlaying) => {
    set((state) => ({
      playState: { ...state.playState, isPlaying },
    }));
    if (!isPlaying) {
      stopSpeak();
    }
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
    setTimeout(() => {
      get().persist();
    }, 0);
    console.log('[Store] 切换播放章节:', chapterId);
  },

  setCurrentParagraph: (index) => {
    set((state) => ({
      playState: { ...state.playState, currentParagraphIndex: index },
    }));
    setTimeout(() => {
      get().persist();
    }, 0);
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
      setTimeout(() => {
        get().persist();
      }, 0);
    } else {
      set({
        playState: { ...state.playState, isPlaying: false },
      });
      stopSpeak();
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
    setTimeout(() => {
      get().persist();
    }, 0);
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
      stopSpeak();
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
    stopSpeak();
  },
}));
