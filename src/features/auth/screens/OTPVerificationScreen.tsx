import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { Button, Header, OTPInput, ScreenContainer } from '@/components';
import { icons } from '@/constants/icons';
import { useVerifyOtp } from '../hooks/useVerifyOtp';
import {
  dimensions,
  radius,
  shadows,
  spacing,
  typography,
  useTheme,
  type ThemeColors,
} from '@/theme';
import type { AuthStackParamList } from '@/app/navigation/navigationTypes';

// ─── Types ───────────────────────────────────────────────────────────────────

type OTPVerificationRouteProp = RouteProp<AuthStackParamList, 'OTPVerification'>;
type OTPVerificationNavigationProp = NativeStackNavigationProp<
  AuthStackParamList,
  'OTPVerification'
>;

// ─── Constants ───────────────────────────────────────────────────────────────

const OTP_LENGTH = 4;
const RESEND_COUNTDOWN_SECONDS = 28;

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Format seconds as MM:SS */
function formatCountdown(seconds: number): string {
  const mm = String(Math.floor(seconds / 60)).padStart(2, '0');
  const ss = String(seconds % 60).padStart(2, '0');
  return `${mm}:${ss}`;
}

// ─── Phone + Chat Illustration ───────────────────────────────────────────────

/**
 * A simple inline illustration of a phone with a chat bubble, rendered
 * purely via React Native primitives so no image asset is required.
 * Matches the right-side illustration visible in the design.
 */
function PhoneIllustration({ colors }: { colors: ThemeColors }) {
  return (
    <View style={illustrationStyles.wrapper}>
      {/* Phone body */}
      <View style={[illustrationStyles.phone, { borderColor: colors.primary }]}>
        {/* Phone notch */}
        <View style={[illustrationStyles.notch, { backgroundColor: colors.primary }]} />
        {/* Phone screen placeholder lines */}
        <View style={[illustrationStyles.screenLine, { backgroundColor: colors.border, marginTop: 10 }]} />
        <View style={[illustrationStyles.screenLine, { backgroundColor: colors.border, width: 28 }]} />
      </View>

      {/* Chat bubble */}
      <View style={[illustrationStyles.bubble, { backgroundColor: colors.primary }]}>
        <View style={illustrationStyles.dotsRow}>
          {[0, 1, 2].map(i => (
            <View key={i} style={[illustrationStyles.dot, { backgroundColor: colors.textInverse }]} />
          ))}
        </View>
        {/* Bubble tail */}
        <View style={[illustrationStyles.bubbleTail, { borderTopColor: colors.primary }]} />
      </View>

      {/* Decorative leaf dots */}
      <View style={[illustrationStyles.leaf, illustrationStyles.leafTL, { backgroundColor: colors.primary }]} />
      <View style={[illustrationStyles.leaf, illustrationStyles.leafTR, { backgroundColor: colors.primary, opacity: 0.6 }]} />
      <View style={[illustrationStyles.leaf, illustrationStyles.leafBR, { backgroundColor: colors.secondary, opacity: 0.8 }]} />
    </View>
  );
}

const illustrationStyles = StyleSheet.create({
  wrapper: {
    width: 110,
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  phone: {
    width: 52,
    height: 80,
    borderWidth: 2.5,
    borderRadius: 10,
    alignItems: 'center',
    paddingTop: 8,
    position: 'absolute',
    right: 4,
  },
  notch: {
    width: 18,
    height: 4,
    borderRadius: 2,
    marginBottom: 6,
  },
  screenLine: {
    height: 3,
    width: 36,
    borderRadius: 2,
    marginBottom: 5,
  },
  bubble: {
    position: 'absolute',
    top: 6,
    left: 0,
    width: 52,
    height: 34,
    borderRadius: 10,
    borderBottomLeftRadius: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 5,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  bubbleTail: {
    position: 'absolute',
    bottom: -8,
    left: 10,
    width: 0,
    height: 0,
    borderLeftWidth: 8,
    borderRightWidth: 0,
    borderTopWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },
  leaf: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  leafTL: {
    position: 'absolute',
    top: 2,
    left: 16,
  },
  leafTR: {
    position: 'absolute',
    top: 0,
    right: 10,
  },
  leafBR: {
    position: 'absolute',
    bottom: 4,
    right: 2,
    width: 10,
    height: 10,
    borderRadius: 5,
  },
});

// ─── Screen ───────────────────────────────────────────────────────────────────

export function OTPVerificationScreen() {
  const navigation = useNavigation<OTPVerificationNavigationProp>();
  const route = useRoute<OTPVerificationRouteProp>();
  const { phoneNumber, otp: receivedOtp } = route.params;

  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [otp, setOtp] = useState(receivedOtp || '123456');
  const [otpError, setOtpError] = useState(false);

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

  // ── Handlers ─────────────────────────────────────────────────────────────

  const handleBackPress = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const handleOtpChange = useCallback((value: string) => {
    setOtp(value);
    if (otpError) setOtpError(false);
  }, [otpError]);

  const handleResend = useCallback(() => {
    if (!canResend) return;
    setOtp('');
    setOtpError(false);
    startTimer();
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
        onError: (err) => {
          setOtpError(true);
          // Log the full response body so we can see which field the
          // server is rejecting (serializer validation errors come back
          // as 400 with a JSON body detailing every failing field).
          const axiosErr = err as unknown as { response?: { data?: unknown; status?: number } };
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

  return (
    <ScreenContainer
      scrollable
      padded={false}
      backgroundColor={colors.backgroundSec}
      testID="otp-verification-screen"
    >
      {/* ── Header ── */}
      <Header
        onBackPress={handleBackPress}
        style={[styles.header, { backgroundColor: colors.backgroundSec }]}
        testID="otp-header"
      />

      {/* ── Hero area ── */}
      <View style={styles.hero}>
        <View style={styles.heroTopRow}>
          {/* Logo */}
          <View style={styles.logoBlock}>
            <View style={styles.logoRow}>
              <Text style={styles.logoF}>F</Text>
              <Text style={styles.logoAmp}>&</Text>
              <Text style={styles.logoV}>V</Text>
            </View>
            <Text style={styles.tagline}>Fresh. Natural. Delivered.</Text>
          </View>

          {/* Illustration */}
          <PhoneIllustration colors={colors} />
        </View>
      </View>

      {/* ── Card ── */}
      <View style={styles.card}>
        {/* Title */}
        <Text style={styles.title}>Verify Your Number</Text>
        <Text style={styles.subtitle}>Enter the 4-digit OTP sent to</Text>
        <Text style={styles.phoneNumber} testID="otp-phone-number">
          {phoneNumber}
        </Text>

        {/* OTP Input */}
        <OTPInput
          length={OTP_LENGTH}
          value={otp}
          onChange={handleOtpChange}
          onComplete={handleVerify}
          disabled={isVerifying}
          error={otpError}
          containerStyle={styles.otpInput}
          testID="otp-input"
        />

        {/* Resend row */}
        <View style={styles.resendRow}>
          <Text style={styles.resendLabel}>Resend OTP in </Text>
          {canResend ? (
            <Pressable onPress={handleResend} hitSlop={8} testID="otp-resend-button">
              <Text style={styles.resendLink}>Resend now</Text>
            </Pressable>
          ) : (
            <Text style={styles.resendCountdown} testID="otp-countdown">
              {formatCountdown(countdown)}
            </Text>
          )}
        </View>

        {/* Trust / security badge */}
        <View style={styles.trustBadge}>
          <View style={styles.trustIconWrapper}>
            <icons.shield color={colors.primary} size={dimensions.iconSize.md} />
          </View>
          <View style={styles.trustTextBlock}>
            <Text style={styles.trustTitle}>Your number is safe and secure with us.</Text>
            <Text style={styles.trustBody}>We never share your details with anyone.</Text>
          </View>
        </View>

        {/* CTA */}
        <Button
          title="Verify & Continue"
          onPress={handleVerify}
          loading={isVerifying}
          disabled={otp.length !== OTP_LENGTH || isVerifying}
          fullWidth
          style={styles.verifyButton}
          testID="otp-verify-button"
        />
      </View>
    </ScreenContainer>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    // Header
    header: {
      paddingHorizontal: spacing.lg,
    },

    // Hero section (same cream background as LoginScreen)
    hero: {
      backgroundColor: colors.backgroundSec,
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.sm,
      paddingBottom: spacing.xl,
    },
    heroTopRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },

    // Logo
    logoBlock: {
      flexShrink: 1,
    },
    logoRow: {
      flexDirection: 'row',
      alignItems: 'flex-end',
    },
    logoF: {
      ...typography.heading1,
      color: colors.primary,
    },
    logoAmp: {
      ...typography.heading1,
      color: colors.secondary,
    },
    logoV: {
      ...typography.heading1,
      color: colors.primary,
    },
    tagline: {
      ...typography.body,
      color: colors.primary,
      marginTop: spacing.xs,
    },

    // White card at the bottom (matches LoginScreen's card)
    card: {
      flex: 1,
      backgroundColor: colors.background,
      borderTopLeftRadius: radius.xlg,
      borderTopRightRadius: radius.xlg,
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.lg,
      paddingBottom: spacing.xl,
      ...shadows.md,
    },

    // Heading copy
    title: {
      ...typography.heading2,
      color: colors.textPrimary,
      marginBottom: spacing.xs,
    },
    subtitle: {
      ...typography.body,
      color: colors.textSecondary,
    },
    phoneNumber: {
      ...typography.bodyStrong,
      color: colors.primary,
      marginTop: spacing.xs,
      marginBottom: spacing.lg,
    },

    // OTP boxes
    otpInput: {
      marginBottom: spacing.md,
    },

    // Resend row
    resendRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: spacing.sm,
      marginBottom: spacing.lg,
    },
    resendLabel: {
      ...typography.body,
      color: colors.textSecondary,
    },
    resendCountdown: {
      ...typography.bodyStrong,
      color: colors.secondary,
    },
    resendLink: {
      ...typography.bodyStrong,
      color: colors.primary,
    },

    // Trust / security badge
    trustBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      padding: spacing.md,
      marginBottom: spacing.lg,
    },
    trustIconWrapper: {
      marginRight: spacing.sm,
    },
    trustTextBlock: {
      flex: 1,
    },
    trustTitle: {
      ...typography.bodyStrong,
      color: colors.textPrimary,
      marginBottom: spacing.xs,
    },
    trustBody: {
      ...typography.caption,
      color: colors.textSecondary,
    },

    // CTA button
    verifyButton: {
      marginTop: spacing.xs,
    },
  });
}
