import { useEffect, useRef } from 'react';
import { useToasterStore } from 'react-hot-toast';

export const ToastSpeaker = () => {
  const { toasts } = useToasterStore();
  const spokenIds = useRef<Set<string>>(new Set());

  useEffect(() => {
    // Ensure voices are loaded (Chrome sometimes needs this)
    if ('speechSynthesis' in window && window.speechSynthesis.getVoices().length === 0) {
      window.speechSynthesis.onvoiceschanged = () => {};
    }

    toasts.forEach((toast) => {
      if (toast.visible && !spokenIds.current.has(toast.id)) {
        spokenIds.current.add(toast.id);
        
        let message = '';
        if (typeof toast.message === 'string') {
          message = toast.message;
        } else if (toast.message && typeof toast.message === 'object') {
          try {
            const anyMsg = toast.message as any;
            if (anyMsg.props && typeof anyMsg.props.children === 'string') {
              message = anyMsg.props.children;
            }
          } catch (e) {}
        }

        if (message) {
          speakMessage(message);
        }
      }
    });
  }, [toasts]);

  const speakMessage = (text: string) => {
    if (!('speechSynthesis' in window)) return;
    
    // Optional: Stop previous speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'tr-TR';
    
    const voices = window.speechSynthesis.getVoices();
    const turkishVoices = voices.filter(v => v.lang.includes('tr') || v.lang.includes('TR'));
    
    let femaleVoice = turkishVoices.find(v => 
      v.name.toLowerCase().includes('female') || 
      v.name.toLowerCase().includes('yelda') ||
      v.name.toLowerCase().includes('zeynep') ||
      v.name.toLowerCase().includes('filiz')
    );
    
    if (femaleVoice) {
      utterance.voice = femaleVoice;
    } else if (turkishVoices.length > 0) {
      utterance.voice = turkishVoices[0];
      utterance.pitch = 1.3; // increase pitch to simulate female voice if unknown
    } else {
      utterance.pitch = 1.3;
    }

    utterance.rate = 1.0;
    
    window.speechSynthesis.speak(utterance);
  };

  return null;
};
