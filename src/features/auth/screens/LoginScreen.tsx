import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  AccessibilityInfo,
  Keyboard,
  type LayoutChangeEvent,
  Platform,
  type ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Animated, {
  Easing,
  FadeInDown,
  ReduceMotion,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button, ScreenContainer, TextInput } from '@/components';
import { icons } from '@/constants/icons';
import { useShake } from '@/hooks/useShake';
import { fonts, radius, spacing, useTheme, type ThemeColors } from '@/theme';
import type { AuthStackParamList } from '@/app/navigation/navigationTypes';
import { AuthEntrance } from '../components/AuthEntrance';
import { AuthHeroBackground } from '../components/AuthHeroBackground';
import { BrandTile } from '../components/BrandTile';
import { GlassPill } from '../components/GlassPill';
import { LoginTrustTiles } from '../components/LoginTrustTiles';
import { authPalette } from '../authPalette';
import { AUTH_CARD_MIN_HEIGHT } from '../authLayout';
import { useHeroPhotoHeight } from '../hooks/useHeroPhoto';
import { useKeyboardLift } from '../hooks/useKeyboardLift';
import { useLogin } from '../hooks/useLogin';
import { formatMobileNumber } from '../utils/formatMobile';

type LoginScreenNavigationProp = NativeStackNavigationProp<
  AuthStackParamList,
  'Login'
>;
const COUNTRY_CODE = '+91';
const MOBILE_NUMBER_LENGTH = 10;
const MOBILE_NUMBER_REGEX = /^[6-9]\d{9}$/;
/** Card's top corners overlap the photo by this much (matches `radius.xlg`). */
const CARD_OVERLAP = radius.xlg;
const HERO_MIN_HEIGHT = 230;
/** Card height before it has been measured (only used for the first frame). */

/**
 * Crossfading phone → check glyph in the input. Confirms a complete number
 * the moment the 10th digit lands, before the user reaches for the button.
 */
function PhoneStatusIcon({ valid, color }: { valid: boolean; color: string }) {
  const { colors } = useTheme();
  const reducedMotion = useReducedMotion();
  const progress = useSharedValue(valid ? 1 : 0);

  useEffect(() => {
    progress.value = withTiming(valid ? 1 : 0, {
      duration: reducedMotion ? 0 : 200,
      easing: Easing.bezier(0.23, 1, 0.32, 1),
    });
  }, [valid, progress, reducedMotion]);

  const phoneStyle = useAnimatedStyle(() => ({
    opacity: 1 - progress.value,
    transform: [{ scale: 1 - 0.3 * progress.value }],
  }));
  const checkStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ scale: 0.7 + 0.3 * progress.value }],
  }));

  return (
    <View
      style={statusStyles.wrap}
      accessible={false}
      importantForAccessibility="no-hide-descendants"
    >
      <Animated.View style={[statusStyles.layer, phoneStyle]}>
        <icons.phone size={20} color={color} />
      </Animated.View>
      <Animated.View style={[statusStyles.layer, checkStyle]}>
        <icons.checkCircle size={22} color={colors.success} />
      </Animated.View>
    </View>
  );
}

const statusStyles = StyleSheet.create({
  wrap: { width: 24, height: 24, marginLeft: spacing.sm },
  layer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export function LoginScreen() {
  const navigation = useNavigation<LoginScreenNavigationProp>();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [mobileNumber, setMobileNumber] = useState('');
  const [error, setError] = useState<string | undefined>();
  const { mutate: login, isPending } = useLogin();
  const { style: shakeStyle, shake } = useShake();
  const scrollRef = useRef<ScrollView>(null);
  const { photoHeight, onCardLayout } = useHeroPhotoHeight(
    height,
    HERO_MIN_HEIGHT,
    CARD_OVERLAP,
    AUTH_CARD_MIN_HEIGHT,
  );
  // Card's y inside the scroll content - where to scroll to when the keyboard
  // opens so the label, input and button sit above it.
  const cardY = useRef(0);
  const getCardTop = useCallback(() => cardY.current, []);
  const { liftStyle, heroStyle } = useKeyboardLift(
    getCardTop,
    insets.top + spacing.sm,
  );
  const handleCardLayout = useCallback(
    (event: LayoutChangeEvent) => {
      cardY.current = event.nativeEvent.layout.y;
      onCardLayout(event);
    },
    [onCardLayout],
  );

  useEffect(() => {
    if (error && Platform.OS === 'ios')
      AccessibilityInfo.announceForAccessibility(error);
  }, [error]);

  const handleChangeMobileNumber = useCallback((text: string) => {
    let digits = text.replace(/[^0-9]/g, '');
    if (digits.length === 12 && digits.startsWith('91'))
      digits = digits.slice(2);
    setMobileNumber(digits.slice(0, MOBILE_NUMBER_LENGTH));
    setError(undefined);
  }, []);

  const handleContinue = useCallback(() => {
    if (isPending) return;

    if (!MOBILE_NUMBER_REGEX.test(mobileNumber)) {
      setError(
        mobileNumber.length < MOBILE_NUMBER_LENGTH
          ? 'Enter a valid 10-digit mobile number'
          : "That doesn't look like a valid mobile number",
      );
      shake();
      return;
    }

    Keyboard.dismiss();
    login(
      { mobile: mobileNumber },
      {
        onSuccess: data => {
          const responseData = data as { data?: { otp?: string } };
          const otp = responseData.data?.otp;
          navigation.navigate('OTPVerification', {
            phoneNumber: `${COUNTRY_CODE}${mobileNumber}`,
            otp,
          });
        },
        onError: err => {
          setError(err.message ?? 'Something went wrong. Please try again.');
          shake();
        },
      },
    );
  }, [isPending, login, mobileNumber, navigation, shake]);

  const isComplete = mobileNumber.length === MOBILE_NUMBER_LENGTH;
  // The tick means "this is a real mobile number", not merely "10 digits".
  const isValidNumber = MOBILE_NUMBER_REGEX.test(mobileNumber);
  const gutter = width < 360 ? spacing.md : spacing.lg;

  return (
    <View style={styles.root} testID="login-screen">
      <AuthHeroBackground variant="login" height={photoHeight} />
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
          {/* ── Hero: badges on top, brand lockup pinned to the card edge ── */}
          <Animated.View
            style={[
              styles.hero,
              {
                paddingTop: insets.top + spacing.sm,
                paddingHorizontal: gutter,
                paddingBottom: CARD_OVERLAP + spacing.md,
              },
              heroStyle,
            ]}
          >
            <AuthEntrance style={styles.badgeRow}>
              <GlassPill tone="light">
                <View style={styles.liveDot} />
                <Text style={styles.badgeDark} maxFontSizeMultiplier={1.2}>
                  FARM-TO-TABLE RESERVE
                </Text>
              </GlassPill>
              <GlassPill tone="dark">
                <icons.star
                  size={12}
                  color={authPalette.brightBlue}
                  fill={authPalette.brightBlue}
                />
                <Text style={styles.badgeLight} maxFontSizeMultiplier={1.2}>
                  TIER 1 PURITY
                </Text>
              </GlassPill>
            </AuthEntrance>

            <AuthEntrance delay={80} style={styles.lockup}>
              <BrandTile size={42} />
              <View style={styles.lockupText}>
                <View style={styles.wordmarkRow}>
                  <Text
                    accessibilityRole="header"
                    style={styles.wordmark}
                    maxFontSizeMultiplier={1.2}
                  >
                    F&V
                  </Text>
                  <GlassPill tone="dark" style={styles.estPill}>
                    <Text style={styles.estText} maxFontSizeMultiplier={1.2}>
                      EST. 2024
                    </Text>
                  </GlassPill>
                </View>
                <Text
                  style={styles.tagline}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.8}
                  maxFontSizeMultiplier={1.2}
                >
                  CURATED HARVEST • DIRECT
                </Text>
              </View>
              <View style={styles.certPill}>
                <Text style={styles.certText} maxFontSizeMultiplier={1.2}>
                  ORGANIC CERT
                </Text>
              </View>
            </AuthEntrance>
          </Animated.View>

          {/* ── Card ── */}
          <Animated.View
            entering={FadeInDown.withInitialValues({
              opacity: 0,
              transform: [{ translateY: 36 }],
            })
              .duration(420)
              .delay(60)
              .easing(Easing.bezier(0.23, 1, 0.32, 1))
              .reduceMotion(ReduceMotion.System)}
            onLayout={handleCardLayout}
            style={[
              styles.card,
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
            <View style={styles.labelRow}>
              <Text style={styles.fieldLabel} maxFontSizeMultiplier={1.3}>
                MOBILE NUMBER
              </Text>
              <View style={styles.instantTag}>
                <View style={styles.instantDot} />
                <Text style={styles.instantText} maxFontSizeMultiplier={1.3}>
                  Instant OTP
                </Text>
              </View>
            </View>

            <Animated.View style={shakeStyle}>
              <TextInput
                animatedFocus
                accessibilityLabel="Mobile number, India, country code plus 91"
                accessibilityHint="Enter your 10-digit mobile number"
                value={formatMobileNumber(mobileNumber)}
                onChangeText={handleChangeMobileNumber}
                placeholder="98765 43210"
                placeholderTextColor={`${colors.textSecondary}A6`}
                keyboardType="phone-pad"
                autoComplete={
                  Platform.OS === 'android' ? 'tel-national' : 'tel'
                }
                textContentType="telephoneNumber"
                disabled={isPending}
                error={error}
                inputContainerStyle={styles.phoneContainer}
                inputStyle={styles.phoneInput}
                leftAccessory={
                  <View style={styles.countryChip} accessible={false}>
                    <Text style={styles.flag}>🇮🇳</Text>
                    <Text style={styles.countryCodeText}>{COUNTRY_CODE}</Text>
                  </View>
                }
                rightAccessory={
                  <PhoneStatusIcon
                    valid={isValidNumber}
                    color={colors.textSecondary}
                  />
                }
                testID="login-mobile-number-input"
              />
            </Animated.View>

            <View style={styles.infoStrip}>
              <View style={styles.infoIcon}>
                <icons.shield size={16} color={colors.primary} />
              </View>
              <Text style={styles.infoText}>
                We’ll send a <Text style={styles.infoStrong}>4-digit OTP</Text>{' '}
                by SMS for passwordless sign-in.
              </Text>
            </View>

            <Button
              title="Continue with OTP"
              loadingTitle="Sending code…"
              onPress={handleContinue}
              loading={isPending}
              disabled={!isComplete}
              fullWidth
              rightIcon={
                <icons.arrowRight size={18} color={colors.textInverse} />
              }
              style={styles.continueButton}
              testID="login-continue-button"
            />

            <AuthEntrance delay={140} style={styles.tiles}>
              <LoginTrustTiles />
            </AuthEntrance>

            <View style={styles.footer}>
              <Text style={styles.legal}>
                By continuing, you agree to F&V’s{' '}
                <Text style={styles.legalStrong}>Terms of Service</Text> &{' '}
                <Text style={styles.legalStrong}>Privacy Policy</Text>.
              </Text>
            </View>
          </Animated.View>
        </Animated.View>
      </ScreenContainer>
    </View>
  );
}

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
    hero: {
      flexGrow: 1,
      minHeight: HERO_MIN_HEIGHT,
      justifyContent: 'space-between',
    },
    badgeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    liveDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: authPalette.brightBlue,
    },
    badgeDark: {
      fontFamily: fonts.bold,
      fontSize: 10,
      lineHeight: 13,
      letterSpacing: 0.8,
      color: authPalette.ink,
    },
    badgeLight: {
      fontFamily: fonts.bold,
      fontSize: 10,
      lineHeight: 13,
      letterSpacing: 0.8,
      color: authPalette.white,
    },
    lockup: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm + 2 },
    lockupText: { flex: 1 },
    wordmarkRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    wordmark: {
      fontFamily: fonts.bold,
      fontSize: 24,
      lineHeight: 30,
      letterSpacing: -0.4,
      color: authPalette.white,
    },
    estPill: { paddingVertical: 3, paddingHorizontal: 8 },
    estText: {
      fontFamily: fonts.semiBold,
      fontSize: 10,
      lineHeight: 13,
      letterSpacing: 1,
      color: authPalette.onPhotoMuted,
    },
    tagline: {
      fontFamily: fonts.medium,
      fontSize: 10,
      lineHeight: 14,
      letterSpacing: 1.2,
      color: authPalette.onPhotoMuted,
      marginTop: 2,
    },
    certPill: {
      alignSelf: 'flex-end',
      backgroundColor: colors.primary,
      borderRadius: 999,
      paddingHorizontal: 10,
      paddingVertical: 6,
    },
    certText: {
      fontFamily: fonts.bold,
      fontSize: 9,
      lineHeight: 13,
      letterSpacing: 0.8,
      color: colors.textInverse,
    },

    // Card
    card: {
      marginTop: -CARD_OVERLAP,
      backgroundColor: colors.background,
      borderTopLeftRadius: radius.xlg,
      borderTopRightRadius: radius.xlg,
      paddingTop: spacing.lg - 4,
      width: '100%',
      maxWidth: 560,
      alignSelf: 'center',
      ...Platform.select({
        ios: {
          shadowColor: '#050B1C',
          shadowOpacity: 0.18,
          shadowRadius: 18,
          shadowOffset: { width: 0, height: -6 },
        },
        default: {},
      }),
    },
    labelRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: spacing.sm + 2,
    },
    fieldLabel: {
      fontFamily: fonts.bold,
      fontSize: 10,
      lineHeight: 14,
      letterSpacing: 1,
      color: colors.textSecondary,
    },
    instantTag: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    instantDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: colors.primary,
    },
    instantText: {
      fontFamily: fonts.semiBold,
      fontSize: 11,
      lineHeight: 16,
      color: colors.primary,
    },
    phoneContainer: {
      minHeight: 56,
      borderRadius: radius.lg + 2,
      borderColor: colors.border,
      backgroundColor: colors.backgroundSec,
      paddingHorizontal: spacing.sm + 2,
    },
    phoneInput: {
      fontFamily: fonts.medium,
      fontSize: 16,
      lineHeight: 22,
      letterSpacing: 0.5,
      minWidth: 0,
      marginLeft: spacing.sm + 2,
    },
    countryChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      backgroundColor: colors.surface,
      borderRadius: radius.lg - 4,
      paddingHorizontal: 12,
      height: 38,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
    },
    flag: { fontSize: 16, lineHeight: 22 },
    countryCodeText: {
      fontFamily: fonts.semiBold,
      fontSize: 14,
      lineHeight: 19,
      color: colors.textPrimary,
    },
    infoStrip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm + 4,
      marginTop: spacing.md,
      padding: spacing.sm + 2,
      borderRadius: radius.lg - 2,
      borderWidth: 1,
      borderColor: colors.divider,
      backgroundColor: colors.backgroundSec,
    },
    infoIcon: {
      width: 28,
      height: 28,
      borderRadius: 9,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: `${colors.primary}1A`,
    },
    infoText: {
      flex: 1,
      fontFamily: fonts.regular,
      fontSize: 12,
      lineHeight: 17,
      color: colors.textSecondary,
    },
    infoStrong: { fontFamily: fonts.bold, color: colors.textPrimary },
    continueButton: {
      marginTop: spacing.lg - 4,
      ...Platform.select({
        ios: {
          shadowColor: colors.primary,
          shadowOpacity: 0.35,
          shadowRadius: 16,
          shadowOffset: { width: 0, height: 8 },
        },
        default: {},
      }),
    },
    tiles: { marginTop: spacing.md },
    footer: {
      marginTop: spacing.md,
      paddingTop: spacing.md - 2,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.divider,
    },
    legal: {
      fontFamily: fonts.regular,
      fontSize: 12,
      lineHeight: 18,
      color: colors.textSecondary,
      textAlign: 'center',
    },
    legalStrong: {
      fontFamily: fonts.semiBold,
      color: colors.textPrimary,
      textDecorationLine: 'underline',
    },
  });
}
