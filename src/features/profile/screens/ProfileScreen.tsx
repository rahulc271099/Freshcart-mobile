import React, { useCallback, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { Header } from '@/components';
import { icons } from '@/constants/icons';
import type { MainStackParamList } from '@/app/navigation/navigationTypes';
import { useProfileStore } from '@/store/profileStore';
import { useLogout } from '@/features/auth/hooks/useLogout';
import { fonts, spacing, useTheme, type ThemeColors } from '@/theme';
import { ProfileActionMenu } from '../components/ProfileActionMenu';
import { ProfileHeaderCard } from '../components/ProfileHeaderCard';
import { ProfileMenuRow } from '../components/ProfileMenuRow';
import { ProfileRewardsCard } from '../components/ProfileRewardsCard';
import { ProfileSectionCard } from '../components/ProfileSectionCard';
import { useProfile } from '../hooks/useProfile';

/** Dummy points balance until a real rewards feature/endpoint exists. */
const REWARDS_POINTS = 320;

/**
 * Rows with no screen behind them yet - a plain "coming soon" alert rather
 * than a silently dead button. Wishlist is the obvious next one to wire for
 * real (the wishlist store + product-card grid already exist, see
 * SearchScreen's results grid for the exact pattern to reuse) - Orders and
 * Payment Methods need real features behind them first.
 */
function showComingSoon(label: string) {
  Alert.alert(label, "This isn't wired up yet - coming soon.");
}

export function ProfileScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const navigation =
    useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const [menuVisible, setMenuVisible] = useState(false);

  const firstName = useProfileStore(state => state.first_name);
  const lastName = useProfileStore(state => state.last_name);
  const mobileNumber = useProfileStore(state => state.mobile_number);
  const fullName = `${firstName} ${lastName}`.trim();
  const logout = useLogout();

  // Background GET /api/v1/users/me/ - the local profileStore above (not
  // this hook's return value) is what the screen actually renders; see
  // useProfile's own comment for why. Fired here rather than inside a
  // useEffect so it's a plain, visible hook call like every other one on
  // this screen.
  useProfile();

  const handleGoBack = useCallback(() => navigation.goBack(), [navigation]);
  const handleLogout = useCallback(() => {
    Alert.alert(
      'Log out?',
      'You can always sign back in with your mobile number.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Log out',
          style: 'destructive',
          onPress: () => logout.mutate(),
        },
      ],
    );
  }, [logout]);

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: colors.background }]}
      edges={['top']}
    >
      {/* No title/subtitle by design - matches the reference screen, which
          has no "Account" heading. Sign out lives only in the "⋯" menu
          below, not as a row in the list - also per the reference. There's
          no bottom tab bar here either: this screen is pushed onto the
          root stack, not rendered inside the tab navigator. */}
      <Header
        onBackPress={handleGoBack}
        rightAccessory={
          <Pressable
            style={styles.moreBtn}
            onPress={() => setMenuVisible(true)}
            hitSlop={8}
            accessibilityLabel="More options"
          >
            <icons.more color={colors.textPrimary} size={22} strokeWidth={2} />
          </Pressable>
        }
        style={styles.header}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        <ProfileHeaderCard
          name={fullName}
          phone={mobileNumber}
          onPress={() => navigation.navigate('EditProfile')}
        />

        <ProfileRewardsCard
          points={REWARDS_POINTS}
          onPress={() => showComingSoon('Fresh Rewards')}
        />

        <Text style={styles.sectionLabel}>Shopping</Text>
        <ProfileSectionCard>
          <ProfileMenuRow
            icon="orders"
            label="Orders"
            subtitle="Track, return or buy again"
            iconBackgroundColor="rgba(23, 105, 224, 0.12)"
            iconColor={colors.primary}
            onPress={() => showComingSoon('Orders')}
          />
          <ProfileMenuRow
            icon="wishlist"
            label="Wishlist"
            subtitle="Items you've saved"
            iconBackgroundColor="rgba(220, 38, 38, 0.12)"
            iconColor={colors.error}
            onPress={() => showComingSoon('Wishlist')}
          />
          <ProfileMenuRow
            icon="location"
            label="Addresses"
            subtitle="Manage delivery addresses"
            iconBackgroundColor="rgba(77, 163, 255, 0.15)"
            iconColor={colors.secondary}
            onPress={() => navigation.navigate('Addresses')}
          />
          <ProfileMenuRow
            icon="payment"
            label="Payment Methods"
            subtitle="Cards and UPI"
            iconBackgroundColor="rgba(124, 58, 237, 0.12)"
            iconColor="#7C3AED"
            onPress={() => showComingSoon('Payment Methods')}
          />
        </ProfileSectionCard>

        <Text style={styles.sectionLabel}>Support & Preferences</Text>
        <ProfileSectionCard>
          <ProfileMenuRow
            icon="headphones"
            label="Help & Support"
            subtitle="FAQs and contact us"
            iconBackgroundColor="rgba(33, 150, 243, 0.12)"
            iconColor={colors.info}
            onPress={() => showComingSoon('Help & Support')}
          />
          <ProfileMenuRow
            icon="shield"
            label="Privacy Policy"
            subtitle="How we handle your data"
            iconBackgroundColor="rgba(46, 139, 87, 0.12)"
            iconColor={colors.success}
            onPress={() => showComingSoon('Privacy Policy')}
          />
          <ProfileMenuRow
            icon="fileText"
            label="Terms & Conditions"
            subtitle="Usage terms"
            iconBackgroundColor="rgba(82, 101, 129, 0.12)"
            iconColor={colors.textSecondary}
            onPress={() => showComingSoon('Terms & Conditions')}
          />
          <ProfileMenuRow
            icon="settings"
            label="Settings"
            subtitle="App preferences"
            iconBackgroundColor="rgba(245, 158, 11, 0.12)"
            iconColor={colors.warning}
            onPress={() => showComingSoon('Settings')}
          />
        </ProfileSectionCard>
      </ScrollView>

      <ProfileActionMenu
        visible={menuVisible}
        onClose={() => setMenuVisible(false)}
        onLogout={handleLogout}
      />
    </SafeAreaView>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    safe: {
      flex: 1,
    },
    header: {
      paddingHorizontal: spacing.md,
    },
    moreBtn: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    scroll: {
      paddingBottom: spacing.xl,
    },
    sectionLabel: {
      fontSize: 11,
      fontFamily: fonts.bold,
      color: colors.textSecondary,
      letterSpacing: 0.5,
      textTransform: 'uppercase',
      paddingHorizontal: spacing.md,
      paddingTop: spacing.md,
      paddingBottom: spacing.xs,
    },
  });
}
