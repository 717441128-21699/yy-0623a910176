import React from 'react';
import { View, Text } from '@tarojs/components';
import classnames from 'classnames';
import styles from './index.module.scss';

type ButtonVariant = 'primary' | 'success' | 'warning' | 'secondary';
type ButtonSize = 'normal' | 'large' | 'xlarge';

interface BigButtonProps {
  text: string;
  subText?: string;
  onClick?: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  active?: boolean;
  icon?: string;
  fullWidth?: boolean;
}

const BigButton: React.FC<BigButtonProps> = ({
  text,
  subText,
  onClick,
  variant = 'primary',
  size = 'normal',
  disabled = false,
  active = false,
  icon,
  fullWidth = false,
}) => {
  const handleClick = () => {
    if (!disabled) {
      onClick?.();
    }
  };

  return (
    <View
      className={classnames(
        styles.btn,
        styles[variant],
        styles[size],
        {
          [styles.disabled]: disabled,
          [styles.active]: active,
          [styles.fullWidth]: fullWidth,
        }
      )}
      onClick={handleClick}
    >
      <View className={styles.content}>
        {icon && <Text className={styles.icon}>{icon}</Text>}
        <View className={styles.textWrap}>
          <Text className={styles.text}>{text}</Text>
          {subText && <Text className={styles.subText}>{subText}</Text>}
        </View>
      </View>
    </View>
  );
};

export default BigButton;
