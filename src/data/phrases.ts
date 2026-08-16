export type EntryKind = 'sentence' | 'phrase' | 'idiom';

export type Pos = 'noun' | 'verb' | 'adj' | 'adv' | 'pron' | 'prep' | 'conj' | 'det' | 'aux';

export const POS_LABEL: Record<Pos, string> = {
  noun: 'NOUN',
  verb: 'VERB',
  adj: 'ADJ',
  adv: 'ADV',
  pron: 'PRON',
  prep: 'PREP',
  conj: 'CONJ',
  det: 'DET',
  aux: 'AUX',
};

export type Entry = {
  words: string[];
  /** Word-by-word Thai gloss, same length as `words`. '—' where a word carries no meaning alone. */
  wordsTh: string[];
  /** Part of speech each word plays in this phrase, same length as `words`. */
  wordsPos: Pos[];
  /** Thai meaning, shown on the result card so each round teaches something. */
  th: string;
  kind: EntryKind;
};

const POOLS: Record<number, Entry[]> = {
  3: [
    { words: ['The', 'cat', 'sleeps'], wordsTh: ['—', 'แมว', 'นอนหลับ'], wordsPos: ['det', 'noun', 'verb'], th: 'แมวกำลังนอนหลับ', kind: 'sentence' },
    { words: ['Birds', 'can', 'fly'], wordsTh: ['นก', 'ทำได้', 'บิน'], wordsPos: ['noun', 'aux', 'verb'], th: 'นกบินได้', kind: 'sentence' },
    { words: ['I', 'love', 'rain'], wordsTh: ['ฉัน', 'รัก', 'ฝน'], wordsPos: ['pron', 'verb', 'noun'], th: 'ฉันชอบฝน', kind: 'sentence' },
    { words: ['She', 'reads', 'books'], wordsTh: ['เธอ', 'อ่าน', 'หนังสือ'], wordsPos: ['pron', 'verb', 'noun'], th: 'เธออ่านหนังสือ', kind: 'sentence' },
    { words: ['Piece', 'of', 'cake'], wordsTh: ['ชิ้น', 'ของ', 'เค้ก'], wordsPos: ['noun', 'prep', 'noun'], th: 'ง่ายมาก ชิลๆ', kind: 'idiom' },
    { words: ['Break', 'the', 'ice'], wordsTh: ['ทำให้แตก', '—', 'น้ำแข็ง'], wordsPos: ['verb', 'det', 'noun'], th: 'เริ่มบทสนทนาให้หายเก้อ', kind: 'idiom' },
    { words: ['Hit', 'the', 'road'], wordsTh: ['ออกตัว', '—', 'ถนน'], wordsPos: ['verb', 'det', 'noun'], th: 'ออกเดินทางกันเถอะ', kind: 'idiom' },
    { words: ['Practice', 'makes', 'perfect'], wordsTh: ['ฝึกฝน', 'ทำให้', 'สมบูรณ์แบบ'], wordsPos: ['noun', 'verb', 'adj'], th: 'ฝึกบ่อยๆ เดี๋ยวก็เก่ง', kind: 'idiom' },
    { words: ['Keep', 'in', 'touch'], wordsTh: ['รักษาไว้', 'ใน', 'การติดต่อ'], wordsPos: ['verb', 'prep', 'noun'], th: 'ติดต่อกันไว้นะ', kind: 'phrase' },
    { words: ['Call', 'it', 'off'], wordsTh: ['สั่ง', 'มัน', 'เลิก'], wordsPos: ['verb', 'pron', 'adv'], th: 'ยกเลิกซะ', kind: 'phrase' },
  ],
  4: [
    { words: ['I', 'drink', 'cold', 'water'], wordsTh: ['ฉัน', 'ดื่ม', 'เย็น', 'น้ำ'], wordsPos: ['pron', 'verb', 'adj', 'noun'], th: 'ฉันดื่มน้ำเย็น', kind: 'sentence' },
    { words: ['The', 'moon', 'looks', 'bright'], wordsTh: ['—', 'พระจันทร์', 'ดูเหมือน', 'สว่าง'], wordsPos: ['det', 'noun', 'verb', 'adj'], th: 'พระจันทร์ดูสว่าง', kind: 'sentence' },
    { words: ['We', 'walk', 'to', 'school'], wordsTh: ['เรา', 'เดิน', 'ไปยัง', 'โรงเรียน'], wordsPos: ['pron', 'verb', 'prep', 'noun'], th: 'เราเดินไปโรงเรียน', kind: 'sentence' },
    { words: ['She', 'found', 'a', 'shell'], wordsTh: ['เธอ', 'เจอ', '—', 'เปลือกหอย'], wordsPos: ['pron', 'verb', 'det', 'noun'], th: 'เธอเจอเปลือกหอย', kind: 'sentence' },
    { words: ['Time', 'flies', 'so', 'fast'], wordsTh: ['เวลา', 'บินไป', 'ช่าง', 'เร็ว'], wordsPos: ['noun', 'verb', 'adv', 'adv'], th: 'เวลาผ่านไปเร็วมาก', kind: 'sentence' },
    { words: ['Better', 'late', 'than', 'never'], wordsTh: ['ดีกว่า', 'สาย', 'กว่า', 'ไม่ได้ทำเลย'], wordsPos: ['adj', 'adv', 'conj', 'adv'], th: 'มาช้ายังดีกว่าไม่มา', kind: 'idiom' },
    { words: ['Go', 'the', 'extra', 'mile'], wordsTh: ['ไป', '—', 'เพิ่มอีก', 'ไมล์'], wordsPos: ['verb', 'det', 'adj', 'noun'], th: 'ทุ่มเทมากกว่าที่ต้องทำ', kind: 'idiom' },
    { words: ['Let', 'sleeping', 'dogs', 'lie'], wordsTh: ['ปล่อยให้', 'ที่หลับอยู่', 'หมา', 'นอนนิ่ง'], wordsPos: ['verb', 'adj', 'noun', 'verb'], th: 'อย่าไปรื้อฟื้นเรื่องที่สงบแล้ว', kind: 'idiom' },
    { words: ['A', 'blessing', 'in', 'disguise'], wordsTh: ['—', 'พร', 'ใน', 'คราบปลอม'], wordsPos: ['det', 'noun', 'prep', 'noun'], th: 'โชคดีที่แฝงมาในคราบเรื่องร้าย', kind: 'idiom' },
    { words: ['Speak', 'of', 'the', 'devil'], wordsTh: ['พูดถึง', 'ของ', '—', 'ปีศาจ'], wordsPos: ['verb', 'prep', 'det', 'noun'], th: 'พูดถึงอยู่เลย เจอตัวพอดี', kind: 'idiom' },
  ],
  5: [
    { words: ['We', 'play', 'games', 'every', 'day'], wordsTh: ['เรา', 'เล่น', 'เกม', 'ทุก', 'วัน'], wordsPos: ['pron', 'verb', 'noun', 'det', 'noun'], th: 'เราเล่นเกมกันทุกวัน', kind: 'sentence' },
    { words: ['The', 'old', 'clock', 'ticks', 'loudly'], wordsTh: ['—', 'เก่า', 'นาฬิกา', 'เดินติ๊กๆ', 'เสียงดัง'], wordsPos: ['det', 'adj', 'noun', 'verb', 'adv'], th: 'นาฬิกาเก่าเดินเสียงดัง', kind: 'sentence' },
    { words: ['He', 'climbed', 'the', 'tall', 'ladder'], wordsTh: ['เขา', 'ปีน', '—', 'สูง', 'บันได'], wordsPos: ['pron', 'verb', 'det', 'adj', 'noun'], th: 'เขาปีนบันไดสูง', kind: 'sentence' },
    { words: ['Stars', 'appear', 'after', 'the', 'sunset'], wordsTh: ['ดวงดาว', 'ปรากฏ', 'หลังจาก', '—', 'ตะวันตกดิน'], wordsPos: ['noun', 'verb', 'prep', 'det', 'noun'], th: 'ดาวจะขึ้นหลังพระอาทิตย์ตก', kind: 'sentence' },
    { words: ['My', 'dog', 'buried', 'a', 'bone'], wordsTh: ['ของฉัน', 'หมา', 'ฝัง', '—', 'กระดูก'], wordsPos: ['det', 'noun', 'verb', 'det', 'noun'], th: 'หมาของฉันฝังกระดูก', kind: 'sentence' },
    { words: ['Green', 'leaves', 'dance', 'in', 'wind'], wordsTh: ['เขียว', 'ใบไม้', 'เต้นรำ', 'ใน', 'สายลม'], wordsPos: ['adj', 'noun', 'verb', 'prep', 'noun'], th: 'ใบไม้เขียวไหวตามลม', kind: 'sentence' },
    { words: ['Once', 'in', 'a', 'blue', 'moon'], wordsTh: ['ครั้งหนึ่ง', 'ใน', '—', 'สีน้ำเงิน', 'พระจันทร์'], wordsPos: ['adv', 'prep', 'det', 'adj', 'noun'], th: 'นานๆ ครั้ง', kind: 'idiom' },
    { words: ["It's", 'raining', 'cats', 'and', 'dogs'], wordsTh: ['มัน', 'ฝนตก', 'แมว', 'และ', 'หมา'], wordsPos: ['pron', 'verb', 'noun', 'conj', 'noun'], th: 'ฝนตกหนักมาก', kind: 'idiom' },
    { words: ['Actions', 'speak', 'louder', 'than', 'words'], wordsTh: ['การกระทำ', 'พูด', 'เสียงดังกว่า', 'มากกว่า', 'คำพูด'], wordsPos: ['noun', 'verb', 'adv', 'conj', 'noun'], th: 'การกระทำสำคัญกว่าคำพูด', kind: 'idiom' },
    { words: ["Don't", 'cry', 'over', 'spilled', 'milk'], wordsTh: ['อย่า', 'ร้องไห้', 'เรื่อง', 'ที่หกไปแล้ว', 'นม'], wordsPos: ['aux', 'verb', 'prep', 'adj', 'noun'], th: 'เรื่องที่ผ่านไปแล้วอย่าไปเสียใจ', kind: 'idiom' },
  ],
};

export const KIND_LABEL: Record<EntryKind, string> = {
  sentence: 'SENTENCE',
  phrase: 'PHRASE',
  idiom: 'IDIOM',
};

export function pickEntry(wordCount: number, avoid?: Entry): Entry {
  const pool = POOLS[wordCount] ?? POOLS[5];
  const choices = pool.filter((e) => e.words.join(' ') !== avoid?.words.join(' '));
  return choices[Math.floor(Math.random() * choices.length)];
}
