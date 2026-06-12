// ============================================================
// 席スコア計算 v5.1 - バグ修正版
//
// 【重要な区別】
// doorScore  : 出入口から「遠い」ほど高スコア（上座）
// frontScore : 正面に「近い」ほど高スコア（上座）
//
// finalScore = w_door × doorScore + w_front × frontScore
// 高いほど上座
// ============================================================

import { Direction, Seat, Mode, SCORE_WEIGHTS } from '../types';

// 方向 → その方向の「端点」座標（正規化済み [0,1] 空間）
function dirToPoint(dir: Direction): { px: number; py: number } {
  switch (dir) {
    case 'top':    return { px: 0.5, py: 0 };
    case 'bottom': return { px: 0.5, py: 1 };
    case 'left':   return { px: 0,   py: 0.5 };
    case 'right':  return { px: 1,   py: 0.5 };
  }
}

// 2点間のユークリッド距離（正規化済み座標）
function dist(ax: number, ay: number, bx: number, by: number): number {
  return Math.sqrt((ax - bx) ** 2 + (ay - by) ** 2);
}

// 値の配列を 0〜100 にスケール（最小→0、最大→100）
function scale0to100(vals: number[]): number[] {
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  const range = max - min;
  if (range < 1e-9) return vals.map(() => 50);
  return vals.map(v => ((v - min) / range) * 100);
}

// 正規化
function normalize(vals: number[]): number[] {
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  const range = max - min;
  if (range === 0) return vals.map(() => 0.5);
  return vals.map(v => (v - min) / range);
}

export interface ScoredPosition {
  id: string;
  lx: number;
  ly: number;
  side: Seat['side'];
  isChairperson: boolean;
  doorScore: number;   // 0〜100、高い=上座（出入口から遠い）
  frontScore: number;  // 0〜100、高い=上座（正面に近い）
  finalScore: number;  // 0〜100、高い=上座
}

export function calcScores(
  positions: Array<{ id: string; lx: number; ly: number; side: Seat['side']; isChairperson?: boolean }>,
  door: Direction,
  front: Direction,
  mode: Mode,
  overrideWeights?: { door: number; front: number },
): ScoredPosition[] {
  if (positions.length === 0) return [];

  const weights = overrideWeights ?? SCORE_WEIGHTS[mode];
  const nxs = normalize(positions.map(p => p.lx));
  const nys = normalize(positions.map(p => p.ly));

  const dp = dirToPoint(door);
  const fp = dirToPoint(front);

  // doorScore: 出入口から遠いほど高い（遠い=上座）
  const rawDoor = positions.map((_, i) => dist(nxs[i], nys[i], dp.px, dp.py));
  const doorScores = scale0to100(rawDoor); // 遠いほど大きい → そのままスケール

  // frontScore: 正面に近いほど高い（近い=上座）
  // dist が小さいほど高スコアにしたい → 反転して使う
  const rawFront = positions.map((_, i) => dist(nxs[i], nys[i], fp.px, fp.py));
  const rawFrontInverted = rawFront.map(d => {
    const maxPossible = Math.SQRT2; // 正規化空間での最大距離
    return maxPossible - d; // 近いほど大きい
  });
  const frontScores = scale0to100(rawFrontInverted);

  // 同一辺・同一y座標グループ内での中央ボーナス（最大+10）
  const centerBonus = calcCenterBonus(positions);

  return positions.map((p, i) => ({
    id: p.id,
    lx: p.lx,
    ly: p.ly,
    side: p.side,
    isChairperson: p.isChairperson ?? false,
    doorScore:  Math.round(doorScores[i]),
    frontScore: Math.round(frontScores[i]),
    finalScore: Math.round(
      weights.door * doorScores[i] +
      weights.front * frontScores[i] +
      centerBonus[i]
    ),
  }));
}

// 同一辺・同一y座標グループ内の中央席にボーナス付与（最大+10）
function calcCenterBonus(
  positions: Array<{ lx: number; ly: number; side: string }>
): number[] {
  const bonus = new Array(positions.length).fill(0);

  const groups = new Map<string, number[]>();
  positions.forEach((p, i) => {
    const key = `${p.side}:${Math.round(p.ly * 10)}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(i);
  });

  for (const idxs of groups.values()) {
    if (idxs.length < 2) continue;
    const lxVals = idxs.map(i => positions[i].lx);
    const minLx = Math.min(...lxVals);
    const maxLx = Math.max(...lxVals);
    const range = maxLx - minLx;
    if (range < 1e-9) continue;
    const midLx = (minLx + maxLx) / 2;
    idxs.forEach(i => {
      const distFromCenter = Math.abs(positions[i].lx - midLx) / (range / 2);
      bonus[i] = Math.round((1 - distFromCenter) * 10);
    });
  }
  return bonus;
}
