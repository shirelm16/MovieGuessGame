export function hashDate(dateStr) {
  // Convert date to days-since-epoch, then apply Murmur-style bit mixing
  // for strong avalanche effect (consecutive days → unrelated movie indices)
  const days = Math.floor(new Date(dateStr).getTime() / 86400000);
  let h = days;
  h = Math.imul(h ^ (h >>> 16), 0x45d9f3b) | 0;
  h = Math.imul(h ^ (h >>> 16), 0x45d9f3b) | 0;
  h = h ^ (h >>> 16);
  return Math.abs(h);
}

export function getTodayString() {
  return new Date().toISOString().slice(0, 10);
}
