import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { Colors, FontFamily, FontSize, Radius, Spacing } from '../../constants';

interface Props {
  label:      string;
  onPress:    () => void;
  isLoading?: boolean;
  disabled?:  boolean;
  fullWidth?: boolean;
  style?:     ViewStyle;
}

export function OutlineButton({
  label,
  onPress,
  isLoading  = false,
  disabled   = false,
  fullWidth  = true,
  style,
}: Props) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || isLoading}
      activeOpacity={0.8}
      style={[
        styles.base,
        fullWidth && styles.fullWidth,
        (disabled || isLoading) && styles.disabled,
        style,
      ]}
    >
      {isLoading ? (
        <ActivityIndicator color={Colors.green} size="small" />
      ) : (
        <Text style={styles.label}>{label}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    borderWidth:     1.5,
    borderColor:     Colors.green,
    borderRadius:    Radius.pill,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    alignItems:      'center',
    justifyContent:  'center',
  },
  fullWidth: { width: '100%' },
  disabled:  { opacity: 0.5 },
  label: {
    fontFamily: FontFamily.interSemiBold,
    fontSize:   FontSize.base,
    color:      Colors.green,
  },
});
