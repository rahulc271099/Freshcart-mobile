import React, { useMemo, useRef } from 'react';
import {
  StyleSheet,
  Text,
  TextInput as RNTextInput,
  View,
  type NativeSyntheticEvent,
  type StyleProp,
  type TextInputKeyPressEventData,
  type ViewStyle,
} from 'react-native';

import { radius, typography, useTheme, type ThemeColors } from '@/theme';

export interface OTPInputProps {
  /** Number of OTP digits. Defaults to 6. */
  length?: number;
  /** Current OTP value as a plain string, e.g. "123" while partially entered. */
  value: string;
  /** Called with the full updated value on every change (typing, backspace or paste). */
  onChange: (value: string) => void;
  /** Called once the value reaches `length` digits - convenient for auto-submit. */
  onComplete?: (value: string) => void;
  disabled?: boolean;
  /** Renders every box in the error state (e.g. after a failed verification attempt). */
  error?: boolean;
  containerStyle?: StyleProp<ViewStyle>;
  testID?: string;
}

const BOX_SIZE = 48;

/**
 * Reusable OTP entry field: `length` individually-boxed digit inputs with
 * auto-advance to the next box, backspace-to-previous and full-code paste
 * support. This component owns only input presentation/behavior -
 * verification and API calls belong to the screen using it.
 */
export function OTPInput({
  length = 6,
  value,
  onChange,
  onComplete,
  disabled = false,
  error = false,
  containerStyle,
  testID,
}: OTPInputProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const inputRefs = useRef<Array<RNTextInput | null>>([]);

  const digits = useMemo(() => {
    const chars = value.split('').slice(0, length);
    return Array.from({ length }, (_, i) => chars[i] ?? '');
  }, [value, length]);

  const setDigit = (index: number, next: string) => {
    const nextDigits = [...digits];
    nextDigits[index] = next;
    const nextValue = nextDigits.join('').replace(/\s+$/, '');
    onChange(nextValue);

    if (nextValue.length === length) {
      onComplete?.(nextValue);
    }
  };

  const handleChangeText = (text: string, index: number) => {
    const digitsOnly = text.replace(/[^0-9]/g, '');

    // A paste of the full code can land in whichever box was focused - detect
    // it (more than one digit arriving at once) and distribute it across all boxes.
    if (digitsOnly.length > 1) {
      const pasted = digitsOnly.slice(0, length);
      onChange(pasted);
      if (pasted.length === length) {
        onComplete?.(pasted);
        inputRefs.current[length - 1]?.blur();
      } else {
        inputRefs.current[pasted.length]?.focus();
      }
      return;
    }

    setDigit(index, digitsOnly);

    if (digitsOnly && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (
    e: NativeSyntheticEvent<TextInputKeyPressEventData>,
    index: number,
  ) => {
    if (e.nativeEvent.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
      setDigit(index - 1, '');
    }
  };

  return (
    <View style={[styles.row, containerStyle]} testID={testID}>
      {digits.map((digit, index) => (
        <View
          key={index}
          style={[
            styles.box,
            digit ? styles.boxFilled : null,
            error ? styles.boxError : null,
          ]}
        >
          <RNTextInput
            ref={r => {
              inputRefs.current[index] = r;
            }}
            value={digit}
            onChangeText={text => handleChangeText(text, index)}
            onKeyPress={e => handleKeyPress(e, index)}
            keyboardType="number-pad"
            textContentType="oneTimeCode"
            maxLength={length}
            editable={!disabled}
            autoFocus={index === 0}
            selectionColor={colors.primary}
            style={styles.input}
            testID={testID ? `${testID}-${index}` : undefined}
          />
          {!digit ? (
            <Text style={styles.placeholderDot} pointerEvents="none">
              &bull;
            </Text>
          ) : null}
        </View>
      ))}
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    row: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      width: '100%',
    },
    box: {
      width: BOX_SIZE,
      height: BOX_SIZE,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.md,
      backgroundColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
    },
    boxFilled: {
      borderColor: colors.primary,
    },
    boxError: {
      borderColor: colors.error,
    },
    input: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      ...typography.heading3,
      color: colors.textPrimary,
      textAlign: 'center',
      padding: 0,
    },
    placeholderDot: {
      ...typography.heading3,
      color: colors.textSecondary,
    },
  });
}
