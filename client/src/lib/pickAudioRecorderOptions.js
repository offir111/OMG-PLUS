/**
 * בחירת mimeType ל־MediaRecorder — תואם Samsung WebView / Chrome (webm או mp4).
 */
export function pickAudioRecorderOptions() {
  if (typeof MediaRecorder === 'undefined') return { mimeType: null };
  const candidates = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/mp4',
  ];
  for (const mimeType of candidates) {
    if (MediaRecorder.isTypeSupported(mimeType)) return { mimeType };
  }
  return { mimeType: null };
}

export function createMediaRecorder(stream) {
  const { mimeType } = pickAudioRecorderOptions();
  try {
    if (mimeType) return new MediaRecorder(stream, { mimeType });
  } catch {
    /* נסיון ברירת מחדל של המכשיר */
  }
  return new MediaRecorder(stream);
}
