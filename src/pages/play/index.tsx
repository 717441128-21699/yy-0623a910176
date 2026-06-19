import React, { useEffect, useRef, useMemo, useState } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import styles from './index.module.scss';
import { useStore } from '@/store/useStore';
import { sleepTimerOptions, voiceOptions } from '@/data/mockData';
import { formatTimerRemaining, getSpeedLabel, formatDate } from '@/utils/textUtils';
import { speakText, stopSpeak, preloadVoices } from '@/utils/tts';
import BigButton from '@/components/BigButton';
import { Chapter } from '@/types';

const PlayPage: React.FC = () => {
  const {
    chapters,
    playState,
    voiceSettings,
    highlights,
    getEffectiveVoice,
    isUsingChapterSettings,
    setPlaying,
    setCurrentChapter,
    setCurrentParagraph,
    nextParagraph,
    prevParagraph,
    setSleepTimer,
    decrementSleepTimer,
    decreaseSpeed,
    startFromBeginning,
    continueFromLast,
  } = useStore();

  const [progress, setProgress] = useState(0);
  const sleepRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const progressRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const currentChapter = chapters.find((c) => c.id === playState.currentChapterId);
  const currentParagraph = currentChapter?.paragraphs[playState.currentParagraphIndex];
  const totalParagraphs = currentChapter?.paragraphs.length || 0;
  const effectiveVoice = getEffectiveVoice(playState.currentChapterId);
  const usingChapterSettings = isUsingChapterSettings(playState.currentChapterId);
  const hasLastListen = !!playState.lastListen && chapters.some((c) => c.id === playState.lastListen?.chapterId);

  const currentVoiceName = useMemo(() => {
    return voiceOptions.find((v) => v.type === effectiveVoice.voiceType)?.name || '标准';
  }, [effectiveVoice.voiceType]);

  useEffect(() => {
    preloadVoices();
  }, []);

  useEffect(() => {
    console.log('[Play] 播放状态变更:', playState.isPlaying, '章节:', playState.currentChapterId, '段落:', playState.currentParagraphIndex);

    if (progressRef.current) {
      clearInterval(progressRef.current);
      progressRef.current = null;
    }

    if (playState.isPlaying && currentParagraph) {
      setProgress(0);

      const textLength = currentParagraph.text.length;
      const estimatedMs = Math.max(3000, textLength * 220);
      const tickInterval = 100;
      const ticks = estimatedMs / tickInterval;
      const increment = 100 / ticks;

      speakText(
        currentParagraph.text,
        effectiveVoice.voiceType,
        effectiveVoice.speedLevel,
        effectiveVoice.volume,
        () => {
          console.log('[Play] 当前段落朗读完成');
          setProgress(100);
          if (progressRef.current) {
            clearInterval(progressRef.current);
            progressRef.current = null;
          }
          setTimeout(() => {
            nextParagraph();
          }, 400);
        },
        () => {
          console.log('[Play] 当前段落开始朗读');
        }
      );

      progressRef.current = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 99) return prev;
          return Math.min(99, prev + increment);
        });
      }, tickInterval);
    } else {
      if (!playState.isPlaying) {
        stopSpeak();
      }
    }

    return () => {
      if (progressRef.current) {
        clearInterval(progressRef.current);
        progressRef.current = null;
      }
    };
  }, [playState.isPlaying, playState.currentParagraphIndex, currentChapter?.id]);

  useEffect(() => {
    if (playState.sleepTimer !== null) {
      sleepRef.current = setInterval(() => {
        decrementSleepTimer();
      }, 1000);
    } else {
      if (sleepRef.current) {
        clearInterval(sleepRef.current);
        sleepRef.current = null;
      }
    }

    return () => {
      if (sleepRef.current) {
        clearInterval(sleepRef.current);
      }
    };
  }, [playState.sleepTimer]);

  useEffect(() => {
    return () => {
      stopSpeak();
    };
  }, []);

  const renderHighlightedText = (text: string) => {
    if (!text) return null;
    const highlightWords = highlights.map((h) => h.word);
    if (highlightWords.length === 0) {
      return <Text>{text}</Text>;
    }

    const pattern = new RegExp(`(${highlightWords.join('|')})`, 'g');
    const parts = text.split(pattern);

    return parts.map((part, idx) => {
      const matched = highlights.find((h) => h.word === part);
      if (matched) {
        const cls = classnames(styles.highlightWord, {
          [styles.nameHighlight]: matched.type === 'name',
          [styles.placeHighlight]: matched.type === 'place',
        });
        return (
          <Text key={idx} className={cls}>
            {part}
          </Text>
        );
      }
      return <Text key={idx}>{part}</Text>;
    });
  };

  const handleTogglePlay = () => {
    if (!currentChapter) {
      Taro.showToast({ title: '请先选择章节', icon: 'none' });
      return;
    }
    const newPlaying = !playState.isPlaying;
    setPlaying(newPlaying);
    Taro.vibrateShort({ type: 'light' }).catch(() => {});
  };

  const handlePrev = () => {
    stopSpeak();
    setProgress(0);
    prevParagraph();
    Taro.vibrateShort({ type: 'light' }).catch(() => {});
  };

  const handleNext = () => {
    stopSpeak();
    setProgress(0);
    nextParagraph();
    Taro.vibrateShort({ type: 'light' }).catch(() => {});
  };

  const handleSelectChapter = (chapter: Chapter) => {
    stopSpeak();
    setProgress(0);
    setCurrentChapter(chapter.id);
    setCurrentParagraph(0);
    setPlaying(true);
    Taro.showToast({ title: `正在播放：${chapter.title}`, icon: 'none' });
    Taro.vibrateShort({ type: 'medium' }).catch(() => {});
  };

  const handleTimerSelect = (seconds: number) => {
    if (playState.sleepTimer === seconds) {
      setSleepTimer(null);
      Taro.showToast({ title: '已取消定时', icon: 'none' });
    } else {
      setSleepTimer(seconds);
      Taro.showToast({
        title: `${Math.floor(seconds / 60)}分钟后自动停止`,
        icon: 'success',
      });
    }
    Taro.vibrateShort({ type: 'light' }).catch(() => {});
  };

  const handleCancelTimer = () => {
    setSleepTimer(null);
    Taro.showToast({ title: '已取消定时', icon: 'none' });
  };

  const handleDecreaseSpeedQuick = () => {
    decreaseSpeed();
    Taro.showToast({
      title: `语速已降低：${getSpeedLabel(effectiveVoice.speedLevel)}`,
      icon: 'none',
    });
    if (playState.isPlaying && currentParagraph) {
      stopSpeak();
      setTimeout(() => {
        const newSpeed = Math.max(0, effectiveVoice.speedLevel - 1);
        speakText(
          currentParagraph.text,
          effectiveVoice.voiceType,
          newSpeed,
          effectiveVoice.volume,
          () => {
            nextParagraph();
          }
        );
      }, 200);
    }
    Taro.vibrateShort({ type: 'light' }).catch(() => {});
  };

  const goToSelect = () => {
    Taro.switchTab({ url: '/pages/select/index' }).catch(() => {});
  };

  const goToTune = () => {
    Taro.switchTab({ url: '/pages/tune/index' }).catch(() => {});
  };

  const formatTimerLabel = (seconds: number) => {
    if (seconds < 3600) {
      return `${Math.floor(seconds / 60)}分`;
    }
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return m === 0 ? `${h}小时` : `${h}h${m}分`;
  };

  if (!currentChapter || chapters.length === 0) {
    return (
      <ScrollView scrollY className={styles.page}>
        <View className={styles.emptyState}>
          <Text className={styles.emptyIcon}>🎧</Text>
          <Text className={styles.emptyTitle}>还没有内容可播放</Text>
          <Text className={styles.emptyDesc}>
            请先到「选文」页面添加{'\n'}老人喜欢的小说章节
          </Text>
          <BigButton
            text="去添加章节"
            icon="📝"
            onClick={goToSelect}
            variant="success"
            size="large"
            fullWidth
          />
        </View>
      </ScrollView>
    );
  }

  const overallProgress = totalParagraphs > 0
    ? ((playState.currentParagraphIndex + progress / 100) / totalParagraphs) * 100
    : 0;

  const currentChapterIdx = chapters.findIndex((c) => c.id === playState.currentChapterId);
  const totalChapters = chapters.length;

  return (
    <ScrollView scrollY className={styles.page}>
      <View className={styles.quickActions}>
        <View
          className={classnames(styles.quickBtn, styles.quickBtnStart)}
          onClick={startFromBeginning}
        >
          <Text className={styles.quickBtnIcon}>🚀</Text>
          <Text className={styles.quickBtnTitle}>从第一章开始</Text>
          <Text className={styles.quickBtnSub}>
            共{totalChapters}章 连续听
          </Text>
        </View>
        <View
          className={classnames(styles.quickBtn, styles.quickBtnContinue)}
          onClick={continueFromLast}
        >
          <Text className={styles.quickBtnIcon}>{hasLastListen ? '⏯️' : '▶️'}</Text>
          <Text className={styles.quickBtnTitle}>
            {hasLastListen ? '继续上次听' : '开始播放'}
          </Text>
          <Text className={styles.quickBtnSub}>
            {hasLastListen ? '接着上次的位置' : `第${currentChapterIdx + 1}章`}
          </Text>
        </View>
      </View>

      {hasLastListen && playState.lastListen && (
        <View className={styles.lastListenCard} onClick={continueFromLast}>
          <Text className={styles.lastListenLabel}>
            📌 上次听到（点击继续）
          </Text>
          <Text className={styles.lastListenContent}>
            {playState.lastListen.chapterTitle} · 第{playState.lastListen.paragraphIndex + 1}段
          </Text>
          <Text className={styles.lastListenDetail}>
            「{playState.lastListen.paragraphText}...」· {formatDate(playState.lastListen.timestamp)}
          </Text>
        </View>
      )}

      <View className={styles.chapterHeader}>
        <View className={styles.headerBadges}>
          <View className={styles.chapterBadge}>
            <Text className={styles.chapterBadgeText}>
              {playState.isPlaying ? '🔊 正在播放' : '⏸️ 已暂停'}
            </Text>
          </View>
          <View
            className={classnames(styles.settingsTag, {
              [styles.settingsTagGlobal]: !usingChapterSettings,
              [styles.settingsTagChapter]: usingChapterSettings,
            })}
          >
            <Text className={styles.settingsTagText}>
              {usingChapterSettings ? '⭐ 本章独立声音' : '🌐 使用全局设置'}
            </Text>
          </View>
        </View>
        <Text className={styles.chapterTitle}>{currentChapter.title}</Text>
        <View className={styles.chapterProgress}>
          <Text className={styles.progressText}>
            第 {currentChapterIdx + 1}/{totalChapters}章 · 第 {playState.currentParagraphIndex + 1}/{totalParagraphs}段
          </Text>
          <Text className={styles.progressSub}>
            {currentChapterIdx < totalChapters - 1 ? '听完自动进入下一章 →' : '最后一章'}
          </Text>
        </View>
      </View>

      <View
        className={classnames(styles.textDisplay, {
          [styles.textDisplayPlaying]: playState.isPlaying,
        })}
      >
        <View className={styles.textHeader}>
          <View className={styles.paragraphIndex}>
            <Text className={styles.paragraphIndexText}>
              📖 第 {playState.currentParagraphIndex + 1} 段
            </Text>
          </View>
          <View className={styles.voiceTag}>
            <Text className={styles.voiceTagText}>
              🎙️ {currentVoiceName} · {getSpeedLabel(effectiveVoice.speedLevel)}
            </Text>
          </View>
        </View>
        <View className={styles.textContent}>
          {currentParagraph ? renderHighlightedText(currentParagraph.text) : ''}
        </View>
      </View>

      <View className={styles.timerSection}>
        <View className={styles.sectionHeader}>
          <Text className={styles.sectionTitle}>🌙 睡前定时停止</Text>
          {playState.sleepTimerRemaining !== null && (
            <View className={styles.timerActive}>
              ⏰ {formatTimerRemaining(playState.sleepTimerRemaining)}
            </View>
          )}
        </View>
        <View className={styles.timerOptions}>
          {sleepTimerOptions.map((t) => (
            <View
              key={t}
              className={classnames(styles.timerOption, {
                [styles.timerOptionActive]: playState.sleepTimer === t,
              })}
              onClick={() => handleTimerSelect(t)}
            >
              <Text className={styles.timerOptionMain}>{formatTimerLabel(t)}</Text>
              <Text className={styles.timerOptionSub}>
                {t === 15 * 60 ? '打个盹' :
                 t === 30 * 60 ? '午休用' :
                 t === 60 * 60 ? '睡前听' :
                 t === 90 * 60 ? '长故事' : '安心睡'}
              </Text>
            </View>
          ))}
        </View>
        {playState.sleepTimer !== null && (
          <View className={styles.timerCancel} onClick={handleCancelTimer}>
            <Text className={styles.timerCancelText}>取消定时</Text>
          </View>
        )}
      </View>

      <View className={styles.controlsSection}>
        <View className={styles.progressBar}>
          <View
            className={styles.progressFill}
            style={{ width: `${overallProgress}%` }}
          />
        </View>
        <View className={styles.progressLabels}>
          <Text className={styles.progressLabel}>开始</Text>
          <Text className={styles.progressLabel}>
            本章 {Math.round(overallProgress)}%
          </Text>
          <Text className={styles.progressLabel}>结束</Text>
        </View>

        <View className={styles.mainControls}>
          <View className={styles.ctrlBtn} onClick={handlePrev}>
            <Text className={styles.ctrlBtnIcon}>⏮</Text>
          </View>
          <View className={styles.playBtn} onClick={handleTogglePlay}>
            <Text
              className={classnames(styles.playBtnIcon, {
                [styles.pausedIcon]: !playState.isPlaying,
              })}
            >
              {playState.isPlaying ? '⏸' : '▶'}
            </Text>
          </View>
          <View className={styles.ctrlBtn} onClick={handleNext}>
            <Text className={styles.ctrlBtnIcon}>⏭</Text>
          </View>
        </View>

        <View className={styles.secondaryControls}>
          <View className={styles.secCtrlBtn} onClick={handleDecreaseSpeedQuick}>
            <Text className={styles.secCtrlIcon}>🐢</Text>
            <Text className={styles.secCtrlText}>再慢一点</Text>
          </View>
          <View className={styles.secCtrlBtn} onClick={goToTune}>
            <Text className={styles.secCtrlIcon}>⚙️</Text>
            <Text className={styles.secCtrlText}>调整设置</Text>
          </View>
        </View>
      </View>

      <View className={styles.chapterListSection}>
        <View className={styles.chapterListHeader}>
          <Text className={styles.chapterListTitle}>📚 章节列表（按顺序连续播放）</Text>
          <Text className={styles.chapterListCount}>
            共 {totalChapters} 章
          </Text>
        </View>
        {chapters.map((ch, idx) => {
          const isActive = ch.id === playState.currentChapterId;
          const isLastListen = playState.lastListen?.chapterId === ch.id;
          const hasCustom = !!(ch.useChapterSettings && ch.chapterVoiceSettings);
          return (
            <View
              key={ch.id}
              className={classnames(styles.chapterItem, {
                [styles.chapterItemActive]: isActive,
              })}
              onClick={() => handleSelectChapter(ch)}
            >
              <View className={styles.chapterItemLeft}>
                <View
                  className={classnames(styles.chapterNum, {
                    [styles.chapterNumActive]: isActive,
                  })}
                >
                  <Text className={styles.chapterNumText}>
                    {isActive && playState.isPlaying ? (
                      <Text className={styles.playingIcon}>🔊</Text>
                    ) : (
                      idx + 1
                    )}
                  </Text>
                </View>
                <View className={styles.chapterItemInfo}>
                  <Text className={styles.chapterItemName}>{ch.title}</Text>
                  <Text className={styles.chapterItemMeta}>
                    {ch.paragraphs.length}段 · 约{ch.paragraphs.length * 2}分钟
                  </Text>
                  <View className={styles.chapterItemBadges}>
                    {hasCustom && (
                      <View className={classnames(styles.chapterBadge, styles.chapterBadgeCustom)}>
                        ⭐ 独立声音
                      </View>
                    )}
                    {isLastListen && (
                      <View className={classnames(styles.chapterBadge, styles.chapterBadgeLast)}>
                        📌 上次听到
                      </View>
                    )}
                  </View>
                </View>
              </View>
            </View>
          );
        })}
      </View>

      <View style={{ height: '60rpx' }} />
    </ScrollView>
  );
};

export default PlayPage;
