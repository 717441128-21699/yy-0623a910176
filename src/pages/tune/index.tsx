import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';
import { useStore } from '@/store/useStore';
import { voiceOptions, sleepTimerOptions } from '@/data/mockData';
import { VoiceType, HighlightType } from '@/types';
import { getSpeedLabel } from '@/utils/textUtils';
import { speakText, stopSpeak, preloadVoices } from '@/utils/tts';
import VoiceOptionCard from '@/components/VoiceOption';
import BigButton from '@/components/BigButton';
import HighlightInput from '@/components/HighlightInput';

const speedLevels = [0, 1, 2, 3, 4, 5, 6];
const speedLabelsShort = ['极慢', '很慢', '稍慢', '正常', '稍快', '较快', '极快'];

const TunePage: React.FC = () => {
  const [previewVoice, setPreviewVoice] = useState<VoiceType | null>(null);

  const {
    chapters,
    playState,
    voiceSettings,
    highlights,
    setVoiceType,
    setSpeedLevel,
    decreaseSpeed,
    setVolume,
    addHighlight,
    removeHighlight,
    setPlaying,
  } = useStore();

  const currentChapter = chapters.find((c) => c.id === playState.currentChapterId);

  useEffect(() => {
    preloadVoices();
    return () => {
      stopSpeak();
    };
  }, []);

  const handlePreview = (type: VoiceType) => {
    if (previewVoice === type) {
      setPreviewVoice(null);
      stopSpeak();
      return;
    }

    const opt = voiceOptions.find((v) => v.type === type);
    if (!opt) return;

    stopSpeak();
    setPreviewVoice(type);

    const previewText = currentChapter?.paragraphs[0]?.text?.slice(0, 40) || opt.sample;

    speakText(
      previewText,
      type,
      voiceSettings.speedLevel,
      voiceSettings.volume,
      () => {
        console.log('[Tune] 试听完成:', type);
        setPreviewVoice((prev) => (prev === type ? null : prev));
      },
      () => {
        console.log('[Tune] 试听开始:', type);
      }
    );

    Taro.showToast({
      title: opt.name + ' 试听中',
      icon: 'none',
      duration: 2000,
    });
    Taro.vibrateShort({ type: 'light' }).catch(() => {});
  };

  const handleSpeedClick = (level: number) => {
    setSpeedLevel(level);
    Taro.vibrateShort({ type: 'light' }).catch(() => {});
  };

  const handleDecreaseSpeed = () => {
    decreaseSpeed();
    const newLevel = Math.max(0, voiceSettings.speedLevel);
    Taro.showToast({
      title: `语速已降至：${getSpeedLabel(newLevel)}`,
      icon: 'none',
      duration: 1500,
    });
    Taro.vibrateShort({ type: 'light' }).catch(() => {});

    if (previewVoice) {
      stopSpeak();
      const opt = voiceOptions.find((v) => v.type === previewVoice);
      if (opt) {
        const previewText = currentChapter?.paragraphs[0]?.text?.slice(0, 40) || opt.sample;
        setTimeout(() => {
          speakText(
            previewText,
            previewVoice,
            newLevel,
            voiceSettings.volume,
            () => {
              setPreviewVoice((prev) => (prev === previewVoice ? null : prev));
            }
          );
        }, 200);
      }
    }
  };

  const handleIncreaseSpeed = () => {
    const newLevel = Math.min(6, voiceSettings.speedLevel + 1);
    setSpeedLevel(newLevel);
    Taro.vibrateShort({ type: 'light' }).catch(() => {});

    if (previewVoice) {
      stopSpeak();
      const opt = voiceOptions.find((v) => v.type === previewVoice);
      if (opt) {
        const previewText = currentChapter?.paragraphs[0]?.text?.slice(0, 40) || opt.sample;
        setTimeout(() => {
          speakText(
            previewText,
            previewVoice,
            newLevel,
            voiceSettings.volume,
            () => {
              setPreviewVoice((prev) => (prev === previewVoice ? null : prev));
            }
          );
        }, 200);
      }
    }
  };

  const handleVolumePreset = (vol: number) => {
    setVolume(vol);
    Taro.vibrateShort({ type: 'light' }).catch(() => {});
  };

  const handleAddHighlight = (word: string, type: HighlightType) => {
    addHighlight(word, type);
    Taro.vibrateShort({ type: 'light' }).catch(() => {});
  };

  const handleRemoveHighlight = (id: string) => {
    removeHighlight(id);
  };

  const handleSaveAndPlay = () => {
    if (!currentChapter) {
      Taro.showToast({ title: '请先选择章节', icon: 'none' });
      Taro.switchTab({ url: '/pages/select/index' }).catch(() => {});
      return;
    }
    stopSpeak();
    setPreviewVoice(null);
    setPlaying(true);
    Taro.showToast({ title: '设置已生效，开始播放', icon: 'success' });
    Taro.vibrateShort({ type: 'medium' }).catch(() => {});
    setTimeout(() => {
      Taro.switchTab({ url: '/pages/play/index' }).catch(() => {});
    }, 800);
    console.log('[Tune] 保存设置并开始播放');
  };

  const handleSaveOnly = () => {
    stopSpeak();
    setPreviewVoice(null);
    Taro.showToast({ title: '设置已保存', icon: 'success' });
    Taro.vibrateShort({ type: 'light' }).catch(() => {});
    console.log('[Tune] 仅保存设置');
  };

  const goToSelect = () => {
    stopSpeak();
    Taro.switchTab({ url: '/pages/select/index' }).catch(() => {});
  };

  if (!currentChapter) {
    return (
      <ScrollView scrollY className={styles.page}>
        <View className="page-container">
          <View className={styles.emptyState}>
            <Text className={styles.emptyIcon}>📖</Text>
            <Text className={styles.emptyText}>
              还没有选择要配音的章节哦~{'\n'}请先到「选文」页面选择或添加章节
            </Text>
            <BigButton
              text="去选文"
              icon="📝"
              onClick={goToSelect}
              variant="primary"
              size="large"
              fullWidth
            />
          </View>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView scrollY className={styles.page}>
      <View className="page-container">
        <View className={styles.currentChapterCard}>
          <Text className={styles.chapterLabel}>🎯 当前章节</Text>
          <Text className={styles.chapterName}>{currentChapter.title}</Text>
          <View className={styles.chapterInfo}>
            <Text className={styles.chapterInfoItem}>
              📖 {currentChapter.paragraphs.length} 段
            </Text>
            <Text className={styles.chapterInfoItem}>
              🔊 估计时长约 {currentChapter.paragraphs.length * 2} 分钟
            </Text>
          </View>
        </View>

        <View className={styles.section}>
          <View className={styles.sectionTitle}>
            <Text className={styles.title}>🎙️ 选择声音</Text>
            <Text className={styles.sub}>点击「试听」感受不同的声音效果（真的能听到哦！）</Text>
          </View>

          {voiceOptions.map((opt) => (
            <VoiceOptionCard
              key={opt.type}
              option={opt}
              isSelected={voiceSettings.voiceType === opt.type}
              isPlaying={previewVoice === opt.type}
              onSelect={() => {
                setVoiceType(opt.type);
                Taro.vibrateShort({ type: 'light' }).catch(() => {});
              }}
              onPreview={() => handlePreview(opt.type)}
            />
          ))}
        </View>

        <View className={styles.section}>
          <View className={styles.settingsCard}>
            <View className={styles.speedControl}>
              <View className={styles.speedHeader}>
                <Text className={styles.speedTitle}>⏱️ 语速调节</Text>
                <View className={styles.speedLabel}>
                  {getSpeedLabel(voiceSettings.speedLevel)}
                </View>
              </View>

              <View className={styles.speedLevelRow}>
                {speedLevels.map((level) => (
                  <View
                    key={level}
                    className={[
                      styles.speedLevelBtn,
                      voiceSettings.speedLevel === level ? styles.speedLevelBtnActive : '',
                    ].join(' ')}
                    onClick={() => handleSpeedClick(level)}
                  >
                    <Text className={styles.speedLevelText}>
                      {speedLabelsShort[level]}
                    </Text>
                  </View>
                ))}
              </View>

              <View className={styles.tipCard}>
                <Text className={styles.tipText}>
                  <Text className={styles.tipStrong}>💡 贴心提示：</Text>
                  老人说听不清？直接点下面的「再慢一点」按钮，可以反复降速直到清晰为止。正在试听时调整语速会立即生效！
                </Text>
              </View>

              <View className={styles.speedActionRow}>
                <View
                  className={[styles.speedActionBtn, styles.speedDownBtn].join(' ')}
                  onClick={handleDecreaseSpeed}
                >
                  <Text className={styles.speedActionIcon}>🐢</Text>
                  <Text className={styles.speedActionText}>再慢一点</Text>
                </View>
                <View
                  className={[styles.speedActionBtn, styles.speedUpBtn].join(' ')}
                  onClick={handleIncreaseSpeed}
                >
                  <Text className={styles.speedActionIcon}>🐇</Text>
                  <Text className={styles.speedActionText}>稍快一点</Text>
                </View>
              </View>
            </View>

            <View className={styles.volumeSection}>
              <View className={styles.volumeHeader}>
                <Text className={styles.volumeTitle}>🔊 音量大小</Text>
                <Text className={styles.volumeValue}>{voiceSettings.volume}%</Text>
              </View>

              <View className={styles.volumeBar}>
                <View
                  className={styles.volumeBarFill}
                  style={{ width: `${voiceSettings.volume}%` }}
                />
              </View>

              <View className={styles.volumeBtns}>
                {[50, 70, 85, 100].map((vol) => (
                  <View
                    key={vol}
                    className={[
                      styles.volBtn,
                      voiceSettings.volume === vol ? styles.volBtnActive : '',
                    ].join(' ')}
                    onClick={() => handleVolumePreset(vol)}
                  >
                    <Text className={styles.volBtnText}>{vol}%</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        </View>

        <View className={styles.section}>
          <HighlightInput
            highlights={highlights}
            onAdd={handleAddHighlight}
            onRemove={handleRemoveHighlight}
          />
        </View>

        <View className={styles.section}>
          <View className={styles.tipCard}>
            <Text className={styles.tipText}>
              <Text className={styles.tipStrong}>🏡 关于定时：</Text>
              播放页面支持
              {sleepTimerOptions.map((t, i) => (
                <Text key={t}>
                  {i > 0 && '、'}
                  <Text className={styles.tipStrong}>{Math.floor(t / 60)}分钟</Text>
                </Text>
              ))}
              等多种睡前定时选项，到点自动停止。
            </Text>
          </View>
        </View>

        <View style={{ height: '200rpx' }} />
      </View>

      <View className={styles.bottomBar}>
        <View className={styles.bottomBtnWrap}>
          <BigButton
            text="保存设置"
            subText="稍后再听"
            onClick={handleSaveOnly}
            variant="secondary"
            size="large"
            fullWidth
          />
        </View>
        <View className={styles.bottomBtnWrap}>
          <BigButton
            text="▶ 开始听"
            subText="用这些设置播放"
            onClick={handleSaveAndPlay}
            variant="success"
            size="large"
            fullWidth
          />
        </View>
      </View>
    </ScrollView>
  );
};

export default TunePage;
