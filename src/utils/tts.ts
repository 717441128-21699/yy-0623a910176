import Taro from '@tarojs/taro';
import { VoiceType } from '@/types';
import { speedLevelToRate } from './textUtils';

let globalUtterance: SpeechSynthesisUtterance | null = null;
let isSpeaking = false;

const getVoicePitch = (type: VoiceType): number => {
  switch (type) {
    case 'female':
      return 1.25;
    case 'male':
      return 0.75;
    case 'dialect':
      return 1.05;
    case 'slow':
    default:
      return 1.0;
  }
};

const getVoiceRateMultiplier = (type: VoiceType): number => {
  switch (type) {
    case 'slow':
      return 0.85;
    case 'dialect':
      return 0.9;
    case 'male':
      return 0.95;
    case 'female':
    default:
      return 1.0;
  }
};

export const speakText = (
  text: string,
  voiceType: VoiceType = 'slow',
  speedLevel: number = 2,
  volume: number = 85,
  onEnd?: () => void,
  onStart?: () => void
): void => {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    console.warn('[TTS] 当前环境不支持语音合成');
    setTimeout(() => onStart?.(), 100);
    const estimatedDuration = Math.max(1500, text.length * 180 / speedLevelToRate(speedLevel));
    setTimeout(() => {
      isSpeaking = false;
      onEnd?.();
    }, estimatedDuration);
    return;
  }

  try {
    stopSpeak();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'zh-CN';
    utterance.volume = Math.max(0, Math.min(1, volume / 100));
    utterance.rate = speedLevelToRate(speedLevel) * getVoiceRateMultiplier(voiceType);
    utterance.pitch = getVoicePitch(voiceType);

    const voices = window.speechSynthesis.getVoices();
    const zhVoices = voices.filter((v) => v.lang && v.lang.toLowerCase().startsWith('zh'));

    if (zhVoices.length > 0) {
      let selectedVoice = zhVoices[0];
      switch (voiceType) {
        case 'female':
          selectedVoice = zhVoices.find((v) =>
            /female|woman|girl|xiaoxiao|yaoyao|tingting|hui/i.test(v.name)
          ) || zhVoices.find((v) => !/male|man|boy|kangkang|yunyang|yunjian/i.test(v.name)) || zhVoices[0];
          break;
        case 'male':
          selectedVoice = zhVoices.find((v) =>
            /male|man|boy|kangkang|yunyang|yunjian|yunxi/i.test(v.name)
          ) || zhVoices[zhVoices.length - 1];
          break;
        case 'dialect':
          selectedVoice = zhVoices.find((v) =>
            /HK|HongKong|cantonese|TW|Taiwan|方言|粤语|台湾/i.test(v.name + v.lang)
          ) || zhVoices[Math.floor(zhVoices.length / 2)];
          break;
        case 'slow':
        default:
          selectedVoice = zhVoices.find((v) =>
            /default|normal|standard|xiaoyi/i.test(v.name)
          ) || zhVoices[0];
          break;
      }
      if (selectedVoice) {
        utterance.voice = selectedVoice;
      }
    }

    utterance.onstart = () => {
      isSpeaking = true;
      onStart?.();
    };

    utterance.onend = () => {
      isSpeaking = false;
      globalUtterance = null;
      onEnd?.();
    };

    utterance.onerror = (e) => {
      console.error('[TTS] 语音播放错误:', e);
      isSpeaking = false;
      globalUtterance = null;
      onEnd?.();
    };

    utterance.onpause = () => {
      isSpeaking = false;
    };

    utterance.onresume = () => {
      isSpeaking = true;
    };

    globalUtterance = utterance;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
    console.log('[TTS] 开始朗读:', text.slice(0, 30) + '...', '语音类型:', voiceType, '语速:', utterance.rate);
  } catch (error) {
    console.error('[TTS] 初始化语音失败:', error);
    setTimeout(() => onStart?.(), 100);
    const estimatedDuration = Math.max(2000, text.length * 200);
    setTimeout(() => {
      isSpeaking = false;
      onEnd?.();
    }, estimatedDuration);
  }
};

export const stopSpeak = (): void => {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel();
    } catch (e) {
      console.error('[TTS] 停止语音失败:', e);
    }
  }
  isSpeaking = false;
  globalUtterance = null;
};

export const pauseSpeak = (): void => {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      window.speechSynthesis.pause();
    } catch (e) {
      console.error('[TTS] 暂停语音失败:', e);
    }
  }
  isSpeaking = false;
};

export const resumeSpeak = (): void => {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      window.speechSynthesis.resume();
      isSpeaking = true;
    } catch (e) {
      console.error('[TTS] 恢复语音失败:', e);
    }
  }
};

export const isTtsSpeaking = (): boolean => {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    return window.speechSynthesis.speaking || isSpeaking;
  }
  return isSpeaking;
};

export const preloadVoices = (): void => {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.getVoices();
    if (typeof window.speechSynthesis.onvoiceschanged !== 'undefined') {
      window.speechSynthesis.onvoiceschanged = () => {
        const voices = window.speechSynthesis.getVoices();
        console.log('[TTS] 可用语音数量:', voices.length);
        voices.forEach((v, i) => {
          if (v.lang && v.lang.toLowerCase().startsWith('zh')) {
            console.log(`[TTS] 中文语音 ${i + 1}:`, v.name, v.lang);
          }
        });
      };
    }
  }
};
