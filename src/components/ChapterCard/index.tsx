import React from 'react';
import { View, Text } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import styles from './index.module.scss';
import { Chapter } from '@/types';
import { formatDate } from '@/utils/textUtils';

interface ChapterCardProps {
  chapter: Chapter;
  isActive?: boolean;
  isPlaying?: boolean;
  onSelect?: (chapter: Chapter) => void;
  onDelete?: (id: string) => void;
  onPlay?: (chapter: Chapter) => void;
}

const ChapterCard: React.FC<ChapterCardProps> = ({
  chapter,
  isActive = false,
  isPlaying = false,
  onSelect,
  onDelete,
  onPlay,
}) => {
  const handleCardClick = () => {
    onSelect?.(chapter);
  };

  const handlePlayClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onPlay?.(chapter);
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    Taro.showModal({
      title: '确认删除',
      content: `确定要删除《${chapter.title}》吗？`,
      confirmColor: '#FF6B35',
      success: (res) => {
        if (res.confirm) {
          onDelete?.(chapter.id);
          Taro.showToast({ title: '已删除', icon: 'success' });
        }
      },
    });
  };

  return (
    <View
      className={classnames(styles.card, {
        [styles.active]: isActive,
        [styles.playing]: isPlaying,
      })}
      onClick={handleCardClick}
    >
      <View className={styles.header}>
        <View className={styles.titleRow}>
          <View className={classnames(styles.statusDot, {
            [styles.statusPlaying]: isPlaying,
          })} />
          <Text className={styles.title}>{chapter.title}</Text>
        </View>
        <View className={styles.actions}>
          <View
            className={classnames(styles.playBtn, {
              [styles.playBtnActive]: isPlaying,
            })}
            onClick={handlePlayClick}
          >
            <Text className={styles.playBtnText}>{isPlaying ? '播放中' : '播放'}</Text>
          </View>
        </View>
      </View>

      <View className={styles.preview}>
        <Text className={styles.previewText}>
          {chapter.paragraphs[0]?.text?.slice(0, 50)}...
        </Text>
      </View>

      <View className={styles.footer}>
        <View className={styles.meta}>
          <Text className={styles.metaItem}>📖 {chapter.paragraphs.length}段</Text>
          <Text className={styles.metaItem}>🕐 {formatDate(chapter.createdAt)}</Text>
        </View>
        <View className={styles.deleteBtn} onClick={handleDeleteClick}>
          <Text className={styles.deleteText}>删除</Text>
        </View>
      </View>
    </View>
  );
};

export default ChapterCard;
