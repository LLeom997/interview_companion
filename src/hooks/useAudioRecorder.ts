import { useState, useRef, useCallback } from 'react';

export function useAudioRecorder(onRecordingComplete: (audioBlob: Blob) => void) {
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);
  const isRecordingRef = useRef(false);

  const startRecording = useCallback(async () => {
    if (isRecordingRef.current) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder.current = new MediaRecorder(stream);
      audioChunks.current = [];

      mediaRecorder.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunks.current.push(event.data);
        }
      };

      mediaRecorder.current.onstop = () => {
        const mimeType = mediaRecorder.current?.mimeType || 'audio/webm';
        const audioBlob = new Blob(audioChunks.current, { type: mimeType });
        audioChunks.current = [];
        onRecordingComplete(audioBlob);
        
        mediaRecorder.current?.stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.current.start();
      setIsRecording(true);
      isRecordingRef.current = true;
    } catch (e) {
      console.error("Failed to start recording:", e);
    }
  }, [onRecordingComplete]);

  const stopRecording = useCallback(() => {
    if (!isRecordingRef.current || !mediaRecorder.current) return;
    if (mediaRecorder.current.state === "recording") {
      mediaRecorder.current.stop();
    }
    setIsRecording(false);
    isRecordingRef.current = false;
  }, []);

  const toggleRecording = useCallback(() => {
    if (isRecordingRef.current) {
      stopRecording();
    } else {
      startRecording();
    }
  }, [startRecording, stopRecording]);

  return { 
    isRecording,
    startRecording,
    stopRecording,
    toggleRecording, 
    isSupported: !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia) 
  };
}
