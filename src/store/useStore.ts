import { create } from 'zustand';
import Taro from '@tarojs/taro';
import { Chapter, VoiceSettings, HighlightWord, PlayState, VoiceType, LastListenRecord } from '@/types';
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
  lastListen: LastListenRecord | null;
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
  } catch (error) {
    console.error('[Store] 写入本地存储失败:', error);
  }
};

const persisted = loadFromStorage();
const initialChapters = persisted.chapters && persisted.chapters.length > 0
  ? persisted.chapters
  : [...mockChapters];

const initialChapterId = (() => {
  if (initialChapters.length === 0) return null;
  const lastChapterId = persisted.lastListen?.chapterId || persisted.lastChapterId;
  if (lastChapterId && initialChapters.some((c) => c.id === lastChapterId)) {
    return lastChapterId;
  }
  return initialChapters[0].id;
})();

const initialParagraphIndex = (() => {
  if (initialChapters.length === 0) return 0;
  if (persisted.lastListen && persisted.lastListen.chapterId === initialChapterId) {
    return persisted.lastListen.paragraphIndex || 0;
  }
  return persisted.lastParagraphIndex || 0;
})();

const getEffectiveVoiceSettings = (
  chapter: Chapter | undefined,
  globalSettings: VoiceSettings
): VoiceSettings => {
  if (chapter?.useChapterSettings && chapter.chapterVoiceSettings) {
    return chapter.chapterVoiceSettings;
  }
  return globalSettings;
};

interface AppState {
  chapters: Chapter[];
  voiceSettings: VoiceSettings;
  highlights: HighlightWord[];
  playState: PlayState;
  currentEditingChapter: Chapter | null;

  getEffectiveVoice: (chapterId: string | null) => VoiceSettings;
  isUsingChapterSettings: (chapterId: string | null) => boolean;

  addChapter: (title: string, rawText: string) => Chapter;
  deleteChapter: (id: string) => void;
  setCurrentEditingChapter: (chapter: Chapter | null) => void;
  updateChapterHighlights: (chapterId: string, paragraphId: string, highlights: string[]) => void;

  setVoiceType: (type: VoiceType) => void;
  setSpeedLevel: (level: number) => void;
  decreaseSpeed: () => void;
  setVolume: (volume: number) => void;

  setChapterVoiceSettings: (chapterId: string, settings: VoiceSettings | null) => void;
  toggleChapterSettings: (chapterId: string, enabled: boolean) => void;
  resetChapterToGlobal: (chapterId: string) => void;

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

  startFromBeginning: () => void;
  continueFromLast: () => void;
  updateLastListen: () => void;

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
    currentParagraphIndex: initialParagraphIndex,
    currentProgress: 0,
    totalDuration: 0,
    sleepTimer: null,
    sleepTimerRemaining: null,
    lastListen: persisted.lastListen || null,
    playFromStart: false,
  },
  currentEditingChapter: null,

  getEffectiveVoice: (chapterId) => {
    const state = get();
    const chapter = state.chapters.find((c) => c.id === chapterId);
    return getEffectiveVoiceSettings(chapter, state.voiceSettings);
  },

  isUsingChapterSettings: (chapterId) => {
    const chapter = get().chapters.find((c) => c.id === chapterId);
    return !!(chapter?.useChapterSettings && chapter.chapterVoiceSettings);
  },

  persist: () => {
    const state = get();
    saveToStorage({
      chapters: state.chapters,
      voiceSettings: state.voiceSettings,
      highlights: state.highlights,
      lastChapterId: state.playState.currentChapterId,
      lastParagraphIndex: state.playState.currentParagraphIndex,
      lastListen: state.playState.lastListen,
    });
  },

  addChapter: (title, rawText) => {
    const newChapter = createChapter(title, rawText);
    set((state) => {
      const newChapters = [...state.chapters, newChapter];
      setTimeout(() => get().persist(), 0);
      return {
        chapters: newChapters,
        currentEditingChapter: newChapter,
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
      const newLastListen = state.playState.lastListen?.chapterId === id
        ? null
        : state.playState.lastListen;
      setTimeout(() => get().persist(), 0);
      return {
        chapters: newChapters,
        playState: {
          ...state.playState,
          currentChapterId: newCurrentId,
          currentParagraphIndex: 0,
          isPlaying: false,
          lastListen: newLastListen,
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
    setTimeout(() => get().persist(), 0);
  },

  setVoiceType: (type) => {
    set((state) => ({
      voiceSettings: { ...state.voiceSettings, voiceType: type },
    }));
    setTimeout(() => get().persist(), 0);
    console.log('[Store] 切换全局声音类型:', type);
  },

  setSpeedLevel: (level) => {
    const safeLevel = Math.max(0, Math.min(level, 6));
    set((state) => ({
      voiceSettings: { ...state.voiceSettings, speedLevel: safeLevel },
    }));
    setTimeout(() => get().persist(), 0);
  },

  decreaseSpeed: () => {
    const state = get();
    const newLevel = Math.max(0, state.voiceSettings.speedLevel - 1);
    set({
      voiceSettings: { ...state.voiceSettings, speedLevel: newLevel },
    });
    setTimeout(() => get().persist(), 0);
    console.log('[Store] 降低全局语速到等级:', newLevel);
  },

  setVolume: (volume) => {
    const safeVolume = Math.max(0, Math.min(100, volume));
    set((state) => ({
      voiceSettings: { ...state.voiceSettings, volume: safeVolume },
    }));
    setTimeout(() => get().persist(), 0);
  },

  setChapterVoiceSettings: (chapterId, settings) => {
    set((state) => ({
      chapters: state.chapters.map((ch) =>
        ch.id === chapterId
          ? {
              ...ch,
              chapterVoiceSettings: settings,
              useChapterSettings: settings ? true : ch.useChapterSettings,
            }
          : ch
      ),
    }));
    setTimeout(() => get().persist(), 0);
    console.log('[Store] 设置章节独立声音:', chapterId, settings ? '已设置' : '已清除');
  },

  toggleChapterSettings: (chapterId, enabled) => {
    set((state) => ({
      chapters: state.chapters.map((ch) => {
        if (ch.id !== chapterId) return ch;
        if (enabled && !ch.chapterVoiceSettings) {
          return {
            ...ch,
            useChapterSettings: true,
            chapterVoiceSettings: { ...state.voiceSettings },
          };
        }
        return { ...ch, useChapterSettings: enabled };
      }),
    }));
    setTimeout(() => get().persist(), 0);
    console.log('[Store] 切换章节独立设置开关:', chapterId, enabled);
  },

  resetChapterToGlobal: (chapterId) => {
    set((state) => ({
      chapters: state.chapters.map((ch) =>
        ch.id === chapterId
          ? { ...ch, useChapterSettings: false, chapterVoiceSettings: null }
          : ch
      ),
    }));
    setTimeout(() => get().persist(), 0);
    console.log('[Store] 重置章节到全局设置:', chapterId);
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
    setTimeout(() => get().persist(), 0);
    console.log('[Store] 添加重点词:', word);
  },

  removeHighlight: (id) => {
    set((state) => ({
      highlights: state.highlights.filter((h) => h.id !== id),
    }));
    setTimeout(() => get().persist(), 0);
  },

  setPlaying: (isPlaying) => {
    const state = get();
    if (!isPlaying && state.playState.isPlaying) {
      get().updateLastListen();
    }
    set((st) => ({
      playState: { ...st.playState, isPlaying },
    }));
    if (!isPlaying) {
      stopSpeak();
    }
  },

  setCurrentChapter: (chapterId) => {
    const state = get();
    const chapter = state.chapters.find((c) => c.id === chapterId);
    if (state.playState.isPlaying) {
      get().updateLastListen();
    }
    set((st) => ({
      playState: {
        ...st.playState,
        currentChapterId: chapterId,
        currentParagraphIndex: 0,
        currentProgress: 0,
      },
    }));
    setTimeout(() => get().persist(), 0);
    console.log('[Store] 切换播放章节:', chapter?.title || chapterId);
  },

  setCurrentParagraph: (index) => {
    set((state) => ({
      playState: { ...state.playState, currentParagraphIndex: index },
    }));
    setTimeout(() => get().persist(), 0);
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
      setTimeout(() => get().persist(), 0);
    } else {
      const currentIdx = state.chapters.findIndex((c) => c.id === state.playState.currentChapterId);
      if (currentIdx < state.chapters.length - 1) {
        const nextChapter = state.chapters[currentIdx + 1];
        get().updateLastListen();
        set({
          playState: {
            ...state.playState,
            currentChapterId: nextChapter.id,
            currentParagraphIndex: 0,
            currentProgress: 0,
          },
        });
        setTimeout(() => get().persist(), 0);
        console.log('[Store] 自动进入下一章:', nextChapter.title);
        Taro.showToast({
          title: `进入：${nextChapter.title}`,
          icon: 'none',
          duration: 1800,
        });
      } else {
        get().updateLastListen();
        set({
          playState: { ...state.playState, isPlaying: false },
        });
        stopSpeak();
        Taro.showToast({ title: '全部章节已听完 🎉', icon: 'success', duration: 2500 });
        console.log('[Store] 全部章节播放完成');
      }
    }
  },

  prevParagraph: () => {
    const state = get();
    if (state.playState.currentParagraphIndex === 0) {
      const currentIdx = state.chapters.findIndex((c) => c.id === state.playState.currentChapterId);
      if (currentIdx > 0) {
        const prevChapter = state.chapters[currentIdx - 1];
        set({
          playState: {
            ...state.playState,
            currentChapterId: prevChapter.id,
            currentParagraphIndex: Math.max(0, prevChapter.paragraphs.length - 1),
            currentProgress: 0,
          },
        });
        setTimeout(() => get().persist(), 0);
        Taro.showToast({
          title: `上一章：${prevChapter.title}`,
          icon: 'none',
          duration: 1500,
        });
        return;
      }
    }
    const newIndex = Math.max(0, state.playState.currentParagraphIndex - 1);
    set({
      playState: {
        ...state.playState,
        currentParagraphIndex: newIndex,
        currentProgress: 0,
      },
    });
    setTimeout(() => get().persist(), 0);
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
      get().updateLastListen();
      set({
        playState: {
          ...state.playState,
          isPlaying: false,
          sleepTimer: null,
          sleepTimerRemaining: null,
        },
      });
      stopSpeak();
      setTimeout(() => get().persist(), 0);
      console.log('[Store] 睡眠定时结束，停止播放');
    } else {
      set({
        playState: { ...state.playState, sleepTimerRemaining: remaining },
      });
    }
  },

  stopPlay: () => {
    if (get().playState.isPlaying) {
      get().updateLastListen();
    }
    set((state) => ({
      playState: {
        ...state.playState,
        isPlaying: false,
        currentProgress: 0,
      },
    }));
    stopSpeak();
  },

  startFromBeginning: () => {
    const state = get();
    if (state.chapters.length === 0) return;
    const firstChapter = state.chapters[0];
    stopSpeak();
    set({
      playState: {
        ...state.playState,
        currentChapterId: firstChapter.id,
        currentParagraphIndex: 0,
        currentProgress: 0,
        isPlaying: true,
        playFromStart: true,
      },
    });
    setTimeout(() => get().persist(), 0);
    Taro.showToast({
      title: `从头开始：${firstChapter.title}`,
      icon: 'none',
      duration: 1800,
    });
    Taro.vibrateShort({ type: 'medium' }).catch(() => {});
    console.log('[Store] 从头开始播放');
  },

  continueFromLast: () => {
    const state = get();
    const lastListen = state.playState.lastListen;
    if (!lastListen || state.chapters.length === 0) {
      if (state.chapters.length > 0) {
        get().startFromBeginning();
      }
      return;
    }
    const chapterExists = state.chapters.some((c) => c.id === lastListen.chapterId);
    if (!chapterExists) {
      get().startFromBeginning();
      return;
    }
    const chapter = state.chapters.find((c) => c.id === lastListen.chapterId)!;
    const safeParagraphIndex = Math.min(
      lastListen.paragraphIndex,
      Math.max(0, chapter.paragraphs.length - 1)
    );
    stopSpeak();
    set({
      playState: {
        ...state.playState,
        currentChapterId: lastListen.chapterId,
        currentParagraphIndex: safeParagraphIndex,
        currentProgress: 0,
        isPlaying: true,
        playFromStart: false,
      },
    });
    setTimeout(() => get().persist(), 0);
    Taro.showToast({
      title: `继续收听：${lastListen.chapterTitle.slice(0, 10)}...`,
      icon: 'none',
      duration: 1800,
    });
    Taro.vibrateShort({ type: 'medium' }).catch(() => {});
    console.log('[Store] 继续上次收听:', lastListen.chapterTitle, '第', safeParagraphIndex + 1, '段');
  },

  updateLastListen: () => {
    const state = get();
    const chapter = state.chapters.find((c) => c.id === state.playState.currentChapterId);
    if (!chapter) return;
    const paragraph = chapter.paragraphs[state.playState.currentParagraphIndex];
    const record: LastListenRecord = {
      chapterId: chapter.id,
      chapterTitle: chapter.title,
      paragraphIndex: state.playState.currentParagraphIndex,
      paragraphText: paragraph?.text?.slice(0, 30) || '',
      timestamp: Date.now(),
    };
    set((st) => ({
      playState: { ...st.playState, lastListen: record },
    }));
    setTimeout(() => get().persist(), 0);
    console.log('[Store] 更新听书记录:', chapter.title, '第', record.paragraphIndex + 1, '段');
  },
}));
