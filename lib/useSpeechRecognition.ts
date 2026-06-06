import { useState, useEffect, useCallback } from 'react';

export const useSpeechRecognition = () => {
  const [isListening, setIsListening] = useState(false);
  const [supported, setSupported] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        setSupported(true);
        const recog = new SpeechRecognition();
        recog.continuous = true;
        recog.interimResults = true;
        recog.lang = 'tr-TR';
        
        setRecognition(recog);
      }
    }
  }, []);

  const listen = useCallback((onResult: (text: string, isFinal: boolean) => void, onError?: (err: any) => void) => {
    if (!recognition) return;

    recognition.onresult = (event: any) => {
      let finalTranscript = '';
      let interimTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }

      onResult(finalTranscript, finalTranscript.length > 0);
    };

    recognition.onerror = (event: any) => {
      console.warn("Speech recognition error", event.error);
      setIsListening(false);
      if (onError) onError(event.error);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    try {
      recognition.start();
      setIsListening(true);
    } catch(err) {
      console.error(err);
    }
  }, [recognition]);

  const stop = useCallback(() => {
    if (!recognition) return;
    try {
      recognition.stop();
    } catch(err) {
      console.error(err);
    }
    setIsListening(false);
  }, [recognition]);

  return { isListening, supported, listen, stop };
};
