import React, { useState } from 'react';
import { View, Text, Input } from '@tarojs/components';
import classnames from 'classnames';
import styles from './index.module.scss';
import { HighlightWord, HighlightType } from '@/types';

interface HighlightInputProps {
  highlights: HighlightWord[];
  onAdd: (word: string, type: HighlightType) => void;
  onRemove: (id: string) => void;
}

const typeOptions: { value: HighlightType; label: string; color: string }[] = [
  { value: 'name', label: '人名', color: '#FF6B35' },
  { value: 'place', label: '地名', color: '#4CAF50' },
  { value: 'custom', label: '自定义', color: '#7E57C2' },
];

const HighlightInput: React.FC<HighlightInputProps> = ({
  highlights,
  onAdd,
  onRemove,
}) => {
  const [inputValue, setInputValue] = useState('');
  const [selectedType, setSelectedType] = useState<HighlightType>('name');

  const handleAdd = () => {
    const word = inputValue.trim();
    if (word) {
      onAdd(word, selectedType);
      setInputValue('');
    }
  };

  const getTypeColor = (type: HighlightType) => {
    return typeOptions.find((o) => o.value === type)?.color || '#888';
  };

  return (
    <View className={styles.wrap}>
      <View className={styles.header}>
        <Text className={styles.title}>📌 重点读音标记</Text>
        <Text className={styles.subTitle}>人名地名会读得更清楚</Text>
      </View>

      <View className={styles.typeRow}>
        {typeOptions.map((opt) => (
          <View
            key={opt.value}
            className={classnames(styles.typeBtn, {
              [styles.typeBtnActive]: selectedType === opt.value,
            })}
            style={{
              borderColor: selectedType === opt.value ? opt.color : undefined,
              background: selectedType === opt.value ? `${opt.color}15` : undefined,
            }}
            onClick={() => setSelectedType(opt.value)}
          >
            <Text
              className={styles.typeBtnText}
              style={{ color: selectedType === opt.value ? opt.color : undefined }}
            >
              {opt.label}
            </Text>
          </View>
        ))}
      </View>

      <View className={styles.inputRow}>
        <Input
          className={styles.input}
          placeholder="输入要重点读的词..."
          placeholderStyle="color: #BBB;"
          value={inputValue}
          onInput={(e) => setInputValue(e.detail.value)}
          onConfirm={handleAdd}
        />
        <View
          className={classnames(styles.addBtn, {
            [styles.addBtnDisabled]: !inputValue.trim(),
          })}
          onClick={handleAdd}
        >
          <Text className={styles.addBtnText}>添加</Text>
        </View>
      </View>

      {highlights.length > 0 && (
        <View className={styles.list}>
          {highlights.map((h) => (
            <View
              key={h.id}
              className={styles.tag}
              style={{
                borderColor: getTypeColor(h.type),
                background: `${getTypeColor(h.type)}10`,
              }}
            >
              <View
                className={styles.tagDot}
                style={{ background: getTypeColor(h.type) }}
              />
              <Text className={styles.tagText}>{h.word}</Text>
              <View className={styles.tagClose} onClick={() => onRemove(h.id)}>
                <Text className={styles.tagCloseText}>×</Text>
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

export default HighlightInput;
