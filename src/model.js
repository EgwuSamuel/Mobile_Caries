// On-device caries detector — fully offline, no network.
//
// Pipeline mirrors the verified reference exactly:
//   letterbox to 640 -> normalise 0..1 -> run TFLite -> decode [1,5,8400]
//   -> threshold -> NMS -> un-letterbox back to original image pixels.
// The model outputs NORMALISED (0..1) box coords relative to the 640 canvas;
// this JS decode was cross-checked against the Python reference and produces
// identical boxes.

import { loadTensorflowModel } from 'react-native-fast-tflite';
import * as ImageManipulator from 'expo-image-manipulator';
import jpeg from 'jpeg-js';

const INPUT = 640;
const PAD = 114 / 255; // grey letterbox padding, normalised

let _model = null;
let _loading = null;

export function loadModel() {
  if (_model) return Promise.resolve(_model);
  if (!_loading) {
    _loading = loadTensorflowModel(require('../assets/best_float16.tflite')).then((m) => {
      _model = m;
      return m;
    });
  }
  return _loading;
}

// compact base64 -> Uint8Array (no Buffer/atob dependency)
const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
function b64ToBytes(b64) {
  const lookup = new Uint8Array(256);
  for (let i = 0; i < B64.length; i++) lookup[B64.charCodeAt(i)] = i;
  let len = b64.length;
  let pad = 0;
  if (b64[len - 1] === '=') pad++;
  if (b64[len - 2] === '=') pad++;
  const n = (len / 4) * 3 - pad;
  const bytes = new Uint8Array(n);
  let p = 0;
  for (let i = 0; i < len; i += 4) {
    const e1 = lookup[b64.charCodeAt(i)];
    const e2 = lookup[b64.charCodeAt(i + 1)];
    const e3 = lookup[b64.charCodeAt(i + 2)];
    const e4 = lookup[b64.charCodeAt(i + 3)];
    if (p < n) bytes[p++] = (e1 << 2) | (e2 >> 4);
    if (p < n) bytes[p++] = ((e2 & 15) << 4) | (e3 >> 2);
    if (p < n) bytes[p++] = ((e3 & 3) << 6) | e4;
  }
  return bytes;
}

// uri (+ known source dims) -> { input: Float32Array, scale, padX, padY }
async function preprocess(uri, srcW, srcH) {
  const scale = INPUT / Math.max(srcW, srcH);
  const rw = Math.round(srcW * scale);
  const rh = Math.round(srcH * scale);
  const manip = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: rw, height: rh } }],
    { compress: 1, format: ImageManipulator.SaveFormat.JPEG, base64: true }
  );
  const raw = jpeg.decode(b64ToBytes(manip.base64), { useTArray: true }); // {width,height,data:RGBA}

  const input = new Float32Array(INPUT * INPUT * 3);
  input.fill(PAD);
  const padX = Math.floor((INPUT - raw.width) / 2);
  const padY = Math.floor((INPUT - raw.height) / 2);
  for (let y = 0; y < raw.height; y++) {
    const dy = y + padY;
    if (dy < 0 || dy >= INPUT) continue;
    for (let x = 0; x < raw.width; x++) {
      const dx = x + padX;
      if (dx < 0 || dx >= INPUT) continue;
      const si = (y * raw.width + x) * 4;
      const di = (dy * INPUT + dx) * 3;
      input[di] = raw.data[si] / 255;
      input[di + 1] = raw.data[si + 1] / 255;
      input[di + 2] = raw.data[si + 2] / 255;
    }
  }
  return { input, scale, padX, padY };
}

function nms(boxes, scores, iouThres) {
  const order = [...scores.keys()].sort((i, j) => scores[j] - scores[i]);
  const used = new Array(boxes.length).fill(false);
  const area = (b) => Math.max(0, b[2] - b[0]) * Math.max(0, b[3] - b[1]);
  const keep = [];
  for (const i of order) {
    if (used[i]) continue;
    keep.push(i);
    for (const j of order) {
      if (used[j] || j === i) continue;
      const xx1 = Math.max(boxes[i][0], boxes[j][0]);
      const yy1 = Math.max(boxes[i][1], boxes[j][1]);
      const xx2 = Math.min(boxes[i][2], boxes[j][2]);
      const yy2 = Math.min(boxes[i][3], boxes[j][3]);
      const inter = Math.max(0, xx2 - xx1) * Math.max(0, yy2 - yy1);
      const iou = inter / (area(boxes[i]) + area(boxes[j]) - inter + 1e-9);
      if (iou > iouThres) used[j] = true;
    }
  }
  return keep;
}

const clamp = (v, a, b) => Math.min(Math.max(v, a), b);

function decode(out, scale, padX, padY, srcW, srcH, confThres, iouThres) {
  const N = 8400; // anchors; output layout is [1,5,8400] row-major -> out[c*N + a]
  const boxes = [];
  const scores = [];
  for (let a = 0; a < N; a++) {
    const s = out[4 * N + a];
    if (s < confThres) continue;
    let cx = out[a] * INPUT;
    let cy = out[N + a] * INPUT;
    let w = out[2 * N + a] * INPUT;
    let h = out[3 * N + a] * INPUT;
    boxes.push([cx - w / 2, cy - h / 2, cx + w / 2, cy + h / 2]);
    scores.push(s);
  }
  const keep = nms(boxes, scores, iouThres);
  return keep.map((i) => {
    let [x1, y1, x2, y2] = boxes[i];
    x1 = clamp((x1 - padX) / scale, 0, srcW);
    x2 = clamp((x2 - padX) / scale, 0, srcW);
    y1 = clamp((y1 - padY) / scale, 0, srcH);
    y2 = clamp((y2 - padY) / scale, 0, srcH);
    return { box: [x1, y1, x2 - x1, y2 - y1], confidence: scores[i], label: 'decay' };
  });
}

// Public: run detection on an image file, fully on-device.
export async function detect(uri, srcW, srcH, confThres = 0.4, iouThres = 0.45) {
  const model = await loadModel();
  const t0 = Date.now();
  const { input, scale, padX, padY } = await preprocess(uri, srcW, srcH);
  const outputs = await model.run([input]); // outputs[0] = Float32Array length 5*8400
  const out = outputs[0];
  const detections = decode(out, scale, padX, padY, srcW, srcH, confThres, iouThres);
  return { detections, inferenceMs: Date.now() - t0, imageWidth: srcW, imageHeight: srcH };
}
