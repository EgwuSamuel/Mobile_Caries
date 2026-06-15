// On-device anonymised session store. Replaces the server entirely.
// Sessions live in AsyncStorage; the captured image (optional) is copied into
// the app's private document directory. Nothing leaves the device unless the
// user explicitly exports it.
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

const KEY = 'sessions';
const CONF_KEY = 'conf';
const IMG_DIR = FileSystem.documentDirectory + 'captures/';

export async function getConf() {
  const v = await AsyncStorage.getItem(CONF_KEY);
  return v ? parseFloat(v) : 0.4;
}
export async function setConf(v) {
  await AsyncStorage.setItem(CONF_KEY, String(v));
}

async function ensureDir() {
  const info = await FileSystem.getInfoAsync(IMG_DIR);
  if (!info.exists) await FileSystem.makeDirectoryAsync(IMG_DIR, { intermediates: true });
}

// Persist a session. If keepImageUri is provided, the image is copied locally.
export async function saveSession(session, keepImageUri) {
  const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  let imageUri = null;
  if (keepImageUri) {
    try {
      await ensureDir();
      imageUri = IMG_DIR + id + '.jpg';
      await FileSystem.copyAsync({ from: keepImageUri, to: imageUri });
    } catch {
      imageUri = null;
    }
  }
  const record = { id, created_at: new Date().toISOString(), image_uri: imageUri, ...session };
  const all = await listSessions();
  all.unshift(record);
  await AsyncStorage.setItem(KEY, JSON.stringify(all));
  return record;
}

export async function listSessions() {
  const raw = await AsyncStorage.getItem(KEY);
  return raw ? JSON.parse(raw) : [];
}

export async function clearSessions() {
  const all = await listSessions();
  for (const s of all) {
    if (s.image_uri) {
      try { await FileSystem.deleteAsync(s.image_uri, { idempotent: true }); } catch {}
    }
  }
  await AsyncStorage.removeItem(KEY);
}

export function summarise(sessions) {
  const total = sessions.length;
  const withDet = sessions.filter((s) => (s.detections || []).length > 0).length;
  let agree = 0, considered = 0;
  for (const s of sessions) {
    const ca = s.clinician_assessment || {};
    if (typeof ca.caries_present === 'boolean') {
      considered++;
      if (ca.caries_present === ((s.detections || []).length > 0)) agree++;
    }
  }
  const meanOf = (field) => {
    const vals = [];
    for (const s of sessions) {
      const q = s[field] || {};
      for (const v of Object.values(q)) if (typeof v === 'number') vals.push(v);
    }
    return vals.length ? Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 100) / 100 : null;
  };
  return {
    total,
    detectionRate: total ? Math.round((withDet / total) * 100) : null,
    agreement: considered ? Math.round((agree / considered) * 100) : null,
    nAgreement: considered,
    meanPatient: meanOf('patient_questionnaire'),
    meanClinician: meanOf('clinician_questionnaire'),
  };
}

// Export anonymised records as a JSON file via the share sheet (no images).
export async function exportSessions() {
  const all = await listSessions();
  const clean = all.map(({ image_uri, ...rest }) => rest); // strip local image paths
  const payload = { exported_at: new Date().toISOString(), n: clean.length, sessions: clean };
  const path = FileSystem.cacheDirectory + 'caries_sessions.json';
  await FileSystem.writeAsStringAsync(path, JSON.stringify(payload, null, 2));
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(path, { mimeType: 'application/json', dialogTitle: 'Export anonymised sessions' });
  }
  return path;
}
