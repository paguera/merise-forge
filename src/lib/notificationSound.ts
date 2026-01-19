// Simple notification sounds using Web Audio API
const audioContext = typeof window !== 'undefined' ? new (window.AudioContext || (window as any).webkitAudioContext)() : null;

export function playNotificationSound(type: 'message' | 'join' | 'reaction') {
  if (!audioContext) return;
  
  // Resume audio context if suspended (browser policy)
  if (audioContext.state === 'suspended') {
    audioContext.resume();
  }

  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();
  
  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);

  const now = audioContext.currentTime;

  switch (type) {
    case 'message':
      // Soft "pop" sound for new message
      oscillator.frequency.setValueAtTime(800, now);
      oscillator.frequency.exponentialRampToValueAtTime(600, now + 0.1);
      gainNode.gain.setValueAtTime(0.15, now);
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
      oscillator.start(now);
      oscillator.stop(now + 0.15);
      break;
      
    case 'join':
      // Two-tone "ding" for user joining
      oscillator.frequency.setValueAtTime(523, now); // C5
      oscillator.frequency.setValueAtTime(659, now + 0.1); // E5
      gainNode.gain.setValueAtTime(0.12, now);
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
      oscillator.start(now);
      oscillator.stop(now + 0.25);
      break;
      
    case 'reaction':
      // Quick chirp for reactions
      oscillator.frequency.setValueAtTime(1000, now);
      oscillator.frequency.exponentialRampToValueAtTime(1200, now + 0.05);
      gainNode.gain.setValueAtTime(0.08, now);
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
      oscillator.start(now);
      oscillator.stop(now + 0.08);
      break;
  }
}
