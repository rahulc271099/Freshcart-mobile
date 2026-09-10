import React, { useCallback, useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';

import { Button, Header, TextInput } from '@/components';
import { useProfileStore } from '@/store/profileStore';
import { fonts, radius, spacing, useTheme, type ThemeColors } from '@/theme';
import { useUpdateProfile } from '../hooks/useUpdateProfile';

/** Same initials logic as `ProfileHeaderCard` - duplicated rather than
 * imported since it's a two-line pure function and importing across a
 * component file for it would be more indirection than it's worth. */
function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0][0]?.toUpperCase() ?? '?';
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function EditProfileScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const navigation = useNavigation();

  // IMPORTANT: select each field individually, NOT as `state => ({ ... })`.
  // A selector that builds a new object literal returns a different
  // reference on every call, and Zustand v5's `useSyncExternalStore`-based
  // store then sees every snapshot check as "changed" - that was causing a
  // real "Maximum update depth exceeded" crash on this screen. Individual
  // primitive selectors (as ProfileScreen already does) don't have this
  // problem, since the same primitive value is `Object.is`-equal across
  // renders.
  const storedFirstName = useProfileStore(state => state.first_name);
  const storedLastName = useProfileStore(state => state.last_name);
  const mobileNumber = useProfileStore(state => state.mobile_number);
  const storedEmail = useProfileStore(state => state.email);
  const updateProfile = useProfileStore(state => state.updateProfile);

  const [firstName, setFirstName] = useState(storedFirstName);
  const [lastName, setLastName] = useState(storedLastName);
  const [email, setEmail] = useState(storedEmail);
  const [emailError, setEmailError] = useState<string | undefined>();

  const fullName = `${firstName} ${lastName}`.trim();

  // PATCH /api/v1/users/me/profile/ - see useUpdateProfile's own comment
  // for why the local store still gets written even if this call fails
  // (there's no reachable backend yet).
  const updateProfileMutation = useUpdateProfile();

  const handleGoBack = useCallback(() => navigation.goBack(), [navigation]);

  const handleSave = useCallback(() => {
    const trimmedFirstName = firstName.trim();
    const trimmedLastName = lastName.trim();
    const trimmedEmail = email.trim();

    if (!trimmedFirstName) {
      Alert.alert('First name required', 'Please enter your first name.');
      return;
    }
    if (trimmedEmail && !EMAIL_PATTERN.test(trimmedEmail)) {
      setEmailError('Enter a valid email address.');
      return;
    }
    setEmailError(undefined);

    // Email isn't part of the confirmed Update Profile contract (only
    // first_name/last_name are) - it's kept as a client-side-only field,
    // written straight to the local store.
    updateProfile({ email: trimmedEmail });

    // first_name/last_name go through the real mutation - its `onSettled`
    // is what actually persists them to the store (best-effort, works
    // with or without a live backend). Navigate back only once that
    // settles, so the Save button's loading state reflects real work.
    updateProfileMutation.mutate(
      { first_name: trimmedFirstName, last_name: trimmedLastName },
      { onSettled: () => navigation.goBack() },
    );
  }, [
    firstName,
    lastName,
    email,
    updateProfile,
    updateProfileMutation,
    navigation,
  ]);

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: colors.background }]}
      edges={['top']}
    >
      <Header
        title="Edit Profile"
        onBackPress={handleGoBack}
        style={styles.header}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.avatarSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {getInitials(fullName || '?')}
            </Text>
          </View>
          {/* TODO: real image picker + upload once that's built - this is
              a placeholder affordance only. */}
          <Text
            style={styles.changePhoto}
            onPress={() =>
              Alert.alert(
                'Change photo',
                "This isn't wired up yet - coming soon.",
              )
            }
          >
            Change photo
          </Text>
        </View>

        <View style={styles.nameRow}>
          <TextInput
            label="First name"
            value={firstName}
            onChangeText={setFirstName}
            placeholder="First name"
            autoCapitalize="words"
            containerStyle={styles.nameField}
          />
          <TextInput
            label="Last name"
            value={lastName}
            onChangeText={setLastName}
            placeholder="Last name"
            autoCapitalize="words"
            containerStyle={styles.nameField}
          />
        </View>

        {/* Read-only: changing a verified mobile number isn't part of the
            confirmed Update Profile contract, so this field isn't editable
            here - it's shown for reference only. */}
        <TextInput
          label="Mobile number"
          value={mobileNumber}
          onChangeText={() => {}}
          disabled
          containerStyle={styles.field}
        />
        <Text style={styles.helperText}>
          To change your mobile number, contact support.
        </Text>

        <TextInput
          label="Email"
          value={email}
          onChangeText={text => {
            setEmail(text);
            if (emailError) setEmailError(undefined);
          }}
          placeholder="you@example.com"
          keyboardType="email-address"
          error={emailError}
          containerStyle={styles.field}
        />

        <Button
          title="Save Changes"
          onPress={handleSave}
          loading={updateProfileMutation.isPending}
          fullWidth
          style={styles.saveBtn}
        />
      </ScrollView>
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
    scroll: {
      paddingHorizontal: spacing.md,
      paddingBottom: spacing.xl,
    },
    avatarSection: {
      alignItems: 'center',
      paddingVertical: spacing.lg,
    },
    avatar: {
      width: 80,
      height: 80,
      borderRadius: radius.full,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarText: {
      color: colors.textInverse,
      fontSize: 26,
      fontFamily: fonts.bold,
    },
    changePhoto: {
      marginTop: spacing.sm,
      fontSize: 13,
      fontFamily: fonts.semiBold,
      color: colors.primary,
    },
    nameRow: {
      flexDirection: 'row',
      gap: spacing.sm,
      marginBottom: spacing.md,
    },
    nameField: {
      flex: 1,
    },
    field: {
      marginBottom: spacing.xs,
    },
    helperText: {
      fontSize: 12,
      fontFamily: fonts.regular,
      color: colors.textSecondary,
      marginBottom: spacing.md,
    },
    saveBtn: {
      marginTop: spacing.sm,
    },
  });
}
