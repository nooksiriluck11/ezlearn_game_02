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
