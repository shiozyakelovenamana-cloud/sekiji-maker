// ============================================================
// 卓順位計算（宴会モード用）
// 席順位計算はスコアベース(scoreSeats.ts)に移行済み
// ============================================================

import { Direction } from '../types';

export function calcTableRanks(
  tableCount: number,
  tablesPerRow: number,
  door: Direction,
): { index: number; tableRank: number }[] {
  const cols = Math.max(1, tablesPerRow);
  const rows = Math.ceil(tableCount / cols);
  const centerCol = (cols - 1) / 2;

  const entries = Array.from({ length: tableCount }, (_, i) => ({
    index: i, col: i % cols, row: Math.floor(i / cols),
  }));

  const rowDist = (row: number) => {
    switch (door) {
      case 'bottom': return rows - 1 - row;
      case 'top':    return row;
      case 'left':   return row;
      case 'right':  return rows - 1 - row;
    }
  };

  entries.sort((a, b) => {
    const dr = rowDist(b.row) - rowDist(a.row);
    if (dr !== 0) return dr;
    const dc = Math.abs(a.col - centerCol) - Math.abs(b.col - centerCol);
    if (dc !== 0) return dc;
    return a.col - b.col;
  });

  return entries.map((e, rank) => ({ index: e.index, tableRank: rank + 1 }));
}
