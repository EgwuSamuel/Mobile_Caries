import React, { useState, useCallback } from 'react';
import { ScrollView, View, Text, StyleSheet, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Button, Card, P, Eyebrow } from '../components/UI';
import { listSessions, summarise, exportSessions, clearSessions } from '../storage';
import { theme } from '../theme';

export default function RecordsScreen() {
  const [sessions, setSessions] = useState([]);
  const [sum, setSum] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    (async () => {
      const all = await listSessions();
      setSessions(all);
      setSum(summarise(all));
    })();
  }, []);
  useFocusEffect(load);

  const onExport = async () => {
    if (!sessions.length) return Alert.alert('Nothing to export', 'Complete a screening first.');
    setBusy(true);
    try { await exportSessions(); } catch (e) { Alert.alert('Export failed', e.message || ''); }
    finally { setBusy(false); }
  };

  const onClear = () => {
    Alert.alert('Delete all records?', 'This permanently removes every encounter on this device.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => { await clearSessions(); load(); } },
    ]);
  };

  const stat = (v, suffix = '') => (v == null ? '—' : `${v}${suffix}`);

  return (
    <ScrollView contentContainerStyle={s.wrap}>
      <Eyebrow>Study overview · this device</Eyebrow>
      <View style={s.cards}>
        <Card style={s.statCard}><Text style={s.v}>{sum?.total ?? 0}</Text><Text style={s.l}>Encounters</Text></Card>
        <Card style={s.statCard}><Text style={s.v}>{stat(sum?.detectionRate, '%')}</Text><Text style={s.l}>Flagged by AI</Text></Card>
        <Card style={s.statCard}><Text style={s.v}>{stat(sum?.agreement, '%')}</Text><Text style={s.l}>Clinician–AI agree</Text></Card>
        <Card style={s.statCard}><Text style={s.v}>{stat(sum?.meanPatient)}</Text><Text style={s.l}>Patient acceptability</Text></Card>
      </View>

      <Button title={busy ? 'Preparing…' : 'Export anonymised data (JSON)'} onPress={onExport} loading={busy} />

      <Eyebrow>Encounters</Eyebrow>
      {sessions.length === 0 ? (
        <P>No encounters yet.</P>
      ) : (
        sessions.map((r) => {
          const ca = r.clinician_assessment || {};
          const ai = (r.detections || []).length;
          return (
            <Card key={r.id} style={{ marginBottom: 10 }}>
              <View style={s.row}>
                <Text style={s.rid}>{r.id}</Text>
                <Text style={s.time}>{new Date(r.created_at).toLocaleString()}</Text>
              </View>
              <View style={s.row}>
                <Text style={[s.badge, ai ? s.flag : s.clear]}>{ai ? `${ai} flagged` : 'None flagged'}</Text>
                <Text style={s.assess}>
                  Clinician: {ca.caries_present === true ? 'Yes' : ca.caries_present === false ? 'No' : 'Uncertain'}
                </Text>
              </View>
            </Card>
          );
        })
      )}

      {sessions.length > 0 && <Button title="Delete all records" kind="ghost" onPress={onClear} />}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  wrap: { padding: 22 },
  cards: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 6 },
  statCard: { width: '47%', paddingVertical: 16 },
  v: { fontSize: 26, fontWeight: '800', color: theme.ink },
  l: { fontSize: 12, color: theme.inkSoft, marginTop: 2 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
  rid: { fontSize: 13, fontWeight: '700', color: theme.ink },
  time: { fontSize: 12, color: theme.inkSoft },
  badge: { fontSize: 12, fontWeight: '700', paddingVertical: 3, paddingHorizontal: 10, borderRadius: 999, overflow: 'hidden' },
  flag: { backgroundColor: '#FBE4DE', color: theme.lesion },
  clear: { backgroundColor: '#E2F0E8', color: theme.ok },
  assess: { fontSize: 13, color: theme.inkSoft },
});
