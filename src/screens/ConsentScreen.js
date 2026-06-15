import React, { useState } from 'react';
import { ScrollView, View, Text, StyleSheet, Switch } from 'react-native';
import { Button, Card, H1, P, Eyebrow } from '../components/UI';
import { theme } from '../theme';

const POINTS = [
  'A photograph of your teeth will be taken and analysed on this device to highlight areas that may need a closer look.',
  'The result is only a reference aid. Your clinician makes all decisions about your care.',
  'No name or identifying details are recorded. Data is anonymous and is not sent over the internet.',
  'Taking part is voluntary. You may decline or stop at any time without affecting your treatment.',
];

export default function ConsentScreen({ navigation }) {
  const [agreed, setAgreed] = useState(false);
  return (
    <ScrollView contentContainerStyle={s.wrap}>
      <Eyebrow>Before we begin</Eyebrow>
      <H1>Informed consent</H1>
      <Card style={{ marginTop: 18 }}>
        {POINTS.map((t, i) => (
          <View key={i} style={s.row}>
            <View style={s.bullet} />
            <P style={{ flex: 1, color: theme.ink }}>{t}</P>
          </View>
        ))}
      </Card>
      <View style={s.consentRow}>
        <Switch value={agreed} onValueChange={setAgreed} trackColor={{ true: theme.primary }} />
        <Text style={s.consentText}>The patient has read or had this explained, and agrees to take part.</Text>
      </View>
      <Button title="Continue to capture" onPress={() => navigation.navigate('Capture')} disabled={!agreed} />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  wrap: { padding: 22 },
  row: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 14 },
  bullet: { width: 8, height: 8, borderRadius: 4, backgroundColor: theme.primary, marginTop: 7, marginRight: 12 },
  consentRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 20, paddingHorizontal: 4 },
  consentText: { flex: 1, fontSize: 14, color: theme.ink, lineHeight: 20 },
});
