import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button, Card, P, Eyebrow } from '../components/UI';
import { getConf, setConf } from '../storage';
import { theme } from '../theme';

export default function SettingsScreen({ navigation }) {
  const [conf, setConfState] = useState(0.4);
  useEffect(() => { (async () => setConfState(await getConf()))(); }, []);

  const save = async () => { await setConf(conf); navigation.goBack(); };
  const steps = [0.05, 0.1, 0.15, 0.25, 0.4, 0.5];

  return (
    <ScrollView contentContainerStyle={s.wrap}>
      <Eyebrow>Detection</Eyebrow>
      <Card>
        <Text style={s.label}>Confidence threshold: {Math.round(conf * 100)}%</Text>
        <P style={{ marginBottom: 12 }}>
          Higher shows fewer, more confident regions (fewer false alarms). Lower is more sensitive.
        </P>
        <View style={s.chips}>
          {steps.map((v) => (
            <Text key={v} onPress={() => setConfState(v)} style={[s.chip, Math.abs(conf - v) < 0.001 && s.chipActive]}>
              {Math.round(v * 100)}%
            </Text>
          ))}
        </View>
      </Card>
      <Button title="Save" onPress={save} />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  wrap: { padding: 22 },
  label: { fontSize: 15, fontWeight: '700', color: theme.ink, marginBottom: 8 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 999, borderWidth: 1.5, borderColor: theme.line, color: theme.inkSoft, fontWeight: '700', overflow: 'hidden' },
  chipActive: { borderColor: theme.primary, color: theme.primary, backgroundColor: '#E6F2F3' },
});
