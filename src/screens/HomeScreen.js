import React, { useState, useCallback } from 'react';
import { View, ScrollView, StyleSheet, Text } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Button, Card, H1, P, Eyebrow } from '../components/UI';
import { loadModel } from '../model';
import { theme } from '../theme';

export default function HomeScreen({ navigation }) {
  const [status, setStatus] = useState('loading');

  useFocusEffect(
    useCallback(() => {
      let active = true;
      if (status !== 'ready') {
        loadModel()
          .then(() => active && setStatus('ready'))
          .catch(() => active && setStatus('error'));
      }
      return () => { active = false; };
    }, [status])
  );

  const dot = { ready: theme.ok, loading: theme.warn, error: theme.lesion }[status];
  const label = { ready: 'Model ready — works offline', loading: 'Preparing model…', error: 'Model failed to load' }[status];

  return (
    <ScrollView contentContainerStyle={s.wrap}>
      <Eyebrow>Offline AI decision aid</Eyebrow>
      <H1>Dental caries screening</H1>
      <P style={{ marginTop: 8 }}>
        Runs entirely on this device. No internet, no data leaves the phone. An assistive reference for
        the examining clinician — it never replaces clinical judgement.
      </P>

      <Card style={{ marginTop: 20, flexDirection: 'row', alignItems: 'center' }}>
        <View style={[s.dot, { backgroundColor: dot }]} />
        <Text style={s.statusLabel}>{label}</Text>
      </Card>

      <Button title="Start a screening" onPress={() => navigation.navigate('Consent')} disabled={status !== 'ready'} />
      <Button title="Records & export" kind="ghost" onPress={() => navigation.navigate('Records')} />
      <Button title="Settings" kind="ghost" onPress={() => navigation.navigate('Settings')} />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  wrap: { padding: 22, paddingTop: 28 },
  dot: { width: 12, height: 12, borderRadius: 6, marginRight: 12 },
  statusLabel: { fontSize: 15, fontWeight: '700', color: theme.ink },
});
