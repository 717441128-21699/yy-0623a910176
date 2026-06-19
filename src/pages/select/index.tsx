import React, { useState, useMemo } from 'react';
import { View, Text, Textarea, Input, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';
import { useStore } from '@/store/useStore';
import { Chapter } from '@/types';
import { parseTextToParagraphs } from '@/utils/textUtils';
import BigButton from '@/components/BigButton';
import ChapterCard from '@/components/ChapterCard';

const SelectPage: React.FC = () => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [showPreview, setShowPreview] = useState(false);

  const {
    chapters,
    addChapter,
    deleteChapter,
    setCurrentEditingChapter,
    playState,
    setCurrentChapter,
    setPlaying,
  } = useStore();

  const paragraphs = useMemo(() => parseTextToParagraphs(content), [content]);

  const handlePaste = async () => {
    try {
      const res = await Taro.getClipboardData();
      if (res.data && res.data.trim()) {
        setContent(res.data);
        setShowPreview(true);
        Taro.showToast({
          title: `已粘贴 ${res.data.length} 字`,
          icon: 'success',
        });
        console.log('[Select] 从剪贴板粘贴:', res.data.length, '字');
      } else {
        Taro.showToast({ title: '剪贴板是空的', icon: 'none' });
      }
    } catch (error) {
      console.error('[Select] 读取剪贴板失败:', error);
      Taro.showToast({ title: '读取失败，请手动输入', icon: 'none' });
    }
  };

  const handleSave = () => {
    if (!content.trim()) {
      Taro.showToast({ title: '请输入或粘贴内容', icon: 'none' });
      return;
    }
    const chapter = addChapter(title || '未命名章节', content);
    setTitle('');
    setContent('');
    setShowPreview(false);
    Taro.showToast({
      title: `已保存 ${chapter.paragraphs.length} 段`,
      icon: 'success',
    });
    Taro.switchTab({ url: '/pages/tune/index' }).catch(() => {});
  };

  const handleSelectChapter = (chapter: Chapter) => {
    setCurrentEditingChapter(chapter);
    setCurrentChapter(chapter.id);
  };

  const handlePlayChapter = (chapter: Chapter) => {
    setCurrentChapter(chapter.id);
    setPlaying(true);
    Taro.switchTab({ url: '/pages/play/index' }).catch(() => {});
  };

  return (
    <ScrollView scrollY className={styles.page}>
      <View className="page-container">
        <View className={styles.section}>
          <View className={styles.sectionTitle}>
            <Text className={styles.title}>📝 新建章节</Text>
          </View>

          <View className={styles.hintCard}>
            <Text className={styles.hintTitle}>💡 使用提示</Text>
            <Text className={styles.hintContent}>
              从小说App复制章节内容，粘贴到下方即可。系统会自动按自然段整理，方便老人逐段收听。
            </Text>
            <View className={styles.tipRow}>
              <Text className={styles.tipTag}>适合乡村小说</Text>
              <Text className={styles.tipTag}>年代故事</Text>
              <Text className={styles.tipTag}>武侠经典</Text>
            </View>
          </View>

          <View className={styles.inputCard}>
            <Text className={styles.label}>章节名称（选填）</Text>
            <Input
              className={styles.titleInput}
              placeholder="如：平凡的世界 第二章"
              placeholderStyle="color: #BBB;"
              value={title}
              onInput={(e) => setTitle(e.detail.value)}
            />

            <Text className={styles.label}>章节内容</Text>
            <View className={styles.textareaWrap}>
              <Textarea
                className={styles.textarea}
                placeholder="请粘贴或输入小说内容...&#10;&#10;自然段之间请空一行，系统会自动分段整理。"
                placeholderStyle="color: #BBB; line-height: 1.8;"
                value={content}
                onInput={(e) => {
                  setContent(e.detail.value);
                  setShowPreview(true);
                }}
                autoHeight
                maxlength={-1}
              />
              <View className={styles.textareaFooter}>
                <Text className={styles.charCount}>
                  共 {content.length} 字 / {paragraphs.length} 段
                </Text>
              </View>
            </View>

            <View className={styles.actionRow}>
              <View className={styles.btnWrap}>
                <BigButton
                  text="📋 粘贴"
                  subText="从剪贴板导入"
                  onClick={handlePaste}
                  variant="secondary"
                  size="large"
                  fullWidth
                />
              </View>
              <View className={styles.btnWrap}>
                <BigButton
                  text="✨ 整理并保存"
                  subText={`${paragraphs.length}个自然段`}
                  onClick={handleSave}
                  variant="primary"
                  size="large"
                  disabled={!content.trim()}
                  fullWidth
                />
              </View>
            </View>
          </View>

          {showPreview && paragraphs.length > 0 && (
            <View className={styles.previewCard}>
              <View className={styles.previewHeader}>
                <Text className={styles.previewTitle}>📖 自然段预览</Text>
                <Text className={styles.previewBadge}>
                  已自动分成 {paragraphs.length} 段
                </Text>
              </View>
              <ScrollView scrollY className={styles.paragraphList}>
                {paragraphs.slice(0, 6).map((p, idx) => (
                  <View key={p.id} className={styles.paragraphItem}>
                    <Text className={styles.paragraphIndex}>第 {idx + 1} 段</Text>
                    <Text className={styles.paragraphText}>{p.text}</Text>
                  </View>
                ))}
                {paragraphs.length > 6 && (
                  <View className={styles.emptyTip}>
                    <Text className={styles.emptyTipText}>
                      ...还有 {paragraphs.length - 6} 段，保存后可完整查看
                    </Text>
                  </View>
                )}
              </ScrollView>
            </View>
          )}

          {showPreview && paragraphs.length === 0 && content.length > 0 && (
            <View className={styles.emptyTip}>
              <Text className={styles.emptyTipText}>
                ⚠️ 未能检测到自然段，请在段落之间空一行
              </Text>
            </View>
          )}
        </View>

        <View className={styles.section}>
          <View className={styles.sectionTitle}>
            <Text className={styles.title}>📚 已保存章节</Text>
            <Text className={styles.count}>{chapters.length} 章</Text>
          </View>

          {chapters.length === 0 ? (
            <View className={styles.inputCard}>
              <View className={styles.emptyTip}>
                <Text className={styles.emptyTipText}>
                  还没有章节哦~ 快从上方粘贴老人喜欢的小说吧！
                </Text>
              </View>
            </View>
          ) : (
            chapters.map((chapter) => (
              <ChapterCard
                key={chapter.id}
                chapter={chapter}
                isActive={playState.currentChapterId === chapter.id}
                isPlaying={playState.currentChapterId === chapter.id && playState.isPlaying}
                onSelect={handleSelectChapter}
                onDelete={deleteChapter}
                onPlay={handlePlayChapter}
              />
            ))
          )}
        </View>
      </View>
    </ScrollView>
  );
};

export default SelectPage;
