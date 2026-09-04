/** Чужі торгові марки та персонажі — не для назв LUMI і не для фіда Google. */
const PHRASES = [
  "tommy hilfiger",
  "hilfiger",
  "ayugi jeans",
  "ayugi denim",
  "ayugi",
  "wanex",
  "nike",
  "minnie",
  "mickey",
  "tweety",
  "dumbo",
  "figaro",
  "ralph lauren",
  "в стилі відомого бренду",
  "в стилі polo",
  "в стилі POLO",
];

const WHOLE_WORDS = [/\bpolo\b/gi, /\bdaisy\b/gi, /\bbloom\b/gi];

export function stripForeignBrandCopy(text: string): string {
  let out = text;
  for (const phrase of PHRASES) {
    const escaped = phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    out = out.replace(new RegExp(escaped, "gi"), " ");
  }
  for (const re of WHOLE_WORDS) {
    out = out.replace(re, " ");
  }
  return out
    .replace(/\s+([,.;:!?])/g, "$1")
    .replace(/\(\s+/g, "(")
    .replace(/\s+\)/g, ")")
    .replace(/\s{2,}/g, " ")
    .replace(/\s+&\s+/g, " ")
    .trim();
}
