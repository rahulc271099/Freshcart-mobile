import React, {
  forwardRef,
  useMemo,
  useState,
  type ComponentProps,
  type ReactNode,
} from 'react';
import {
  StyleSheet,
  Text,
  TextInput as RNTextInput,
  View,
  type KeyboardTypeOptions,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native';

import {
  radius,
  spacing,
  typography,
  useTheme,
  type ThemeColors,
} from '@/theme';

// Derived from RNTextInput's own prop types (rather than importing RN's
// internal FocusEvent/BlurEvent names directly) so this stays correct across
// React Native versions without chasing internal type renames.
type RNTextInputFocusHandler = NonNullable<
  ComponentProps<typeof RNTextInput>['onFocus']
>;
type RNTextInputBlurHandler = NonNullable<
  ComponentProps<typeof RNTextInput>['onBlur']
>;

export interface TextInputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  label?: string;
  /** Validation/error message. When present, the input renders in an error state. */
  error?: string;
  disabled?: boolean;
  keyboardType?: KeyboardTypeOptions;
  secureTextEntry?: boolean;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  autoCorrect?: boolean;
  maxLength?: number;
  onFocus?: RNTextInputFocusHandler;
  onBlur?: RNTextInputBlurHandler;
  /** Rendered before the text field inside the same bordered container (e.g. a country-code prefix). */
  leftAccessory?: ReactNode;
  /** Rendered after the text field inside the same bordered container (e.g. a visibility toggle). */
  rightAccessory?: ReactNode;
  containerStyle?: StyleProp<ViewStyle>;
  inputStyle?: StyleProp<TextStyle>;
  testID?: string;
}

/**
 * Reusable controlled text input. Carries no form/validation/API logic -
 * screens own the value and error message; this component only renders
 * and reports input events. `leftAccessory`/`rightAccessory` let feature
 * code compose things like a phone-number prefix without this component
 * knowing anything about phone numbers specifically.
 */
export const TextInput = forwardRef<RNTextInput, TextInputProps>(
  function TextInputInner(
    {
      value,
      onChangeText,
      placeholder,
      label,
      error,
      disabled = false,
      keyboardType = 'default',
      secureTextEntry = false,
      autoCapitalize = 'none',
      autoCorrect = false,
      maxLength,
      onFocus,
      onBlur,
      leftAccessory,
      rightAccessory,
      containerStyle,
      inputStyle,
      testID,
    },
    ref,
  ) {
    const { colors } = useTheme();
    const styles = useMemo(() => createStyles(colors), [colors]);
    const [isFocused, setIsFocused] = useState(false);
    const hasError = Boolean(error);

    const handleFocus: RNTextInputFocusHandler = e => {
      setIsFocused(true);
      onFocus?.(e);
    };

    const handleBlur: RNTextInputBlurHandler = e => {
      setIsFocused(false);
      onBlur?.(e);
    };

    return (
      <View style={[styles.wrapper, containerStyle]}>
        {label ? <Text style={styles.label}>{label}</Text> : null}

        <View
          style={[
            styles.inputContainer,
            isFocused && styles.inputContainerFocused,
            hasError && styles.inputContainerError,
            disabled && styles.inputContainerDisabled,
          ]}
        >
          {leftAccessory}
          <RNTextInput
            ref={ref}
            value={value}
            onChangeText={onChangeText}
            placeholder={placeholder}
            placeholderTextColor={colors.textSecondary}
            editable={!disabled}
            keyboardType={keyboardType}
            secureTextEntry={secureTextEntry}
            autoCapitalize={autoCapitalize}
            autoCorrect={autoCorrect}
            maxLength={maxLength}
            onFocus={handleFocus}
            onBlur={handleBlur}
            style={[styles.input, inputStyle]}
            testID={testID}
          />
          {rightAccessory}
        </View>

        {hasError ? <Text style={styles.errorText}>{error}</Text> : null}
      </View>
    );
  },
);

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    wrapper: {
      width: '100%',
    },
    label: {
      ...typography.bodyStrong,
      color: colors.textPrimary,
      marginBottom: spacing.xs,
    },
    inputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      minHeight: 52,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.lg,
      backgroundColor: colors.surface,
      paddingHorizontal: spacing.md,
    },
    inputContainerFocused: {
      borderColor: colors.primary,
    },
    inputContainerError: {
      borderColor: colors.error,
    },
    inputContainerDisabled: {
      opacity: 0.5,
    },
    input: {
      flex: 1,
      ...typography.body,
      color: colors.textPrimary,
      paddingVertical: spacing.sm,
    },
    errorText: {
      ...typography.caption,
      color: colors.error,
      marginTop: spacing.xs,
    },
  });
}
