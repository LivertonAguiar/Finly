// Utility to heal all emojis and accented characters in localStorage on app startup
export function cleanMojibakeString(str: string): string {
  if (!str || typeof str !== 'string') return str;
  return str
    .replace(/ðŸ  |ðŸ Ÿ|ðŸ /g, '🏠')
    .replace(/ðŸ›¡ï¸ |ðŸ›¡/g, '🛡️')
    .replace(/âœˆï¸ |âœˆ/g, '✈️')
    .replace(/ðŸ ½ï¸ |ðŸ ½/g, '🍽️')
    .replace(/ðŸ›’/g, '🛒')
    .replace(/ðŸ •/g, '🍕')
    .replace(/â˜•/g, '☕')
    .replace(/ðŸ¥–/g, '🥖')
    .replace(/ðŸ ­/g, '🏢')
    .replace(/âš¡/g, '⚡')
    .replace(/ðŸš°/g, '🚰')
    .replace(/ðŸ“¶/g, '📶')
    .replace(/ðŸ”§/g, '🛠️')
    .replace(/ðŸš—/g, '🚗')
    .replace(/â›½/g, '⛽')
    .replace(/ðŸš•/g, '🚕')
    .replace(/ðŸ…¿ï¸ /g, '🅿️')
    .replace(/ðŸ”§/g, '🔧')
    .replace(/ðŸšŒ/g, '🚌')
    .replace(/ðŸ’Š/g, '💊')
    .replace(/ðŸ’‰/g, '💉')
    .replace(/ðŸ ¥/g, '🏥')
    .replace(/ðŸ©º/g, '🩺')
    .replace(/ðŸ ‹ï¸ |ðŸ ‹/g, '🏋️')
    .replace(/ðŸ§´/g, '🧴')
    .replace(/ðŸŽ®/g, '🎮')
    .replace(/ðŸ“º/g, '📺')
    .replace(/ðŸŽŸï¸ /g, '🎟️')
    .replace(/ðŸŽ²/g, '🎲')
    .replace(/ðŸŽ“/g, '🎓')
    .replace(/ðŸ «/g, '🏫')
    .replace(/ðŸ’»/g, '💻')
    .replace(/ðŸ“š/g, '📚')
    .replace(/ðŸ ¶/g, '🐶')
    .replace(/ðŸ¥©/g, '🥩')
    .replace(/âœ‚ï¸ /g, '✂️')
    .replace(/âš ï¸ |âš /g, '⚠️')
    .replace(/ðŸ“„/g, '📄')
    .replace(/ðŸ’¼/g, '💼')
    .replace(/ðŸ –ï¸ |ðŸ –/g, '🏖️')
    .replace(/ðŸª™/g, '🪙')
    .replace(/ðŸ“¦/g, '📦')
    .replace(/ðŸ“Š/g, '📊')
    .replace(/ðŸŽ /g, '🎁')
    .replace(/ðŸŽ‰/g, '🎉')
    .replace(/â†©ï¸ /g, '↩️')
    .replace(/â­ /g, '⭐')
    .replace(/â ¤ï¸ /g, '❤️')
    .replace(/ðŸ”¥/g, '🔥')
    .replace(/âœ…/g, '✅')
    .replace(/â Œ/g, '❌')
    .replace(/ðŸ””/g, '🔔')
    .replace(/ðŸ”’/g, '🔒')
    .replace(/ðŸ’¡/g, '💡')
    .replace(/ðŸ †/g, '🏆')
    .replace(/ðŸŽ¯/g, '🎯')
    .replace(/ðŸš€/g, '🚀')
    .replace(/ðŸŒŸ/g, '🌟')
    .replace(/ðŸ’¯/g, '💯')
    .replace(/âœ¨/g, '✨')
    .replace(/ðŸŒˆ/g, '🌈')
    .replace(/ðŸ‘‹/g, '👋')
    .replace(/ðŸ’°/g, '💰')
    .replace(/ðŸ’µ/g, '💵')
    .replace(/ðŸ’³/g, '💳')
    .replace(/ðŸ ¦/g, '🏦')
    .replace(/ðŸ“ˆ/g, '📈')
    .replace(/ðŸ’¸/g, '💸')
    .replace(/ðŸ’Ž/g, '💎')
    .replace(/ðŸŸ£/g, '🟣')
    .replace(/ðŸŸ /g, '🟠')
    .replace(/ðŸŸ§/g, '🟧')
    .replace(/ðŸ”´/g, '🔴')
    .replace(/ðŸŸ¡/g, '🟡')
    .replace(/ðŸ›‘/g, '🛑')
    .replace(/ðŸ”µ/g, '🔷')
    .replace(/âš«/g, '⚫')
    .replace(/ðŸŸ¢/g, '🟢')
    .replace(/ðŸ’µ/g, '💵')
    .replace(/Ã¡/g, 'á')
    .replace(/Ã /g, 'à')
    .replace(/Ã¢/g, 'â')
    .replace(/Ã£/g, 'ã')
    .replace(/Ã©/g, 'é')
    .replace(/Ãª/g, 'ê')
    .replace(/Ã­/g, 'í')
    .replace(/Ã³/g, 'ó')
    .replace(/Ã´/g, 'ô')
    .replace(/Ãµ/g, 'õ')
    .replace(/Ãº/g, 'ú')
    .replace(/Ã§/g, 'ç')
    .replace(/Ã /g, 'Á')
    .replace(/Ã‰/g, 'É')
    .replace(/Ã“/g, 'Ó')
    .replace(/Ãš/g, 'Ú')
    .replace(/Ã‡/g, 'Ç');
}

export function sanitizeObject<T>(obj: T): T {
  if (typeof obj === 'string') {
    return cleanMojibakeString(obj) as unknown as T;
  }
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item)) as unknown as T;
  }
  if (obj !== null && typeof obj === 'object') {
    const res: any = {};
    for (const k of Object.keys(obj)) {
      res[k] = sanitizeObject((obj as any)[k]);
    }
    return res as T;
  }
  return obj;
}

export function autoHealLocalStorage(): void {
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('finly_')) {
        const raw = localStorage.getItem(key);
        if (raw && (raw.includes('Ã') || raw.includes('ðŸ') || raw.includes('â'))) {
          try {
            const parsed = JSON.parse(raw);
            const sanitized = sanitizeObject(parsed);
            localStorage.setItem(key, JSON.stringify(sanitized));
          } catch {
            const cleaned = cleanMojibakeString(raw);
            localStorage.setItem(key, cleaned);
          }
        }
      }
    }
  } catch (e) {
    console.error('Storage heal error:', e);
  }
}
