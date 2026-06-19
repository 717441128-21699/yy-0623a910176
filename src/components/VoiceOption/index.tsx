import React from 'react';
import { View, Text } from '@tarojs/components';
import classnames from 'classnames';
import styles from './index.module.scss';
import { VoiceOption as VoiceOptionType } from '@/types';

interface VoiceOptionProps {
  option: VoiceOptionType;
  isSelected: boolean;
  isPlaying?: boolean;
  onSelect: () => void;
  onPreview?: () => void;
}

const VoiceOption: React.FC<VoiceOptionProps> = ({
  option,
  isSelected,
  isPlaying = false,
  onSelect,
  onPreview,
}) => {
  const handleClick = () => {
    onSelect();
  };

  const handlePreviewClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onPreview?.();
  };

  const getVoiceIcon = () => {
    switch (option.type) {
      case 'slow': return '🐢';
      case 'female': return '👩';
      case 'male': return '👨';
      case 'dialect': return '🏡';
      default: return '🔊';
    }
  };

  return (
    <View
      className={classnames(styles.card, {
        [styles.selected]: isSelected,
      })}
      onClick={handleClick}
    >
      <View className={styles.topRow}>
        <View className={styles.iconWrap}>
          <Text className={styles.icon}>{getVoiceIcon()}</Text>
        </View>
        <View className={styles.info}>
          <Text className={styles.name}>{option.name}</Text>
          <Text className={styles.desc}>{option.description}</Text>
        </View>
        <View
          className={classnames(styles.checkbox, {
            [styles.checked]: isSelected,
          })}
        >
          {isSelected && <Text className={styles.checkMark}>✓</Text>}
        </View>
      </View>

      <View className={styles.bottomRow}>
        <View className={styles.sampleWrap}>
          <Text className={styles.sampleLabel}>示例：</Text>
          <Text className={styles.sampleText}>"{option.sample}"</Text>
        </View>
        <View
          className={classnames(styles.previewBtn, {
            [styles.previewPlaying]: isPlaying,
          })}
          onClick={handlePreviewClick}
        >
          <Text className={styles.previewText}>
            {isPlaying ? '试听中...' : '试听'}
          </Text>
        </View>
      </View>
    </View>
  );
};

export default VoiceOption;
