import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  AccessibilityInfo,
  Pressable,
  type LayoutChangeEvent,
  type ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import {
  useNavigation,
  useRoute,
  type RouteProp,
} from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Animated, {
  Easing,
  FadeInDown,
  ReduceMotion,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  Button,
  Header,
  OTPInput,
  ScreenContainer,
  type OTPInputHandle,
} from '@/components';
import { icons } from '@/constants/icons';
import { fonts, radius, spacing, useTheme, type ThemeColors } from '@/theme';
import type { AuthStackParamList } from '@/app/navigation/navigationTypes';
import { AuthEntrance } from '../components/AuthEntrance';
import { AuthHeroBackground } from '../components/AuthHeroBackground';
import { BrandTile } from '../components/BrandTile';
import { authPalette } from '../authPalette';
import { AUTH_CARD_MIN_HEIGHT } from '../authLayout';
import { useHeroPhotoHeight } from '../hooks/useHeroPhoto';
import { useKeyboardLift } from '../hooks/useKeyboardLift';
import { useVerifyOtp } from '../hooks/useVerifyOtp';
import { formatInternationalMobile } from '../utils/formatMobile';

// ─── Types ───────────────────────────────────────────────────────────────────

type OTPVerificationRouteProp = RouteProp<
  AuthStackParamList,
  'OTPVerification'
>;
type OTPVerificationNavigationProp = NativeStackNavigationProp<
  AuthStackParamList,
  'OTPVerification'
>;

// ─── Constants ───────────────────────────────────────────────────────────────

const OTP_LENGTH = 4;
const RESEND_COUNTDOWN_SECONDS = 28;
/** Sheet's top corners overlap the photo by this much (matches `radius.xlg`). */
const SHEET_OVERLAP = radius.xlg;
const HERO_MIN_HEIGHT = 200;

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Format seconds as MM:SS */
function formatCountdown(seconds: number): string {
  const mm = String(Math.floor(seconds / 60)).padStart(2, '0');
  const ss = String(seconds % 60).padStart(2, '0');
  return `${mm}:${ss}`;
}

/**
 * "Resend SMS" action. Dim and inert while the countdown runs; when it
 * unlocks it brightens and gives one small spring so the change is noticed.
 */
function ResendButton({
  enabled,
  onPress,
  colors,
}: {
  enabled: boolean;
  onPress: () => void;
  colors: ThemeColors;
}) {
  const reducedMotion = useReducedMotion();
  const scale = useSharedValue(1);
  const wasEnabled = useRef(enabled);

  useEffect(() => {
    if (enabled && !wasEnabled.current && !reducedMotion) {
      scale.value = withSequence(
        withTiming(0.92, { duration: 80 }),
        withSpring(1, { damping: 9, stiffness: 240 }),
      );
    }
    wasEnabled.current = enabled;
  }, [enabled, reducedMotion, scale]);

  const style = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));
  const color = enabled ? colors.primary : colors.textSecondary;

  return (
    <Animated.View style={style}>
      <Pressable
        onPress={onPress}
        disabled={!enabled}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel="Resend SMS"
        accessibilityHint={
          enabled ? 'Sends a new code' : 'Available after the countdown'
        }
        accessibilityState={{ disabled: !enabled }}
        style={({ pressed }) => [
          resendStyles.button,
          { opacity: enabled ? (pressed ? 0.6 : 1) : 0.55 },
        ]}
        testID="otp-resend-button"
      >
        <icons.message size={16} color={color} />
        <Text style={[resendStyles.label, { color }]}>Resend SMS</Text>
      </Pressable>
    </Animated.View>
  );
}

const resendStyles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 44,
    paddingHorizontal: spacing.md,
  },
  label: { fontFamily: fonts.semiBold, fontSize: 15, lineHeight: 20 },
});

// ─── Screen ───────────────────────────────────────────────────────────────────

export function OTPVerificationScreen() {
  const navigation = useNavigation<OTPVerificationNavigationProp>();
  const route = useRoute<OTPVerificationRouteProp>();
  const { phoneNumber, otp: receivedOtp } = route.params;

  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const otpInputRef = useRef<OTPInputHandle>(null);
  const scrollRef = useRef<ScrollView>(null);
  const { photoHeight, onCardLayout } = useHeroPhotoHeight(
    height,
    HERO_MIN_HEIGHT,
    SHEET_OVERLAP,
    AUTH_CARD_MIN_HEIGHT,
  );
  // Sheet's y inside the scroll content - the keyboard scroll target.
  const sheetY = useRef(0);
  const getCardTop = useCallback(() => sheetY.current, []);
  const { liftStyle, heroStyle } = useKeyboardLift(
    getCardTop,
    insets.top + spacing.sm,
  );
  const handleSheetLayout = useCallback(
    (event: LayoutChangeEvent) => {
      sheetY.current = event.nativeEvent.layout.y;
      onCardLayout(event);
    },
    [onCardLayout],
  );

  const [otp, setOtp] = useState(receivedOtp ?? '');
  const [otpError, setOtpError] = useState(false);
  // Bumped on every failed attempt so the boxes re-shake even if the same
  // wrong code is submitted twice in a row.
  const [errorTick, setErrorTick] = useState(0);

  const { mutate: verifyOtp, isPending: isVerifying } = useVerifyOtp();

  // ── Countdown timer ──────────────────────────────────────────────────────
  const [countdown, setCountdown] = useState(RESEND_COUNTDOWN_SECONDS);
  const [canResend, setCanResend] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startTimer = useCallback(() => {
    setCountdown(RESEND_COUNTDOWN_SECONDS);
    setCanResend(false);

    if (timerRef.current) clearInterval(timerRef.current);

    timerRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          setCanResend(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  useEffect(() => {
    startTimer();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [startTimer]);

  useEffect(() => {
    if (canResend) {
      AccessibilityInfo.announceForAccessibility('You can now resend the code');
    }
  }, [canResend]);

  // ── Handlers ─────────────────────────────────────────────────────────────

  const handleBackPress = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const handleOtpChange = useCallback(
    (value: string) => {
      setOtp(value);
      if (otpError) setOtpError(false);
    },
    [otpError],
  );

  const handleResend = useCallback(() => {
    if (!canResend) return;
    setOtp('');
    setOtpError(false);
    startTimer();
    otpInputRef.current?.focus();
    // TODO: trigger resend OTP API call here
  }, [canResend, startTimer]);

  const handleVerify = useCallback(() => {
    if (otp.length !== OTP_LENGTH || isVerifying) return;

    // Strip the country code prefix (+91) that LoginScreen prepends before
    // navigating here — the API expects the raw 10-digit mobile number.
    const mobile = phoneNumber.replace(/^\+91\s*/, '');

    verifyOtp(
      { mobile, otp },
      {
        // onSuccess: navigation is handled by RootNavigator
        onError: err => {
          setOtpError(true);
          setErrorTick(tick => tick + 1);
          // Log the full response body so we can see which field the
          // server is rejecting (serializer validation errors come back
          // as 400 with a JSON body detailing every failing field).
          const axiosErr = err as unknown as {
            response?: { data?: unknown; status?: number };
          };
          console.warn(
            '[OTPVerificationScreen] verify failed:',
            axiosErr?.response?.status,
            JSON.stringify(axiosErr?.response?.data, null, 2),
          );
        },
      },
    );
  }, [otp, isVerifying, phoneNumber, verifyOtp]);

  // ── Render ────────────────────────────────────────────────────────────────

  const gutter = width < 360 ? spacing.md : spacing.lg;

  return (
    <View style={styles.root} testID="otp-verification-screen">
      <AuthHeroBackground variant="otp" height={photoHeight} />
      <ScreenContainer
        scrollable
        padded={false}
        edges={[]}
        backgroundColor="transparent"
        keyboardAvoiding={false}
        scrollRef={scrollRef}
        scrollViewProps={{
          bounces: false,
          overScrollMode: 'never',
          decelerationRate: 'fast',
        }}
      >
        <Animated.View style={[styles.liftWrap, liftStyle]}>
          {/* ── Hero ── */}
          <Animated.View
            style={[
              styles.hero,
              {
                paddingTop: insets.top,
                paddingBottom: SHEET_OVERLAP + spacing.md,
              },
              heroStyle,
            ]}
          >
            {/* Same shared Header (and same x/y) every other screen uses, so the
              back button never jumps between screens. */}
            <AuthEntrance>
              <Header
                onBackPress={handleBackPress}
                backIconColor={authPalette.ink}
                style={styles.header}
                testID="otp-back-button"
                rightAccessory={
                  <View style={styles.secureTag}>
                    <icons.shield
                      size={14}
                      color={authPalette.ink}
                      fill={authPalette.ink}
                    />
                    <Text style={styles.secureText} maxFontSizeMultiplier={1.2}>
                      F&V SECURE KEY
                    </Text>
                  </View>
                }
              />
            </AuthEntrance>

            <AuthEntrance
              delay={80}
              style={[styles.brandBlock, { paddingHorizontal: gutter }]}
            >
              <BrandTile size={60} />
              <Text style={styles.reserveText} maxFontSizeMultiplier={1.2}>
                FARM-TO-TABLE RESERVE
              </Text>
            </AuthEntrance>
          </Animated.View>

          {/* ── Sheet ── */}
          <Animated.View
            entering={FadeInDown.withInitialValues({
              opacity: 0,
              transform: [{ translateY: 36 }],
            })
              .duration(420)
              .delay(60)
              .easing(Easing.bezier(0.23, 1, 0.32, 1))
              .reduceMotion(ReduceMotion.System)}
            onLayout={handleSheetLayout}
            style={[
              styles.sheet,
              {
                paddingHorizontal: gutter,
                paddingBottom: Math.max(insets.bottom, spacing.md) + spacing.sm,
                minHeight: AUTH_CARD_MIN_HEIGHT,
              },
            ]}
          >
            {/* Surface continues below the card so nothing shows through while it
              is lifted (Android only reports the keyboard closing after it is gone). */}
            <View pointerEvents="none" style={styles.cardFiller} />
            <Text accessibilityRole="header" style={styles.title}>
              Enter Verification Code
            </Text>

            <View style={styles.sentRow}>
              <Text style={styles.sentLabel}>Sent to </Text>
              <Text style={styles.phoneNumber} testID="otp-phone-number">
                {formatInternationalMobile(phoneNumber)}
              </Text>
              <Pressable
                onPress={handleBackPress}
                hitSlop={{ top: 12, bottom: 12, left: 8, right: 8 }}
                accessibilityRole="button"
                accessibilityLabel="Edit phone number"
                style={({ pressed }) => [
                  styles.editButton,
                  pressed && styles.pressed,
                ]}
                testID="otp-edit-button"
              >
                <icons.edit size={13} color={colors.primary} />
                <Text style={styles.editText}>Edit</Text>
              </Pressable>
            </View>

            <OTPInput
              ref={otpInputRef}
              length={OTP_LENGTH}
              value={otp}
              onChange={handleOtpChange}
              onComplete={handleVerify}
              disabled={isVerifying}
              error={otpError}
              errorSignal={errorTick}
              containerStyle={styles.otpInput}
              testID="otp-input"
            />

            {otpError ? (
              <Text
                accessibilityRole="alert"
                accessibilityLiveRegion="polite"
                style={[styles.caption, styles.captionError]}
              >
                We couldn’t verify that code. Check it and try again.
              </Text>
            ) : (
              <Text style={styles.caption}>
                Enter the {OTP_LENGTH} digits delivered via instant SMS
              </Text>
            )}

            <View style={styles.resendBlock}>
              <View style={styles.timerRow}>
                <icons.clock size={15} color={colors.textSecondary} />
                <Text style={styles.timerText} testID="otp-countdown">
                  {canResend ? (
                    'Resend available now'
                  ) : (
                    <>
                      Resend available in{' '}
                      <Text style={styles.timerDigits}>
                        {formatCountdown(countdown)}
                      </Text>
                    </>
                  )}
                </Text>
              </View>
              <ResendButton
                enabled={canResend}
                onPress={handleResend}
                colors={colors}
              />
            </View>

            <Button
              title="Verify & Enter Reserve"
              loadingTitle="Verifying…"
              onPress={handleVerify}
              loading={isVerifying}
              disabled={otp.length !== OTP_LENGTH || isVerifying}
              fullWidth
              rightIcon={
                <icons.arrowRight size={18} color={colors.textInverse} />
              }
              style={styles.verifyButton}
              testID="otp-verify-button"
            />
          </Animated.View>
        </Animated.View>
      </ScreenContainer>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: authPalette.night },

    liftWrap: { flexGrow: 1 },
    cardFiller: {
      position: 'absolute',
      top: '100%',
      left: 0,
      right: 0,
      height: 900,
      backgroundColor: colors.background,
    },

    // Hero
    hero: { flexGrow: 1, minHeight: HERO_MIN_HEIGHT },
    header: { paddingHorizontal: spacing.md },
    secureTag: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      borderRadius: 999,
      paddingHorizontal: 10,
      paddingVertical: 6,
      backgroundColor: 'rgba(255,255,255,0.6)',
    },
    secureText: {
      fontFamily: fonts.bold,
      fontSize: 11,
      lineHeight: 14,
      letterSpacing: 0.9,
      color: authPalette.ink,
    },
    brandBlock: {
      alignItems: 'center',
      gap: spacing.sm + 2,
      marginTop: spacing.lg - 4,
    },
    reserveText: {
      fontFamily: fonts.bold,
      fontSize: 12,
      lineHeight: 16,
      letterSpacing: 2,
      color: authPalette.white,
      textShadowColor: 'rgba(5,11,28,0.85)',
      textShadowRadius: 12,
      textShadowOffset: { width: 0, height: 1 },
    },

    // Sheet
    sheet: {
      marginTop: -SHEET_OVERLAP,
      backgroundColor: colors.background,
      borderTopLeftRadius: radius.xlg,
      borderTopRightRadius: radius.xlg,
      paddingTop: spacing.lg + 4,
      width: '100%',
      maxWidth: 560,
      alignSelf: 'center',
    },
    title: {
      fontFamily: fonts.semiBold,
      fontSize: 16,
      lineHeight: 22,
      color: colors.textPrimary,
      textAlign: 'center',
    },
    sentRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: spacing.sm + 2,
      marginBottom: spacing.lg + 4,
      rowGap: 4,
    },
    sentLabel: {
      fontFamily: fonts.regular,
      fontSize: 13,
      lineHeight: 18,
      color: colors.textSecondary,
    },
    phoneNumber: {
      fontFamily: fonts.bold,
      fontSize: 13,
      lineHeight: 18,
      color: colors.textPrimary,
    },
    editButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      marginLeft: spacing.sm + 2,
      borderBottomWidth: 1,
      borderBottomColor: colors.primary,
    },
    editText: {
      fontFamily: fonts.semiBold,
      fontSize: 13,
      lineHeight: 18,
      color: colors.primary,
    },
    otpInput: { paddingHorizontal: 4 },
    caption: {
      fontFamily: fonts.regular,
      fontSize: 13,
      lineHeight: 18,
      color: colors.textSecondary,
      textAlign: 'center',
      marginTop: spacing.lg,
    },
    captionError: { color: colors.error, fontFamily: fonts.medium },
    resendBlock: { alignItems: 'center', marginTop: spacing.lg, gap: 6 },
    timerRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    timerText: {
      fontFamily: fonts.medium,
      fontSize: 13,
      lineHeight: 18,
      color: colors.textSecondary,
      fontVariant: ['tabular-nums'],
    },
    timerDigits: { fontFamily: fonts.bold, color: colors.textPrimary },
    verifyButton: { marginTop: spacing.lg + 4 },
    pressed: { opacity: 0.6 },
  });
}
