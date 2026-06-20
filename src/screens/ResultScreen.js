import React, { useState } from 'react';
import { ScrollView, View, Text, StyleSheet, Image, TextInput } from 'react-native';
import Svg, { Rect, Text as SvgText } from 'react-native-svg';
import { Button, Card, P, Eyebrow } from '../components/UI';
import { theme } from '../theme';

const DISPLAY_W = 340;

export default function ResultScreen({ route, navigation }) {
  const { imageUri, imageWidth, imageHeight, detections, inferenceMs, conf, debug, dentalProb, isDental } = route.params;
  const [assessment, setAssessment] = useState(null);
  const [notes, setNotes] = useState('');

  const topPct = detections.length
    ? Math.round(Math.max(...detections.map((d) => d.confidence)) * 100)
    : (debug ? Math.round(debug.maxScore * 100) : null);

  const scale = DISPLAY_W / imageWidth;
  const displayH = imageHeight * scale;

  const proceed = () => {
    navigation.navigate('Questionnaire', {
      imageUri,
      session: {
        detections,
        inference_ms: inferenceMs,
        conf_threshold: conf,
        image_width: imageWidth,
        image_height: imageHeight,
        dental_prob: dentalProb,
        clinician_assessment: { caries_present: assessment, notes: notes.trim() || null },
      },
    });
  };

  return (
    <ScrollView contentContainerStyle={s.wrap}>
      <Eyebrow>Reference output · on-device</Eyebrow>

      {isDental === false && (
        <View style={s.warnBanner}>
          <Text style={s.warnTitle}>This may not be an intraoral photograph</Text>
          <Text style={s.warnBody}>
            The image doesn't look like a photo of teeth ({Math.round((dentalProb ?? 0) * 100)}% dental).
            Results below may be unreliable — consider retaking with the teeth filling the frame.
          </Text>
        </View>
      )}
      <Text style={s.summary}>
        {detections.length === 0
          ? `Highest suspicion: ${topPct == null ? '--' : topPct + '%'}`
          : `${detections.length} region${detections.length > 1 ? 's' : ''} flagged · top ${topPct}%`}
      </Text>
      <Text style={s.meta}>{Math.round(conf * 100)}% threshold  ·  {inferenceMs} ms{detections.length === 0 ? '  ·  below threshold' : ''}</Text>

      <View style={[s.imageWrap, { width: DISPLAY_W, height: displayH }]}>
        <Image source={{ uri: imageUri }} style={{ width: DISPLAY_W, height: displayH, borderRadius: 10 }} />
        <Svg style={StyleSheet.absoluteFill} width={DISPLAY_W} height={displayH}>
          {detections.map((d, i) => {
            const [x, y, w, h] = d.box.map((v) => v * scale);
            const pct = `${Math.round(d.confidence * 100)}%`;
            const labelY = y > 18 ? y - 5 : y + 14;
            return (
              <React.Fragment key={i}>
                <Rect x={x} y={y} width={w} height={h} stroke={theme.lesion} strokeWidth={2.5} fill="transparent" rx={4} />
                <Rect x={x} y={labelY - 13} width={42} height={16} fill={theme.lesion} rx={3} />
                <SvgText x={x + 4} y={labelY - 1} fill="#fff" fontSize="11" fontWeight="bold">{pct}</SvgText>
              </React.Fragment>
            );
          })}
        </Svg>
      </View>

      <P style={{ marginTop: 6, fontStyle: 'italic' }}>Suggested regions only. Confirm against your own examination.</P>

      {debug && (
        <Text style={s.debug}>dbg · top {Math.round(debug.maxScore*100)}% · in[{debug.inMin}-{debug.inMax}] u{debug.inMean} · out {debug.outLen} · {debug.src}</Text>
      )}

      <Card style={{ marginTop: 18 }}>
        <Text style={s.q}>Your independent assessment — caries present?</Text>
        <View style={s.choices}>
          {[['Yes', true], ['No', false], ['Uncertain', null]].map(([label, val]) => (
            <Text key={label} onPress={() => setAssessment(val)} style={[s.choice, assessment === val && s.choiceActive]}>
              {label}
            </Text>
          ))}
        </View>
        <Text style={[s.q, { marginTop: 14 }]}>Notes (optional, no patient identifiers)</Text>
        <TextInput style={s.notes} value={notes} onChangeText={setNotes} multiline placeholder="e.g. occlusal surface, lower left molar" />
      </Card>

      <Button title="Continue to questionnaire" onPress={proceed} />
      <Button title="Retake image" kind="ghost" onPress={() => navigation.goBack()} />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  wrap: { padding: 22, alignItems: 'flex-start' },
  summary: { fontSize: 18, fontWeight: '800', color: theme.ink, marginBottom: 14 },
  warnBanner: { backgroundColor: '#FBE9E2', borderColor: theme.lesion, borderWidth: 1, borderRadius: 12, padding: 14, marginBottom: 14, alignSelf: 'stretch' },
  warnTitle: { color: theme.lesion, fontWeight: '800', fontSize: 14, marginBottom: 4 },
  warnBody: { color: theme.ink, fontSize: 13, lineHeight: 19 },
  meta: { fontSize: 13, fontWeight: '600', color: theme.inkSoft },
  imageWrap: { borderRadius: 10, overflow: 'hidden', backgroundColor: '#000', alignSelf: 'center' },
  q: { fontSize: 15, fontWeight: '700', color: theme.ink, marginBottom: 8 },
  choices: { flexDirection: 'row', gap: 8 },
  choice: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 999, borderWidth: 1.5, borderColor: theme.line, color: theme.inkSoft, fontWeight: '700', overflow: 'hidden' },
  choiceActive: { borderColor: theme.primary, color: theme.primary, backgroundColor: '#E6F2F3' },
  debug: { marginTop: 8, fontSize: 11, color: theme.inkSoft, fontFamily: 'monospace' },
  notes: { borderWidth: 1, borderColor: theme.line, borderRadius: 10, padding: 12, minHeight: 70, textAlignVertical: 'top', color: theme.ink, backgroundColor: '#fff' },
});
