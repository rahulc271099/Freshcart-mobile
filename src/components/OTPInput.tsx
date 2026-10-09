import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  type ComponentProps,
} from 'react';
import {
  StyleSheet,
  TextInput as RNTextInput,
  type LayoutChangeEvent,
  type NativeSyntheticEvent,
  type StyleProp,
  type TextInputKeyPressEventData,
  type ViewStyle,
} from 'react-native';
import Animated, {
  cubicBezier,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { useShake } from '@/hooks/useShake';
import { fonts, radius, useTheme, type ThemeColors } from '@/theme';

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
  /**
   * Bump this number to replay the error shake while `error` is already true
   * (e.g. the same wrong code submitted twice). `error` flipping to true
   * shakes on its own.
   */
  errorSignal?: number;
  containerStyle?: StyleProp<ViewStyle>;
  testID?: string;
}

/** Imperative handle - lets a screen put the cursor back (e.g. after a resend). */
export interface OTPInputHandle {
  focus: () => void;
}

const MAX_BOX_SIZE = 64;
const MIN_BOX_SIZE = 44;
const BOX_GAP = 12;

type PressableTransition = NonNullable<
  ComponentProps<typeof Animated.View>['style']
>;

/**
 * Reusable OTP entry field: `length` individually-boxed digit inputs with
 * auto-advance to the next box, backspace-to-previous and full-code paste
 * support. Boxes size themselves to the available width, show a focus ring,
 * pop when a digit lands and shake on error. This component owns only input
 * presentation/behavior - verification and API calls belong to the screen.
 */
export const OTPInput = forwardRef<OTPInputHandle, OTPInputProps>(
  function OTPInputField(
    {
      length = 6,
      value,
      onChange,
      onComplete,
      disabled = false,
      error = false,
      errorSignal = 0,
      containerStyle,
      testID,
    },
    ref,
  ) {
    const { colors } = useTheme();
    const styles = useMemo(() => createStyles(colors), [colors]);
    const reducedMotion = useReducedMotion();
    const inputRefs = useRef<Array<RNTextInput | null>>([]);
    const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
    const [rowWidth, setRowWidth] = useState(0);
    const { style: shakeStyle, shake } = useShake();

    const digits = useMemo(() => {
      const chars = value.split('').slice(0, length);
      return Array.from({ length }, (_, i) => chars[i] ?? '');
    }, [value, length]);

    // Responsive box: as large as the row allows, within sane bounds, so four
    // boxes fit a 320dp phone and don't balloon on a tablet.
    const boxSize = useMemo(() => {
      if (!rowWidth) return MAX_BOX_SIZE;
      const fit = Math.floor((rowWidth - BOX_GAP * (length - 1)) / length);
      return Math.max(MIN_BOX_SIZE, Math.min(MAX_BOX_SIZE, fit));
    }, [rowWidth, length]);

    useImperativeHandle(
      ref,
      () => ({
        focus: () => {
          const target = Math.min(value.length, length - 1);
          inputRefs.current[target]?.focus();
        },
      }),
      [value.length, length],
    );

    useEffect(() => {
      if (error) shake();
    }, [error, errorSignal, shake]);

    const handleLayout = useCallback((e: LayoutChangeEvent) => {
      setRowWidth(e.nativeEvent.layout.width);
    }, []);

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

    const handleFocus = (index: number) => {
      // Tapping a box past the first empty one would leave a gap in the code
      // (the value is a plain string) - send the cursor to the first empty box.
      if (index > value.length) {
        inputRefs.current[value.length]?.focus();
        return;
      }
      setFocusedIndex(index);
    };

    const handleBlur = (index: number) => {
      setFocusedIndex(current => (current === index ? null : current));
    };

    return (
      <Animated.View
        style={[styles.row, containerStyle, shakeStyle]}
        onLayout={handleLayout}
        testID={testID}
      >
        {digits.map((digit, index) => (
          <OTPBox
            key={index}
            digit={digit}
            size={boxSize}
            focused={focusedIndex === index}
            error={error}
            colors={colors}
            reducedMotion={reducedMotion}
          >
            <RNTextInput
              ref={r => {
                inputRefs.current[index] = r;
              }}
              value={digit}
              onChangeText={text => handleChangeText(text, index)}
              onKeyPress={e => handleKeyPress(e, index)}
              onFocus={() => handleFocus(index)}
              onBlur={() => handleBlur(index)}
              keyboardType="number-pad"
              textContentType="oneTimeCode"
              // Android SMS Retriever / autofill suggestion. Only the first box
              // advertises it - the paste handler above fans the code out.
              autoComplete={index === 0 ? 'sms-otp' : 'off'}
              maxLength={length}
              editable={!disabled}
              autoFocus={index === 0}
              selectionColor={colors.primary}
              accessibilityLabel={`Digit ${index + 1} of ${length}`}
              style={styles.input}
              testID={testID ? `${testID}-${index}` : undefined}
            />
          </OTPBox>
        ))}
      </Animated.View>
    );
  },
);

interface OTPBoxProps {
  digit: string;
  size: number;
  focused: boolean;
  error: boolean;
  colors: ThemeColors;
  reducedMotion: boolean;
  children: React.ReactNode;
}

/** One digit cell: border/fill transitions, focus ring, and a "pop" when filled. */
function OTPBox({
  digit,
  size,
  focused,
  error,
  colors,
  reducedMotion,
  children,
}: OTPBoxProps) {
  const scale = useSharedValue(1);
  const previousDigit = useRef(digit);

  useEffect(() => {
    // Pop only when a digit is typed - not on mount, clear or backspace.
    if (digit && !previousDigit.current && !reducedMotion) {
      scale.value = withSequence(
        withTiming(1.08, { duration: 80 }),
        withSpring(1, { damping: 12, stiffness: 320 }),
      );
    }
    previousDigit.current = digit;
  }, [digit, reducedMotion, scale]);

  const popStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const transition = {
    transitionProperty: ['borderColor', 'backgroundColor'] as const,
    transitionDuration: reducedMotion ? 0 : 160,
    transitionTimingFunction: cubicBezier(0.23, 1, 0.32, 1),
  } as PressableTransition;

  const ringTransition = {
    transitionProperty: 'opacity' as const,
    transitionDuration: reducedMotion ? 0 : 160,
    transitionTimingFunction: cubicBezier(0.23, 1, 0.32, 1),
  } as PressableTransition;

  const borderColor = error
    ? colors.error
    : focused
    ? colors.primary
    : colors.border;

  const ringState = {
    borderColor: error ? colors.error : colors.primary,
    opacity: focused ? 0.2 : 0,
  };
  const boxState = {
    borderColor,
    borderWidth: focused || error ? 2 : 1.5,
    backgroundColor: error ? `${colors.error}0F` : colors.surface,
  };

  return (
    <Animated.View style={[{ width: size, height: size }, popStyle]}>
      {/* Focus ring - a soft halo, so focus never relies on border colour alone. */}
      <Animated.View
        pointerEvents="none"
        style={[boxStyles.ring, ringState, ringTransition]}
      />
      <Animated.View style={[boxStyles.box, boxState, transition]}>
        {children}
      </Animated.View>
    </Animated.View>
  );
}

const boxStyles = StyleSheet.create({
  box: {
    flex: 1,
    borderRadius: radius.lg - 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    position: 'absolute',
    top: -4,
    left: -4,
    right: -4,
    bottom: -4,
    borderRadius: radius.lg + 2,
    borderWidth: 4,
  },
});

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    row: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      width: '100%',
      gap: BOX_GAP,
    },
    input: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      fontFamily: fonts.semiBold,
      fontSize: 24,
      lineHeight: 30,
      color: colors.textPrimary,
      textAlign: 'center',
      padding: 0,
    },
  });
}
