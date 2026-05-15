import { useState, useRef, useCallback, useEffect } from 'react';

export function useRealtimeTranscription(onTranscriptionComplete?: (text: string) => void) {
  const [isRecording, setIsRecording] = useState(false);
  const [partialTranscript, setPartialTranscript] = useState('');
  const [transcript, setTranscript] = useState('');
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const workletNodeRef = useRef<AudioWorkletNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const connectWebSocket = useCallback(() => {
    console.log('[Frontend] Connecting to backend WS...');
    const ws = new WebSocket('ws://localhost:3001');
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('[Frontend] WebSocket connected');
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        console.log(`[Frontend] WS Event: ${message.type}`);
        
        if (message.type === 'conversation.item.input_audio_transcription.delta') {
          console.log(`[Frontend] delta: ${message.delta}`);
          setPartialTranscript(prev => prev + message.delta);
        } else if (message.type === 'conversation.item.input_audio_transcription.completed') {
          console.log(`[Frontend] completed: ${message.transcript}`);
          setTranscript(message.transcript);
          setPartialTranscript(''); // Clear partial
          if (onTranscriptionComplete) {
            onTranscriptionComplete(message.transcript);
          }
          // Close WebSocket now that we have the result
          console.log('[Frontend] Closing WS after receiving completed transcript');
          wsRef.current?.close();
        } else if (message.type === 'error') {
          console.error('[Frontend] Error from OpenAI:', message.error);
        }
      } catch (e) {
        console.error('[Frontend] Failed to parse message:', e);
      }
    };

    ws.onclose = () => {
      console.log('[Frontend] WebSocket closed');
      // Reconnect logic
      if (isRecording) {
        console.log('[Frontend] Attempting to reconnect in 2 seconds...');
        reconnectTimeoutRef.current = setTimeout(() => {
          connectWebSocket();
        }, 2000);
      }
    };

    ws.onerror = (err) => {
      console.error('[Frontend] WebSocket error:', err);
    };
  }, [isRecording, onTranscriptionComplete]);

  const startRecording = useCallback(async () => {
    try {
      setTranscript('');
      setPartialTranscript('');
      
      connectWebSocket();

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const audioContext = new AudioContext();
      audioContextRef.current = audioContext;

      // Load worklet
      const workletUrl = new URL('../audioProcessor.js', import.meta.url).href;
      await audioContext.audioWorklet.addModule(workletUrl);

      const source = audioContext.createMediaStreamSource(stream);
      const workletNode = new AudioWorkletNode(audioContext, 'pcm-worklet');
      workletNodeRef.current = workletNode;

      let chunkCount = 0;

      workletNode.port.onmessage = (event) => {
        const buffer = event.data; // ArrayBuffer from worklet
        // Convert to base64
        const base64 = arrayBufferToBase64(buffer);
        
        chunkCount++;
        if (chunkCount % 10 === 0) {
          console.log(`[Frontend] Sent audio chunks: ${chunkCount}`);
        }

        // Send to backend
        if (wsRef.current?.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({
            type: 'input_audio_buffer.append',
            audio: base64
          }));
        }
      };

      source.connect(workletNode);
      
      // Connect to a silent gain node to ensure processing continues in some browsers
      const gain = audioContext.createGain();
      gain.gain.value = 0;
      workletNode.connect(gain);
      gain.connect(audioContext.destination);

      setIsRecording(true);
    } catch (e) {
      console.error('Failed to start recording:', e);
    }
  }, [connectWebSocket]);

  const stopRecording = useCallback(() => {
    console.log('[Frontend] Stopping recording...');
    setIsRecording(false);
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    // Stop audio tracks but leave WS open to receive final transcript
    streamRef.current?.getTracks().forEach(track => track.stop());
    workletNodeRef.current?.disconnect();
    audioContextRef.current?.close();
    
    console.log('[Frontend] Audio stopped. Waiting for final transcript before closing WS...');
    
    // Fallback: Close WS after 5 seconds if no completed event arrives
    setTimeout(() => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        console.log('[Frontend] Fallback: Closing WS after timeout');
        wsRef.current.close();
      }
    }, 5000);
  }, []);

  const toggleRecording = useCallback(() => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  }, [isRecording, startRecording, stopRecording]);

  useEffect(() => {
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      wsRef.current?.close();
      audioContextRef.current?.close();
      streamRef.current?.getTracks().forEach(track => track.stop());
    };
  }, []);

  return {
    isRecording,
    transcript,
    partialTranscript,
    startRecording,
    stopRecording,
    toggleRecording,
    isSupported: !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)
  };
}

// Helper function
function arrayBufferToBase64(buffer: ArrayBuffer) {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}
