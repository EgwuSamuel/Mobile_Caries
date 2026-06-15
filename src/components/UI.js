import React from 'react';
import { Text, TouchableOpacity, View, StyleSheet, ActivityIndicator } from 'react-native';
import { theme } from '../theme';

export function Button({ title, onPress, disabled, kind = 'primary', loading }) {
  const isPrimary = kind === 'primary';
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        s.btn,
        isPrimary ? s.btnPrimary : s.btnGhost,
        (disabled || loading) && { opacity: 0.5 },
      ]}
    >
      {loading ? (
        <ActivityIndicator color={isPrimary ? theme.primaryInk : theme.primary} />
      ) : (
        <Text style={[s.btnText, isPrimary ? { color: theme.primaryInk } : { color: theme.primary }]}>
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
}

export function Card({ children, style }) {
  return <View style={[s.card, style]}>{children}</View>;
}

export function H1({ children }) { return <Text style={s.h1}>{children}</Text>; }
export function P({ children, style }) { return <Text style={[s.p, style]}>{children}</Text>; }
export function Eyebrow({ children }) { return <Text style={s.eyebrow}>{children}</Text>; }

const s = StyleSheet.create({
  btn: { height: 52, borderRadius: theme.radius, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20, marginTop: 12 },
  btnPrimary: { backgroundColor: theme.primary },
  btnGhost: { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: theme.primary },
  btnText: { fontSize: 16, fontWeight: '700', letterSpacing: 0.2 },
  card: { backgroundColor: theme.surface, borderRadius: theme.radius, padding: 18, borderWidth: 1, borderColor: theme.line },
  h1: { fontSize: 26, fontWeight: '800', color: theme.ink, letterSpacing: -0.4 },
  p: { fontSize: 15, lineHeight: 22, color: theme.inkSoft },
  eyebrow: { fontSize: 12, fontWeight: '800', letterSpacing: 1.5, color: theme.primary, textTransform: 'uppercase', marginBottom: 6 },
});
