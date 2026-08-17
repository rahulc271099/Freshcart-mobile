import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

/**
 * Inert placeholder screen used only to prove navigation wiring works
 * (Step 4 scope). No theme tokens are used here on purpose — the
 * centralized theme system doesn't exist yet, and this screen isn't real
 * UI, so it intentionally does not anticipate that design system.
 * Replace every usage of this once real feature screens exist.
 */
export function ComingSoonScreen({ label }: { label: string }) {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>{label}</Text>
      <Text style={styles.subtext}>Coming soon</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontSize: 20,
    fontWeight: '600',
  },
  subtext: {
    marginTop: 4,
    fontSize: 14,
    color: '#666666',
  },
});
