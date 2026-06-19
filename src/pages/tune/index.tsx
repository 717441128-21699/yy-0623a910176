import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import styles from './index.module.scss';
import { useStore } from '@/store/useStore';
import { voiceOptions, sleepTimerOptions } from '@/data/mockData';
import { VoiceType, HighlightType, VoiceSettings } from '@/types';
import { getSpeedLabel } from '@/utils/textUtils';
import { speakText, stopSpeak, preloadVoices } from '@/utils/tts';
import VoiceOptionCard from '@/components/VoiceOption';
import BigButton from '@/components/BigButton';
import HighlightInput from '@/components/HighlightInput';

const speedLevels = [0, 1, 2, 3, 4, 5, 6];
const speedLabelsShort = ['极慢', '很慢', '稍慢', '正常', '稍快', '较快', '极快'];

const TunePage: React.FC = () => {
  const [previewVoice, setPreviewVoice] = useState<VoiceType | null>(null);
  const [useChapterScope, setUseChapterScope] = useState(false);

  const {
    chapters,
    playState,
    voiceSettings,
    highlights,
    isUsingChapterSettings,
    setVoiceType,
    setSpeedLevel,
    decreaseSpeed,
    setVolume,
    toggleChapterSettings,
    setChapterVoiceSettings,
    resetChapterToGlobal,
    addHighlight,
    removeHighlight,
    setPlaying,
  } = useStore();

  const currentChapter = chapters.find((c) => c.id === playState.currentChapterId);
  const usingChapterSettings = isUsingChapterSettings(playState.currentChapterId);

  useEffect(() => {
    setUseChapterScope(usingChapterSettings);
  }, [usingChapterSettings, playState.currentChapterId]);

  const currentVoiceSettings = useMemo<VoiceSettings>(() => {
    if (useChapterScope && currentChapter?.chapterVoiceSettings) {
      return currentChapter.chapterVoiceSettings;
    }
    return voiceSettings;
  }, [useChapterScope, currentChapter, voiceSettings]);

  useEffect(() => {
    preloadVoices();
    return () => {
      stopSpeak();
    };
  }, []);

  const applyChange = (updater: (s: VoiceSettings) => VoiceSettings) => {
    if (useChapterScope && currentChapter) {
      const newSettings = updater(currentChapter.chapterVoiceSettings || voiceSettings);
      setChapterVoiceSettings(currentChapter.id, newSettings);
      if (!currentChapter.useChapterSettings) {
        toggleChapterSettings(currentChapter.id, true);
      }
    } else {
      setVoiceType_updater(updater);
    }
  };

  const setVoiceType_updater = (updater: (s: VoiceSettings) => VoiceSettings | VoiceType) => {
    if (useChapterScope && currentChapter) {
      const base = currentChapter.chapterVoiceSettings || voiceSettings;
      const result = updater(base);
      const newSettings: VoiceSettings = typeof result === 'string'
        ? { ...base, voiceType: result as VoiceType }
        : (result as VoiceSettings);
      setChapterVoiceSettings(currentChapter.id, newSettings);
      if (!currentChapter.useChapterSettings) {
        toggleChapterSettings(currentChapter.id, true);
      }
    } else {
      const result = updater(voiceSettings);
      if (typeof result === 'string') {
        setVoiceType(result as VoiceType);
      } else {
        setVoiceType((result as VoiceSettings).voiceType);
        setSpeedLevel((result as VoiceSettings).speedLevel);
        setVolume((result as VoiceSettings).volume);
      }
    }
  };

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
      currentVoiceSettings.speedLevel,
      currentVoiceSettings.volume,
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

  const handleSelectVoice = (type: VoiceType) => {
    setVoiceType_updater((s) => typeof s === 'object' ? { ...s, voiceType: type } : type);
    Taro.vibrateShort({ type: 'light' }).catch(() => {});
  };

  const handleSpeedClick = (level: number) => {
    if (useChapterScope && currentChapter) {
      const base = currentChapter.chapterVoiceSettings || voiceSettings;
      setChapterVoiceSettings(currentChapter.id, { ...base, speedLevel: level });
      if (!currentChapter.useChapterSettings) {
        toggleChapterSettings(currentChapter.id, true);
      }
    } else {
      setSpeedLevel(level);
    }
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
            level,
            currentVoiceSettings.volume,
            () => {
              setPreviewVoice((prev) => (prev === previewVoice ? null : prev));
            }
          );
        }, 200);
      }
    }
  };

  const handleDecreaseSpeed = () => {
    const newLevel = Math.max(0, currentVoiceSettings.speedLevel);
    if (useChapterScope && currentChapter) {
      const base = currentChapter.chapterVoiceSettings || voiceSettings;
      const level = Math.max(0, base.speedLevel - 1);
      setChapterVoiceSettings(currentChapter.id, { ...base, speedLevel: level });
      if (!currentChapter.useChapterSettings) {
        toggleChapterSettings(currentChapter.id, true);
      }
    } else {
      decreaseSpeed();
    }
    Taro.showToast({
      title: `语速已降至：${getSpeedLabel(Math.max(0, newLevel))}`,
      icon: 'none',
      duration: 1500,
    });
    Taro.vibrateShort({ type: 'light' }).catch(() => {});

    if (previewVoice) {
      stopSpeak();
      const opt = voiceOptions.find((v) => v.type === previewVoice);
      if (opt) {
        const previewText = currentChapter?.paragraphs[0]?.text?.slice(0, 40) || opt.sample;
        const level = Math.max(0, currentVoiceSettings.speedLevel - 1);
        setTimeout(() => {
          speakText(
            previewText,
            previewVoice,
            level,
            currentVoiceSettings.volume,
            () => {
              setPreviewVoice((prev) => (prev === previewVoice ? null : prev));
            }
          );
        }, 200);
      }
    }
  };

  const handleIncreaseSpeed = () => {
    const newLevel = Math.min(6, currentVoiceSettings.speedLevel + 1);
    if (useChapterScope && currentChapter) {
      const base = currentChapter.chapterVoiceSettings || voiceSettings;
      setChapterVoiceSettings(currentChapter.id, { ...base, speedLevel: newLevel });
      if (!currentChapter.useChapterSettings) {
        toggleChapterSettings(currentChapter.id, true);
      }
    } else {
      setSpeedLevel(newLevel);
    }
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
            currentVoiceSettings.volume,
            () => {
              setPreviewVoice((prev) => (prev === previewVoice ? null : prev));
            }
          );
        }, 200);
      }
    }
  };

  const handleVolumePreset = (vol: number) => {
    if (useChapterScope && currentChapter) {
      const base = currentChapter.chapterVoiceSettings || voiceSettings;
      setChapterVoiceSettings(currentChapter.id, { ...base, volume: vol });
      if (!currentChapter.useChapterSettings) {
        toggleChapterSettings(currentChapter.id, true);
      }
    } else {
      setVolume(vol);
    }
    Taro.vibrateShort({ type: 'light' }).catch(() => {});
  };

  const handleScopeChange = (toChapter: boolean) => {
    if (toChapter && currentChapter) {
      if (!currentChapter.useChapterSettings) {
        Taro.showModal({
          title: '为本章单独设置',
          content: '将复制当前全局设置作为本章的独立设置，之后修改不会影响其他章节。',
          confirmText: '确认',
          confirmColor: '#9C27B0',
          success: (res) => {
            if (res.confirm) {
              toggleChapterSettings(currentChapter.id, true);
              setUseChapterScope(true);
              Taro.vibrateShort({ type: 'light' }).catch(() => {});
            }
          },
        });
      } else {
        setUseChapterScope(true);
        Taro.vibrateShort({ type: 'light' }).catch(() => {});
      }
    } else {
      setUseChapterScope(false);
      Taro.vibrateShort({ type: 'light' }).catch(() => {});
    }
  };

  const handleCopyGlobalToChapter = () => {
    if (!currentChapter) return;
    Taro.showModal({
      title: '复制全局设置',
      content: `将当前全局设置（${voiceOptions.find(v => v.type === voiceSettings.voiceType)?.name}·${getSpeedLabel(voiceSettings.speedLevel)}）覆盖到本章独立设置？`,
      confirmText: '复制',
      confirmColor: '#1976D2',
      success: (res) => {
        if (res.confirm) {
          setChapterVoiceSettings(currentChapter.id, { ...voiceSettings });
          toggleChapterSettings(currentChapter.id, true);
          setUseChapterScope(true);
          Taro.showToast({ title: '已复制到本章', icon: 'success' });
          Taro.vibrateShort({ type: 'light' }).catch(() => {});
        }
      },
    });
  };

  const handleResetChapter = () => {
    if (!currentChapter) return;
    Taro.showModal({
      title: '恢复使用全局设置',
      content: '将清除本章独立的声音设置，改为使用全局统一设置。',
      confirmText: '恢复',
      confirmColor: '#C62828',
      success: (res) => {
        if (res.confirm) {
          resetChapterToGlobal(currentChapter.id);
          setUseChapterScope(false);
          Taro.showToast({ title: '已恢复全局设置', icon: 'success' });
          Taro.vibrateShort({ type: 'light' }).catch(() => {});
        }
      },
    });
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
    Taro.showToast({
      title: useChapterScope ? '本章设置已保存' : '全局设置已保存',
      icon: 'success',
    });
    Taro.vibrateShort({ type: 'light' }).catch(() => {});
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

  const hasCustomSettings = !!(currentChapter.useChapterSettings && currentChapter.chapterVoiceSettings);

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
              🔊 约 {currentChapter.paragraphs.length * 2} 分钟
            </Text>
            <Text className={styles.chapterInfoItem}>
              {hasCustomSettings ? '⭐ 有独立设置' : '🌐 使用全局设置'}
            </Text>
          </View>
        </View>

        <View className={styles.settingsScopeCard}>
          <Text className={styles.scopeTitle}>
            🛠️ 设置作用范围
            <Text style={{ fontSize: '24rpx', color: '#888', fontWeight: 'normal', marginLeft: '12rpx' }}>
              {useChapterScope ? '修改仅影响本章' : '修改会影响所有章节'}
            </Text>
          </Text>
          <View className={styles.scopeRow}>
            <View
              className={classnames(
                styles.scopeOption,
                styles.scopeGlobal,
                { [styles.scopeOptionActive]: !useChapterScope }
              )}
              onClick={() => handleScopeChange(false)}
            >
              <Text className={styles.scopeOptionTitle}>
                <Text className={styles.scopeIcon}>🌐</Text>
                全局统一设置
              </Text>
              <Text className={styles.scopeOptionSub}>所有章节用同一套声音</Text>
            </View>
            <View
              className={classnames(
                styles.scopeOption,
                styles.scopeChapter,
                { [styles.scopeOptionActive]: useChapterScope }
              )}
              onClick={() => handleScopeChange(true)}
            >
              <Text className={styles.scopeOptionTitle}>
                <Text className={styles.scopeIcon}>⭐</Text>
                本章独立设置
              </Text>
              <Text className={styles.scopeOptionSub}>武侠换男声/言情换女声</Text>
            </View>
          </View>

          {hasCustomSettings && (
            <View className={styles.scopeActions}>
              <View
                className={classnames(styles.scopeActionBtn, styles.scopeActionCopy)}
                onClick={handleCopyGlobalToChapter}
              >
                <Text className={styles.scopeActionText}>📋 复制全局到本章</Text>
              </View>
              <View
                className={classnames(styles.scopeActionBtn, styles.scopeActionReset)}
                onClick={handleResetChapter}
              >
                <Text className={styles.scopeActionText}>↩️ 恢复全局设置</Text>
              </View>
            </View>
          )}
        </View>

        <View className={styles.section}>
          <View className={styles.sectionTitle}>
            <Text className={styles.title}>🎙️ 选择声音</Text>
            <Text className={styles.sub}>
              点击「试听」感受效果（{useChapterScope ? '本章独立' : '全局统一'}）
            </Text>
          </View>

          {voiceOptions.map((opt) => (
            <VoiceOptionCard
              key={opt.type}
              option={opt}
              isSelected={currentVoiceSettings.voiceType === opt.type}
              isPlaying={previewVoice === opt.type}
              onSelect={() => handleSelectVoice(opt.type)}
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
                  {getSpeedLabel(currentVoiceSettings.speedLevel)}
                </View>
              </View>

              <View className={styles.speedLevelRow}>
                {speedLevels.map((level) => (
                  <View
                    key={level}
                    className={classnames(
                      styles.speedLevelBtn,
                      currentVoiceSettings.speedLevel === level ? styles.speedLevelBtnActive : ''
                    )}
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
                  className={classnames(styles.speedActionBtn, styles.speedDownBtn).join(' ')}
                  onClick={handleDecreaseSpeed}
                >
                  <Text className={styles.speedActionIcon}>🐢</Text>
                  <Text className={styles.speedActionText}>再慢一点</Text>
                </View>
                <View
                  className={classnames(styles.speedActionBtn, styles.speedUpBtn).join(' ')}
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
                <Text className={styles.volumeValue}>{currentVoiceSettings.volume}%</Text>
              </View>

              <View className={styles.volumeBar}>
                <View
                  className={styles.volumeBarFill}
                  style={{ width: `${currentVoiceSettings.volume}%` }}
                />
              </View>

              <View className={styles.volumeBtns}>
                {[50, 70, 85, 100].map((vol) => (
                  <View
                    key={vol}
                    className={classnames(
                      styles.volBtn,
                      currentVoiceSettings.volume === vol ? styles.volBtnActive : ''
                    )}
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
              <Text className={styles.tipStrong}>🏡 小提示：</Text>
              播放页面支持
              {sleepTimerOptions.map((t, i) => (
                <Text key={t}>
                  {i > 0 && '、'}
                  <Text className={styles.tipStrong}>{Math.floor(t / 60)}分钟</Text>
                </Text>
              ))}
              睡前定时，还有「从第一章开始」和「继续上次听」入口哦~
            </Text>
          </View>
        </View>

        <View style={{ height: '200rpx' }} />
      </View>

      <View className={styles.bottomBar}>
        <View className={styles.bottomBtnWrap}>
          <BigButton
            text="保存设置"
            subText={useChapterScope ? '仅本章生效' : '全局生效'}
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
