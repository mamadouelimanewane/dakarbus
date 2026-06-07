// Vibration courte pour retour tactile sur mobile
export function haptic(type: 'light' | 'medium' | 'heavy' | 'success' | 'error' = 'light') {
  if (!('vibrate' in navigator)) return;
  const patterns: Record<typeof type, number | number[]> = {
    light:   40,
    medium:  60,
    heavy:   100,
    success: [30, 40, 60],
    error:   [80, 40, 80],
  };
  try { navigator.vibrate(patterns[type]); } catch {}
}
