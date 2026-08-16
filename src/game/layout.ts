export type Point = { x: number; y: number };

export const CARD_GAP = 12;
export const CARD_RATIO = 1.25;
const MAX_COLUMNS = 3;

export function rowsFor(count: number): number[] {
  if (count <= MAX_COLUMNS) return [count];
  if (count === 4) return [2, 2];
  return [3, count - 3];
}

export function cardSize(boardWidth: number) {
  const width = (boardWidth - CARD_GAP * (MAX_COLUMNS - 1)) / MAX_COLUMNS;
  return { width, height: width * CARD_RATIO };
}

export type CardFontSizes = { word: number; gloss: number; pos: number; number: number };

/**
 * Width of one bold character at 1em. Measured on the card font (~0.53 for the
 * widest words) and rounded up, so a slightly wider font on another platform
 * still has room instead of clipping.
 */
const CHAR_EM = 0.55;

function fitting(cardWidth: number, chars: number, cap: number, floor: number): number {
  const room = cardWidth - 14;
  return Math.round(Math.max(floor, Math.min(cap, room / (Math.max(3, chars) * CHAR_EM))));
}

/**
 * One text size for the whole board, as big as the longest word on it allows.
 * Short words get a much bigger card; long ones shrink just enough to still fit,
 * which matters because `adjustsFontSizeToFit` does nothing on web.
 */
export function cardFontSizes(
  cardWidth: number,
  longestWord: number,
  longestGloss: number,
): CardFontSizes {
  const word = fitting(cardWidth, longestWord, Math.min(34, cardWidth * 0.3), 16);
  const gloss = fitting(cardWidth, longestGloss, Math.round(word * 0.62), 11);
  const pos = Math.max(9, Math.round(word * 0.36));
  return { word, gloss, pos, number: Math.round(word * 1.3) };
}

export function slotPositions(count: number, boardWidth: number): Point[] {
  const { width, height } = cardSize(boardWidth);
  const rows = rowsFor(count);
  const points: Point[] = [];
  rows.forEach((inRow, rowIndex) => {
    const rowWidth = inRow * width + (inRow - 1) * CARD_GAP;
    const startX = (boardWidth - rowWidth) / 2;
    for (let col = 0; col < inRow; col++) {
      points.push({
        x: startX + col * (width + CARD_GAP),
        y: rowIndex * (height + CARD_GAP),
      });
    }
  });
  return points;
}

export function boardHeight(count: number, boardWidth: number): number {
  const { height } = cardSize(boardWidth);
  const rows = rowsFor(count).length;
  return rows * height + (rows - 1) * CARD_GAP;
}
