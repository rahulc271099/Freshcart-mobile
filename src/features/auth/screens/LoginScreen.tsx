import React, { useCallback, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { Button, Header, ScreenContainer, TextInput } from '@/components';
import { icons } from '@/constants/icons';
import { images } from '@/constants/images';
import { useLogin } from '../hooks/useLogin';
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

type LoginScreenNavigationProp = NativeStackNavigationProp<
  AuthStackParamList,
  'Login'
>;

const COUNTRY_CODE = '+91';
const MOBILE_NUMBER_LENGTH = 10;
const MOBILE_NUMBER_REGEX = /^[6-9]\d{9}$/;



export function LoginScreen() {
  const navigation = useNavigation<LoginScreenNavigationProp>();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [mobileNumber, setMobileNumber] = useState('');
  const [error, setError] = useState<string | undefined>(undefined);

  const { mutate: login, isPending } = useLogin();

  const handleChangeMobileNumber = useCallback(
    (text: string) => {
      setMobileNumber(
        text.replace(/[^0-9]/g, '').slice(0, MOBILE_NUMBER_LENGTH),
      );
      if (error) setError(undefined);
    },
    [error],
  );

  const handleBackPress = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const handleContinue = useCallback(() => {
    if (isPending) return;

    if (!MOBILE_NUMBER_REGEX.test(mobileNumber)) {
      setError(
        mobileNumber.length < MOBILE_NUMBER_LENGTH
          ? 'Enter a valid 10-digit mobile number'
          : "That doesn't look like a valid mobile number",
      );
      return;
    }

    login(
      { mobile: mobileNumber },
      {
        onSuccess: (data) => {
          console.log("🚀 ~ LoginScreen ~ data:", data)
          const responseData = data as { data?: { otp?: string } };
          const otp = responseData.data?.otp;
          navigation.navigate('OTPVerification', {
            phoneNumber: `${COUNTRY_CODE}${mobileNumber}`,
            otp,
          });
        },
        onError: (err) => {
          console.log("🚀 ~ LoginScreen ~ err:", err)
          setError(err.message ?? 'Something went wrong. Please try again.');
        },
      },
    );
  }, [isPending, login, mobileNumber, navigation]);

  const handleSocialSignIn = useCallback(() => {
    // Google/Apple sign-in is not implemented yet - see task scope. Also,
    // no icon set is part of the approved stack (see constants/icons.ts),
    // so these buttons are text-only for now rather than using an
    // inaccurate stand-in glyph for the Google/Apple marks.
  }, []);

  const handleSignUpPress = useCallback(() => {
    // No "SignUp" route exists in AuthStackParamList yet - this screen only
    // covers the Login → OTPVerification step per this task's scope.
  }, []);

  return (
    <ScreenContainer
      scrollable
      padded={false}
      backgroundColor={colors.backgroundSec}
    >
      <Header
        onBackPress={handleBackPress}
        style={[styles.header, { backgroundColor: 'transparent', zIndex: 1 }]}
      />

      <View style={styles.hero}>
        <Image 
          source={images.loginBg} 
          style={styles.heroImage} 
          resizeMode="cover" 
        />
        <View style={styles.logoRow}>
          <Text style={styles.logoF}>F</Text>
          <Text style={styles.logoAmp}>&</Text>
          <Text style={styles.logoV}>V</Text>
        </View>
        <Text style={styles.tagline}>Fresh. Natural. Delivered.</Text>

        <Text style={styles.title}>Welcome Back!</Text>
        <Text style={styles.subtitle}>
          Login to continue shopping fresh &amp; healthy
        </Text>
      </View>

      <View style={styles.card}>
        <TextInput
          label="Mobile Number"
          value={mobileNumber}
          onChangeText={handleChangeMobileNumber}
          placeholder="Enter mobile number"
          keyboardType="number-pad"
          maxLength={MOBILE_NUMBER_LENGTH}
          error={error}
          leftAccessory={
            <View style={styles.countryCode}>
              <Text style={styles.countryCodeText}>{COUNTRY_CODE}</Text>
              <View style={styles.countryCodeChevron}>
                <icons.chevronDown
                  color={colors.textSecondary}
                  size={dimensions.iconSize.sm}
                />
              </View>
              <View style={styles.countryCodeDivider} />
            </View>
          }
          testID="login-mobile-number-input"
        />

        <View style={styles.helperRow}>
          <View style={styles.helperIcon}>
            <icons.shield
              color={colors.textSecondary}
              size={dimensions.iconSize.sm}
            />
          </View>
          <Text style={styles.helperText}>
            We will send you a 6-digit OTP to verify your number
          </Text>
        </View>

        <Button
          title="Continue"
          onPress={handleContinue}
          loading={isPending}
          disabled={mobileNumber.length !== MOBILE_NUMBER_LENGTH || isPending}
          fullWidth
          style={styles.continueButton}
          testID="login-continue-button"
        />

        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>Or continue with</Text>
          <View style={styles.dividerLine} />
        </View>

        <View style={styles.socialRow}>
          <Button
            title="Continue with Google"
            variant="outline"
            onPress={handleSocialSignIn}
            style={styles.socialButton}
          />
          <Button
            title="Continue with Apple"
            variant="outline"
            onPress={handleSocialSignIn}
            style={styles.socialButton}
          />
        </View>

        <View style={styles.signUpRow}>
          <Text style={styles.signUpText}>Don&apos;t have an account? </Text>
          <Pressable onPress={handleSignUpPress} hitSlop={8}>
            <Text style={styles.signUpLink}>Sign Up</Text>
          </Pressable>
        </View>
      </View>
    </ScreenContainer>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    header: {
      paddingHorizontal: spacing.lg,
    },
    hero: {
      backgroundColor: colors.backgroundSec,
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.sm,
      paddingBottom: spacing.xl,
    },
    heroImage: {
      position: 'absolute',
      top: -60, // Adjust this as needed based on the header height
      right: 0,
      width: '65%',
      height: '150%', // To ensure it covers enough vertical space
      opacity: 1,
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
      marginBottom: spacing.lg,
    },
    title: {
      ...typography.heading2,
      color: colors.textPrimary,
      marginBottom: spacing.xs,
    },
    subtitle: {
      ...typography.body,
      color: colors.textSecondary,
    },
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
    countryCode: {
      flexDirection: 'row',
      alignItems: 'center',
      marginRight: spacing.sm,
    },
    countryCodeText: {
      ...typography.bodyStrong,
      color: colors.textPrimary,
    },
    countryCodeChevron: {
      marginLeft: spacing.xs,
    },
    countryCodeDivider: {
      width: 1,
      height: 24,
      backgroundColor: colors.border,
      marginLeft: spacing.sm,
    },
    helperRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: spacing.sm,
    },
    helperIcon: {
      marginRight: spacing.xs,
    },
    helperText: {
      ...typography.caption,
      color: colors.textSecondary,
      flexShrink: 1,
    },
    continueButton: {
      marginTop: spacing.lg,
    },
    dividerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: spacing.lg,
      marginBottom: spacing.lg,
    },
    dividerLine: {
      flex: 1,
      height: 1,
      backgroundColor: colors.divider,
    },
    dividerText: {
      ...typography.caption,
      color: colors.textSecondary,
      marginHorizontal: spacing.sm,
    },
    socialRow: {
      flexDirection: 'row',
      gap: spacing.sm,
      marginBottom: spacing.lg,
    },
    socialButton: {
      flex: 1,
    },
    signUpRow: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
    },
    signUpText: {
      ...typography.body,
      color: colors.textSecondary,
    },
    signUpLink: {
      ...typography.bodyStrong,
      color: colors.primary,
    },
  });
}
