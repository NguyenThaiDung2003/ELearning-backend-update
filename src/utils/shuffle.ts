/** Bam chuoi thanh so 32-bit de lam seed. */
const hashSeed = (value: string) => {
  let hash = 2166136261;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
};

/** mulberry32: PRNG nho, deterministic. */
const createRandom = (seed: number) => () => {
  let state = (seed += 0x6d2b79f5);
  state = Math.imul(state ^ (state >>> 15), state | 1);
  state ^= state + Math.imul(state ^ (state >>> 7), state | 61);

  return ((state ^ (state >>> 14)) >>> 0) / 4294967296;
};

/**
 * Fisher-Yates co seed: cung mot seed luon cho cung thu tu, nen sinh vien tai
 * lai trang van thay dung thu tu cau hoi cua minh, con hai sinh vien khac nhau
 * thi khac de tranh nhin bai.
 */
export const seededShuffle = <T>(items: T[], seed: string) => {
  const random = createRandom(hashSeed(seed));
  const result = [...items];

  for (let index = result.length - 1; index > 0; index -= 1) {
    const target = Math.floor(random() * (index + 1));
    [result[index], result[target]] = [result[target], result[index]];
  }

  return result;
};
