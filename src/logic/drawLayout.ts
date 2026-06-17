// ============================================================
// 描画座標計算 v5.0
// Seat の (lx, ly) → SVGピクセル座標
// ============================================================

import { Seat, LayoutType } from '../types';

export interface DrawSeat {
  id: string;
  svgX: number;
  svgY: number;
  seatW: number;
  seatH: number;
  seat: Seat;
}

export interface DrawTable {
  tableW: number;
  tableH: number;
  seats: DrawSeat[];
  tableRects: Array<{ x: number; y: number; w: number; h: number; isRound?: boolean }>;
}

const SW = 54;
const SH = 34;
const PAD = 30;
const SX = 70; // x方向スケール
const SY = 58; // y方向スケール

export function calcDrawTable(seats: Seat[], layoutType: LayoutType): DrawTable {
  if (seats.length === 0) return { tableW: 120, tableH: 80, seats: [], tableRects: [] };
  if (layoutType === 'round') return calcRound(seats);
  if (layoutType === 'taxi')  return calcTaxi(seats);
  if (layoutType === 'elevator') return calcElevator(seats);
  return calcGeneric(seats);
}

// 汎用（論理座標 → SVGピクセル）
function calcGeneric(seats: Seat[]): DrawTable {
  const lxs = seats.map(s => s.lx);
  const lys = seats.map(s => s.ly);
  const minLx = Math.min(...lxs);
  const minLy = Math.min(...lys);

  const drawSeats: DrawSeat[] = seats.map(s => ({
    id: s.id,
    svgX: PAD + SW / 2 + (s.lx - minLx) * SX,
    svgY: PAD + SH / 2 + (s.ly - minLy) * SY,
    seatW: SW, seatH: SH, seat: s,
  }));

  const xs = drawSeats.map(d => d.svgX);
  const ys = drawSeats.map(d => d.svgY);
  const tableW = Math.max(...xs) + SW / 2 + PAD;
  const tableH = Math.max(...ys) + SH / 2 + PAD;

  const tableRects = calcRects(drawSeats, seats);
  return { tableW, tableH, seats: drawSeats, tableRects };
}

function calcRects(drawSeats: DrawSeat[], seats: Seat[]) {
  const rects: Array<{ x: number; y: number; w: number; h: number }> = [];
  const top   = drawSeats.filter(d => d.seat.side === 'top');
  const bot   = drawSeats.filter(d => d.seat.side === 'bottom');
  const left  = drawSeats.filter(d => d.seat.side === 'left');
  const right = drawSeats.filter(d => d.seat.side === 'right');

  if (top.length > 0 && bot.length > 0 && !left.length && !right.length) {
    // テーブル席（上下）
    const ty = Math.min(...top.map(d => d.svgY)) + SH / 2;
    const by = Math.min(...bot.map(d => d.svgY)) - SH / 2;
    const lx = Math.min(...[...top, ...bot].map(d => d.svgX)) - SW / 2;
    const rx = Math.max(...[...top, ...bot].map(d => d.svgX)) + SW / 2;
    if (by > ty) rects.push({ x: lx, y: ty, w: rx - lx, h: by - ty });
  } else if (top.length > 0 && !bot.length && !left.length && !right.length) {
    // 長机横（片面・上）/ カウンター上辺
    const lx = Math.min(...top.map(d => d.svgX)) - SW / 2;
    const rx = Math.max(...top.map(d => d.svgX)) + SW / 2;
    const ty = Math.min(...top.map(d => d.svgY)) + SH / 2;
    rects.push({ x: lx, y: ty, w: rx - lx, h: 10 });
  } else if (bot.length > 0 && !top.length && !left.length && !right.length) {
    // カウンター横一列（bottom）/ 長机下辺
    const lx = Math.min(...bot.map(d => d.svgX)) - SW / 2;
    const rx = Math.max(...bot.map(d => d.svgX)) + SW / 2;
    const by = Math.min(...bot.map(d => d.svgY)) - SH / 2;
    rects.push({ x: lx, y: by - 10, w: rx - lx, h: 10 }); // カウンター板は席の上側
  } else if (left.length > 0 && !top.length && !bot.length && !right.length) {
    // 長机縦（片面・左）/ カウンター縦
    const lx = Math.min(...left.map(d => d.svgX)) + SW / 2;
    const ty = Math.min(...left.map(d => d.svgY)) - SH / 2;
    const by = Math.max(...left.map(d => d.svgY)) + SH / 2;
    rects.push({ x: lx, y: ty, w: 10, h: by - ty });
  } else if ((left.length > 0 || right.length > 0) && (top.length > 0 || bot.length > 0)) {
    // コの字・ロの字（内部空間）
    const allX = drawSeats.map(d => d.svgX);
    const allY = drawSeats.map(d => d.svgY);
    const il = (left.length  ? Math.max(...left.map(d => d.svgX))  + SW / 2 : Math.min(...allX) - SW / 2);
    const ir = (right.length ? Math.min(...right.map(d => d.svgX)) - SW / 2 : Math.max(...allX) + SW / 2);
    const it = (top.length   ? Math.max(...top.map(d => d.svgY))   + SH / 2 : Math.min(...allY) - SH / 2);
    const ib = (bot.length   ? Math.min(...bot.map(d => d.svgY))   - SH / 2 : Math.max(...allY) + SH / 2);
    if (ir > il && ib > it) rects.push({ x: il, y: it, w: ir - il, h: ib - it });
  }
  return rects;
}

// 円卓
function calcRound(seats: Seat[]): DrawTable {
  const R = 90;
  const SIZE = (R + SW / 2 + PAD) * 2;
  const cx = SIZE / 2, cy = SIZE / 2;
  const drawSeats: DrawSeat[] = seats.map(s => ({
    id: s.id,
    svgX: cx + s.lx * (R / 100),
    svgY: cy + s.ly * (R / 100),
    seatW: SW, seatH: SH, seat: s,
  }));
  return {
    tableW: SIZE, tableH: SIZE, seats: drawSeats,
    tableRects: [{ x: cx - R * 0.65, y: cy - R * 0.65, w: R * 1.3, h: R * 1.3, isRound: true }],
  };
}

// タクシー
function calcTaxi(seats: Seat[]): DrawTable {
  const W = 260, H = 300, cx = W / 2;
  // 右ハンドル: 運転席=右前、助手席=左前
  // layoutPositions.ts の順位と一致させる:
  // taxi_1: 右後部(運転席後ろ), taxi_2: 左後部, taxi_3: 助手席(左前), taxi_4: 後部中央
  // 後部3席（taxi_1, taxi_2, taxi_4）が横一列に並ぶため、席幅(54px)以上の間隔を確保
  const posMap: Record<string, { x: number; y: number }> = {
    taxi_1: { x: cx + 62, y: 185 }, // 1位: 右後部（運転席後ろ）
    taxi_2: { x: cx - 62, y: 185 }, // 2位: 左後部（助手席後ろ）
    taxi_3: { x: cx - 62, y:  95 }, // 3位: 助手席（左前）
    taxi_4: { x: cx,      y: 185 }, // 4位: 後部中央（4名時のみ）
  };
  const drawSeats = seats.map(s => {
    const base = s.id.replace(/^t\d+_/, '');
    const pos = posMap[base] ?? { x: cx, y: 150 };
    return { id: s.id, svgX: pos.x, svgY: pos.y, seatW: SW, seatH: SH, seat: s };
  });
  return { tableW: W, tableH: H, seats: drawSeats, tableRects: [] };
}

// エレベーター
function calcElevator(seats: Seat[]): DrawTable {
  const W = 200, H = 240, cx = W / 2;
  const posMap: Record<string, { x: number; y: number }> = {
    elev_1: { x: cx - 42, y:  70 },
    elev_2: { x: cx + 42, y:  70 },
    elev_3: { x: cx - 42, y: 165 },
    elev_4: { x: cx + 42, y: 165 },
  };
  const drawSeats = seats.map(s => {
    const base = s.id.replace(/^t\d+_/, '');
    const pos = posMap[base] ?? { x: cx, y: 120 };
    return { id: s.id, svgX: pos.x, svgY: pos.y, seatW: SW, seatH: SH, seat: s };
  });
  return { tableW: W, tableH: H, seats: drawSeats, tableRects: [] };
}
