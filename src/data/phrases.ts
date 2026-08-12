export type EntryKind = 'sentence' | 'phrase' | 'idiom';

export type Entry = {
  words: string[];
  /** Thai meaning, shown on the result card so each round teaches something. */
  th: string;
  kind: EntryKind;
};

const POOLS: Record<number, Entry[]> = {
  3: [
    { words: ['The', 'cat', 'sleeps'], th: 'แมวกำลังนอนหลับ', kind: 'sentence' },
    { words: ['Birds', 'can', 'fly'], th: 'นกบินได้', kind: 'sentence' },
    { words: ['I', 'love', 'rain'], th: 'ฉันชอบฝน', kind: 'sentence' },
    { words: ['She', 'reads', 'books'], th: 'เธออ่านหนังสือ', kind: 'sentence' },
    { words: ['Piece', 'of', 'cake'], th: 'ง่ายมาก ชิลๆ', kind: 'idiom' },
    { words: ['Break', 'the', 'ice'], th: 'เริ่มบทสนทนาให้หายเก้อ', kind: 'idiom' },
    { words: ['Hit', 'the', 'road'], th: 'ออกเดินทางกันเถอะ', kind: 'idiom' },
    { words: ['Practice', 'makes', 'perfect'], th: 'ฝึกบ่อยๆ เดี๋ยวก็เก่ง', kind: 'idiom' },
    { words: ['Keep', 'in', 'touch'], th: 'ติดต่อกันไว้นะ', kind: 'phrase' },
    { words: ['Call', 'it', 'off'], th: 'ยกเลิกซะ', kind: 'phrase' },
  ],
  4: [
    { words: ['I', 'drink', 'cold', 'water'], th: 'ฉันดื่มน้ำเย็น', kind: 'sentence' },
    { words: ['The', 'moon', 'looks', 'bright'], th: 'พระจันทร์ดูสว่าง', kind: 'sentence' },
    { words: ['We', 'walk', 'to', 'school'], th: 'เราเดินไปโรงเรียน', kind: 'sentence' },
    { words: ['She', 'found', 'a', 'shell'], th: 'เธอเจอเปลือกหอย', kind: 'sentence' },
    { words: ['Time', 'flies', 'so', 'fast'], th: 'เวลาผ่านไปเร็วมาก', kind: 'sentence' },
    { words: ['Better', 'late', 'than', 'never'], th: 'มาช้ายังดีกว่าไม่มา', kind: 'idiom' },
    { words: ['Go', 'the', 'extra', 'mile'], th: 'ทุ่มเทมากกว่าที่ต้องทำ', kind: 'idiom' },
    { words: ['Let', 'sleeping', 'dogs', 'lie'], th: 'อย่าไปรื้อฟื้นเรื่องที่สงบแล้ว', kind: 'idiom' },
    { words: ['A', 'blessing', 'in', 'disguise'], th: 'โชคดีที่แฝงมาในคราบเรื่องร้าย', kind: 'idiom' },
    { words: ['Speak', 'of', 'the', 'devil'], th: 'พูดถึงอยู่เลย เจอตัวพอดี', kind: 'idiom' },
  ],
  5: [
    { words: ['We', 'play', 'games', 'every', 'day'], th: 'เราเล่นเกมกันทุกวัน', kind: 'sentence' },
    { words: ['The', 'old', 'clock', 'ticks', 'loudly'], th: 'นาฬิกาเก่าเดินเสียงดัง', kind: 'sentence' },
    { words: ['He', 'climbed', 'the', 'tall', 'ladder'], th: 'เขาปีนบันไดสูง', kind: 'sentence' },
    { words: ['Stars', 'appear', 'after', 'the', 'sunset'], th: 'ดาวจะขึ้นหลังพระอาทิตย์ตก', kind: 'sentence' },
    { words: ['My', 'dog', 'buried', 'a', 'bone'], th: 'หมาของฉันฝังกระดูก', kind: 'sentence' },
    { words: ['Green', 'leaves', 'dance', 'in', 'wind'], th: 'ใบไม้เขียวไหวตามลม', kind: 'sentence' },
    { words: ['Once', 'in', 'a', 'blue', 'moon'], th: 'นานๆ ครั้ง', kind: 'idiom' },
    { words: ["It's", 'raining', 'cats', 'and', 'dogs'], th: 'ฝนตกหนักมาก', kind: 'idiom' },
    { words: ['Actions', 'speak', 'louder', 'than', 'words'], th: 'การกระทำสำคัญกว่าคำพูด', kind: 'idiom' },
    { words: ["Don't", 'cry', 'over', 'spilled', 'milk'], th: 'เรื่องที่ผ่านไปแล้วอย่าไปเสียใจ', kind: 'idiom' },
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
