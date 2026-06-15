import React, { useRef, useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
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
      navigation.navigate('Result', {
        imageUri: uri,
        imageWidth: result.imageWidth,
        imageHeight: result.imageHeight,
        detections: result.detections,
        inferenceMs: result.inferenceMs,
        conf,
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
      await analyze(photo.uri, photo.width, photo.height);
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
      await analyze(a.uri, a.width, a.height);
    }
  };

  if (!permission) return <View style={s.center}><ActivityIndicator color={theme.primary} /></View>;

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
        <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} facing="back" />
        <View style={s.frame} pointerEvents="none" />
      </View>
      <View style={s.controls}>
        <Text style={s.hint}>Fill the frame with the teeth. Use even lighting — avoid glare and dark shots.</Text>
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
  cameraBox: { flex: 1, overflow: 'hidden' },
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
