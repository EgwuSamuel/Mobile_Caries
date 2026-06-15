import React, { useState } from 'react';
import { ScrollView, View, Text, StyleSheet, Alert } from 'react-native';
import { Button, Card, P, Eyebrow } from '../components/UI';
import { saveSession } from '../storage';
import { theme } from '../theme';

const PATIENT_ITEMS = [
  ['comfortable', 'I felt comfortable having an AI tool used during my examination.'],
  ['trust', 'I trust a tool like this to support my dentist.'],
  ['privacy', 'I am satisfied that my privacy was respected.'],
];
const CLINICIAN_ITEMS = [
  ['useful', 'The tool was useful during examination.'],
  ['easy', 'The tool was easy to integrate into my workflow.'],
  ['trust', 'I trust the regions it highlighted enough to consider them.'],
  ['recommend', 'I would recommend a tool like this to colleagues.'],
];

function Likert({ items, values, onChange }) {
  return items.map(([key, label]) => (
    <View key={key} style={s.item}>
      <Text style={s.itemLabel}>{label}</Text>
      <View style={s.scale}>
        {[1, 2, 3, 4, 5].map((n) => (
          <Text key={n} onPress={() => onChange(key, n)} style={[s.dot, values[key] === n && s.dotActive]}>{n}</Text>
        ))}
      </View>
    </View>
  ));
}

export default function QuestionnaireScreen({ route, navigation }) {
  const { session, imageUri } = route.params;
  const [patient, setPatient] = useState({});
  const [clinician, setClinician] = useState({});
  const [saving, setSaving] = useState(false);
  const set = (setter) => (k, v) => setter((p) => ({ ...p, [k]: v }));

  const submit = async () => {
    setSaving(true);
    try {
      await saveSession({ ...session, patient_questionnaire: patient, clinician_questionnaire: clinician }, imageUri);
      navigation.navigate('Done');
    } catch (e) {
      Alert.alert('Could not save', e.message || 'Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={s.wrap}>
      <Eyebrow>Acceptability — 1 disagree · 5 agree</Eyebrow>
      <Card>
        <Text style={s.section}>Patient</Text>
        <Likert items={PATIENT_ITEMS} values={patient} onChange={set(setPatient)} />
      </Card>
      <Card style={{ marginTop: 16 }}>
        <Text style={s.section}>Clinician</Text>
        <Likert items={CLINICIAN_ITEMS} values={clinician} onChange={set(setClinician)} />
      </Card>
      <P style={{ marginTop: 12 }}>Saved anonymously on this device.</P>
      <Button title={saving ? 'Saving…' : 'Submit & finish'} onPress={submit} loading={saving} />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  wrap: { padding: 22 },
  section: { fontSize: 16, fontWeight: '800', color: theme.ink, marginBottom: 12 },
  item: { marginBottom: 16 },
  itemLabel: { fontSize: 14, color: theme.ink, lineHeight: 20, marginBottom: 8 },
  scale: { flexDirection: 'row', gap: 8 },
  dot: { width: 44, height: 44, borderRadius: 22, textAlign: 'center', lineHeight: 44, borderWidth: 1.5, borderColor: theme.line, color: theme.inkSoft, fontWeight: '700', overflow: 'hidden' },
  dotActive: { borderColor: theme.primary, color: theme.primary, backgroundColor: '#E6F2F3' },
});
