import { useCallback } from 'react';

export function useAudio() {
  const playSound = useCallback((type: 'new_order' | 'notification' | 'success' | 'alert') => {
    // Check if on employee path
    const employeePaths = ['/employee', '/manager', '/kitchen', '/pos', '/cashier', '/admin', '/owner', '/executive'];
    const isEmployeePath = employeePaths.some(path => window.location.pathname.startsWith(path));

    if (!isEmployeePath) return;

    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    const playTone = (freq: number, startTime: number, duration: number) => {
      const osc = audioContext.createOscillator();
      const gain = audioContext.createGain();
      osc.connect(gain);
      gain.connect(audioContext.destination);
      osc.frequency.setValueAtTime(freq, startTime);
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.05, startTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
      osc.start(startTime);
      osc.stop(startTime + duration);
    };

    if (type === 'new_order') {
      // Play "Ton Ton" twice
      playTone(600, audioContext.currentTime, 0.3);
      playTone(600, audioContext.currentTime + 0.4, 0.3);
    } else if (type === 'notification') {
      playTone(440, audioContext.currentTime, 0.2);
    }
  }, []);

  return { playSound };
}
