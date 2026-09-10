import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

/**
 * Inert placeholder screen used only to prove navigation wiring works
 * (Step 4 scope). No theme tokens are used here on purpose — the
 * centralized theme system doesn't exist yet, and this screen isn't real
 * UI, so it intentionally does not anticipate that design system.
 * Replace every usage of this once real feature screens exist.
 */
// export function ComingSoonScreen({ label }: { label: string }) {
//   return (
//     <View style={styles.container}>
//       <Text style={styles.text}>{label}</Text>
//       <Text style={styles.subtext}>Coming soon</Text>
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     alignItems: 'center',
//     justifyContent: 'center',
//   },
//   text: {
//     fontSize: 20,
//     fontWeight: '600',
//     fontFamily: 'Inter-Bold',
//   },
//   subtext: {
//     marginTop: 4,
//     fontSize: 14,
//     fontFamily: 'Inter-Bold',
//     color: '#666666',
//   },
// });

export function ComingSoonScreen({ label }: { label: string }) {
  return (
    <View style={styles.container}>
      <Text style={{ fontFamily: 'Inter-Regular', fontSize: 40 }}>
  Regular
</Text>

<Text style={{ fontFamily: 'Inter-Medium', fontSize: 40 }}>
  Medium
</Text>

<Text style={{ fontFamily: 'Inter-SemiBold', fontSize: 40 }}>
  SemiBold
</Text>

<Text style={{ fontFamily: 'Inter-Bold', fontSize: 40 }}>
  Bold
</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },

  bold: {
    fontFamily: 'Inter-Bold',
    fontSize: 24,
  },

  medium: {
    fontFamily: 'Inter-Medium',
    fontSize: 24,
  },

  regular: {
    fontFamily: 'Inter-Regular',
    fontSize: 24,
  },

  system: {
    fontSize: 24,
    fontWeight: '700',
  },
});