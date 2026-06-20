import React, { useRef, useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, Image } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { Button, P } from '../components/UI';
import { detect } from '../model';
import { getConf } from '../storage';
import { theme } from '../theme';

export default function CaptureScreen({ navigation }) {
  const [permission, requestPermission] = useCameraPermissions();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [facing, setFacing] = useState('back');   // 'back' | 'front'
  const [torch, setTorch] = useState(false);       // phone light on/off
  const [pending, setPending] = useState(null);     // { uri, w, h } awaiting confirm
  const cameraRef = useRef(null);

  useEffect(() => {
    if (permission && !permission.granted && permission.canAskAgain) requestPermission();
  }, [permission]);

  // Shared path: image uri + dims -> on-device detect -> Result.
  const analyze = async (uri, w, h) => {
    setBusy(true); setError(null);
    try {
      const conf = await getConf();
      const result = await detect(uri, w, h, conf);
      setPending(null);
      navigation.navigate('Result', {
        imageUri: uri,
        imageWidth: result.imageWidth,
        imageHeight: result.imageHeight,
        detections: result.detections,
        inferenceMs: result.inferenceMs,
        conf,
        dentalProb: result.dentalProb,
        isDental: result.isDental,
        debug: result.debug,
      });
    } catch (e) {
      setError(e.message || 'Analysis failed');
    } finally {
      setBusy(false);
    }
  };

  const capture = async () => {
    if (!cameraRef.current || busy) return;
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.9 });
      setError(null);
      setPending({ uri: photo.uri, w: photo.width, h: photo.height });
    } catch (e) {
      setError(e.message || 'Capture failed');
    }
  };

  const upload = async () => {
    if (busy) return;
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permission needed', 'Allow photo access to choose an existing image.');
      return;
    }
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.9 });
    if (!res.canceled && res.assets?.length) {
      const a = res.assets[0];
      setError(null);
      setPending({ uri: a.uri, w: a.width, h: a.height });
    }
  };

  if (!permission) return <View style={s.center}><ActivityIndicator color={theme.primary} /></View>;

  // Preview-confirm: show the chosen image before running detection.
  if (pending) {
    return (
      <View style={s.previewWrap}>
        <Text style={s.previewTitle}>Use this image?</Text>
        <Text style={s.previewSub}>Check the teeth are in focus and well lit before analysing.</Text>
        <Image source={{ uri: pending.uri }} style={s.previewImg} resizeMode="contain" />
        {error && <Text style={s.error}>{error}</Text>}
        <Button
          title={busy ? 'Analysing on device…' : 'Use this image'}
          onPress={() => analyze(pending.uri, pending.w, pending.h)}
          loading={busy}
        />
        <Button title="Retake / choose another" kind="ghost" onPress={() => { setPending(null); setError(null); }} disabled={busy} />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={s.center}>
        <P style={{ textAlign: 'center', marginBottom: 16 }}>
          Camera access is off. Grant it to capture, or choose an existing image instead.
        </P>
        <Button title="Grant camera access" onPress={requestPermission} />
        <Button title="Upload from library" kind="ghost" onPress={upload} loading={busy} />
        {error && <Text style={s.error}>{error}</Text>}
      </View>
    );
  }

  return (
    <View style={s.wrap}>
      <View style={s.cameraBox}>
        <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} facing={facing} enableTorch={torch} />
        <View style={s.frame} pointerEvents="none" />
        <View style={s.topBar}>
          <TouchableOpacity style={[s.pill, torch && s.pillOn]} onPress={() => setTorch((t) => !t)} activeOpacity={0.7}>
            <Text style={[s.pillText, torch && s.pillTextOn]}>{torch ? 'Light On' : 'Light Off'}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={s.pill}
            onPress={() => setFacing((f) => (f === 'back' ? 'front' : 'back'))}
            activeOpacity={0.7}
          >
            <Text style={s.pillText}>{facing === 'back' ? 'Rear cam' : 'Front cam'} ⟲</Text>
          </TouchableOpacity>
        </View>
      </View>
      <View style={s.controls}>
        <Text style={s.hint}>Fill the frame with the teeth. Use even lighting — avoid glare and dark shots.</Text>
        {facing === 'front' && <Text style={s.note}>Front camera is lower quality; use the rear camera when possible.</Text>}
        {error && <Text style={s.error}>{error}</Text>}
        <View style={s.actions}>
          <View style={s.side} />
          <TouchableOpacity style={s.shutter} onPress={capture} disabled={busy} activeOpacity={0.8}>
            {busy ? <ActivityIndicator color="#fff" /> : <View style={s.shutterInner} />}
          </TouchableOpacity>
          <TouchableOpacity style={s.side} onPress={upload} disabled={busy} activeOpacity={0.7}>
            <View style={s.uploadIcon}><Text style={s.uploadGlyph}>↑</Text></View>
            <Text style={s.sideLabel}>Upload</Text>
          </TouchableOpacity>
        </View>
        <Text style={s.shutterLabel}>{busy ? 'Analysing on device…' : 'Capture, or upload an existing photo'}</Text>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: '#000' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: theme.bg },
  previewWrap: { flex: 1, padding: 22, backgroundColor: theme.bg, justifyContent: 'center' },
  previewTitle: { fontSize: 22, fontWeight: '800', color: theme.ink, textAlign: 'center' },
  previewSub: { fontSize: 14, color: theme.inkSoft, textAlign: 'center', marginTop: 6, marginBottom: 16 },
  previewImg: { width: '100%', height: 360, borderRadius: 14, backgroundColor: '#000' },
  cameraBox: { flex: 1, overflow: 'hidden' },
  topBar: { position: 'absolute', top: 14, left: 14, right: 14, flexDirection: 'row', justifyContent: 'space-between' },
  pill: { backgroundColor: 'rgba(14,42,51,0.6)', paddingVertical: 8, paddingHorizontal: 14, borderRadius: 999, borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' },
  pillOn: { backgroundColor: theme.primary, borderColor: theme.primary },
  pillText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  pillTextOn: { color: '#fff' },
  note: { color: '#FFD9A0', fontSize: 12, textAlign: 'center', marginBottom: 8 },
  frame: { position: 'absolute', top: '20%', left: '8%', right: '8%', bottom: '20%', borderWidth: 2, borderColor: 'rgba(255,255,255,0.65)', borderRadius: 16 },
  controls: { backgroundColor: theme.ink, paddingVertical: 22, paddingHorizontal: 20, alignItems: 'center' },
  hint: { color: '#CFE0E3', fontSize: 13, textAlign: 'center', marginBottom: 14, lineHeight: 18 },
  error: { color: '#FFB4A2', marginTop: 10, textAlign: 'center' },
  actions: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%' },
  side: { width: 64, alignItems: 'center' },
  shutter: { width: 74, height: 74, borderRadius: 37, backgroundColor: theme.primary, alignItems: 'center', justifyContent: 'center', borderWidth: 4, borderColor: 'rgba(255,255,255,0.3)' },
  shutterInner: { width: 56, height: 56, borderRadius: 28, backgroundColor: theme.primary, borderWidth: 2, borderColor: '#fff' },
  uploadIcon: { width: 44, height: 44, borderRadius: 12, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.5)', alignItems: 'center', justifyContent: 'center' },
  uploadGlyph: { color: '#fff', fontSize: 20, fontWeight: '700' },
  sideLabel: { color: '#CFE0E3', fontSize: 11, marginTop: 5, fontWeight: '600' },
  shutterLabel: { color: '#fff', marginTop: 12, fontWeight: '700' },
});
