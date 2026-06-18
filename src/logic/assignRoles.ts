// ============================================================
// 役職配置 v5.0 - スコアベースマッチング
//
// アルゴリズム:
//   1. 席を finalScore 降順（高=上座）に並べる
//   2. 人を ROLE_RANK 降順に並べる
//   3. 順番に割り当て
//
// 特殊ルール:
//   - 議長席（isChairperson=true）は常に chairperson に固定
//   - 幹事（宴会）は finalScore 最低席群に強制配置
//   - 接待: 同一辺に同組織（客/接待側）をまとめる
// ============================================================

import { Role, ROLE_RANK, ROLE_LABEL, Mode, MeetingCounts, BanquetCounts, HospitalityCounts, CustomCounts } from '../types';
import { ScoredPosition } from './scoreSeats';

export interface Assignment {
  seatId: string;
  role: Role | null;
  roleIndex: number;
  isEmpty: boolean;
  label: string;
}

// 役職リストを展開（chairperson×1, senior×3 → [...] の形に）
function expandRoles(counts: Record<string, number>, order: string[]): string[] {
  const result: string[] = [];
  for (const role of order) {
    const n = counts[role] ?? 0;
    for (let i = 0; i < n; i++) result.push(role);
  }
  return result;
}

// finalScore 降順
function byScoreDesc(a: ScoredPosition, b: ScoredPosition) { return b.finalScore - a.finalScore; }
// finalScore 昇順（下座から）
function byScoreAsc(a: ScoredPosition, b: ScoredPosition)  { return a.finalScore - b.finalScore; }

function makeLabel(role: string, idx: number): string {
  return role === 'chairperson' ? '議長' : `${ROLE_LABEL[role] ?? '?'}${idx}`;
}

// ============================================================
// 会議モード
//
// 配置ルール（スコアベース）:
//   全席を finalScore 降順に並べ、役職ランク順に割り当て
//   議長(100) → 最高スコア席
//   議事録係・タイムキーパー → 議長の次に高いスコアの席
//     ただし議長と同じ辺を優先（横並びにする）
//   上席 → 残り上位席
//   一般 → 残り席
// ============================================================
export function assignMeeting(seats: ScoredPosition[], counts: MeetingCounts): Assignment[] {
  const placed = new Map<string, { role: string; idx: number }>();
  const counters: Record<string, number> = {};

  function place(seat: ScoredPosition, role: string) {
    counters[role] = (counters[role] ?? 0) + 1;
    placed.set(seat.id, { role, idx: counters[role] });
  }

  // 全席をスコア降順に並べる
  const sorted = [...seats].sort(byScoreDesc);

  // 1. 議長 → 最高スコア席
  let chairSeat: ScoredPosition | null = null;
  if (counts.chairperson > 0) {
    chairSeat = sorted[0];
    place(chairSeat, 'chairperson');
  }

  // 2. 議事録係・タイムキーパー → 議長と同じ辺を優先、次いでスコア降順
  const remaining1 = sorted.filter(s => !placed.has(s.id));

  // 議長がいる場合: 同じ辺の席をスコア降順で先に並べる
  let auxPool: ScoredPosition[];
  if (chairSeat) {
    const sameSide  = remaining1.filter(s => s.side === chairSeat!.side);
    const otherSide = remaining1.filter(s => s.side !== chairSeat!.side);
    auxPool = [...sameSide, ...otherSide]; // 既にスコア降順
  } else {
    auxPool = remaining1;
  }

  for (let i = 0; i < counts.secretary; i++) {
    const s = auxPool.find(s => !placed.has(s.id));
    if (s) place(s, 'secretary');
  }
  for (let i = 0; i < counts.timekeeper; i++) {
    const s = auxPool.find(s => !placed.has(s.id));
    if (s) place(s, 'timekeeper');
  }

  // 3. 上席・一般 → 残り席をスコア降順
  const remaining2 = sorted.filter(s => !placed.has(s.id));
  let ri = 0;
  for (let i = 0; i < counts.senior;  i++) { if (ri < remaining2.length) place(remaining2[ri++], 'senior'); }
  for (let i = 0; i < counts.general; i++) { if (ri < remaining2.length) place(remaining2[ri++], 'general'); }

  return seats.map(s => {
    const p = placed.get(s.id);
    if (p) return { seatId: s.id, role: p.role as Role, roleIndex: p.idx, isEmpty: false, label: makeLabel(p.role, p.idx) };
    return { seatId: s.id, role: null, roleIndex: 0, isEmpty: true, label: '' };
  });
}

// ============================================================
// 宴会モード（ラウンドロビン）
// 幹事 = finalScore 最低席に強制
// ============================================================
export function assignBanquet(
  tableSeats: ScoredPosition[][], // 卓順位順（0=最上座卓）
  counts: BanquetCounts,
): Assignment[][] {
  const tc = tableSeats.length;
  const placed: Map<string, { role: string; idx: number }>[] = tableSeats.map(() => new Map());

  // 各卓の幹事席を確保（最低スコア席）
  const orgTotal = counts.organizer;
  const orgPerTable: number[] = Array(tc).fill(0);
  // 卓順位の低い卓から幹事を割り当てる
  let rem = orgTotal;
  for (let t = tc - 1; t >= 0 && rem > 0; t--) { orgPerTable[t]++; rem--; }

  const orgSeatIds: Set<string>[] = tableSeats.map((seats, t) => {
    const sorted = [...seats].sort(byScoreAsc);
    return new Set(sorted.slice(0, orgPerTable[t]).map(s => s.id));
  });

  // 利用可能席（幹事席除く）、スコア降順
  const available: ScoredPosition[][] = tableSeats.map((seats, t) =>
    [...seats].filter(s => !orgSeatIds[t].has(s.id)).sort(byScoreDesc)
  );
  const ptrs = Array(tc).fill(0);

  function next(t: number): ScoredPosition | null {
    while (ptrs[t] < available[t].length) {
      const s = available[t][ptrs[t]++];
      if (!placed[t].has(s.id)) return s;
    }
    return null;
  }

  // ラウンドロビン配置
  const rrOrder = ['guest_of_honor', 'senior', 'entertainer', 'newcomer', 'general'];
  const counters: Record<string, number> = {};

  for (const role of rrOrder) {
    const n = (counts as any)[role] ?? 0;
    let tIdx = 0;
    for (let i = 0; i < n; i++) {
      for (let a = 0; a < tc; a++) {
        const t = (tIdx + a) % tc;
        const s = next(t);
        if (s) {
          counters[role] = (counters[role] ?? 0) + 1;
          placed[t].set(s.id, { role, idx: counters[role] });
          tIdx = (t + 1) % tc;
          break;
        }
      }
    }
  }

  // 幹事配置
  const orgCounters: Record<string, number> = {};
  for (let t = tc - 1; t >= 0; t--) {
    const orgSeats = [...tableSeats[t]].filter(s => orgSeatIds[t].has(s.id)).sort(byScoreAsc);
    for (const s of orgSeats) {
      orgCounters['organizer'] = (orgCounters['organizer'] ?? 0) + 1;
      placed[t].set(s.id, { role: 'organizer', idx: orgCounters['organizer'] });
    }
  }

  return tableSeats.map((seats, t) =>
    seats.map(s => {
      const p = placed[t].get(s.id);
      if (p) return { seatId: s.id, role: p.role as Role, roleIndex: p.idx, isEmpty: false, label: makeLabel(p.role, p.idx) };
      return { seatId: s.id, role: null, roleIndex: 0, isEmpty: true, label: '' };
    })
  );
}

// ============================================================
// 接待モード
// 向かい合う辺がある場合:
//   finalScore最高スコアの辺グループ = 来客（上座辺）
//   もう一方の辺グループ = 上席+一般（下座辺）
// それ以外（カウンター横一列・円卓など）: finalScore降順に client→senior→general
// タクシー・エレベーター: 固定スコア順（全役職をスコア降順で詰める）
// ============================================================
export function assignHospitality(seats: ScoredPosition[], counts: HospitalityCounts): Assignment[] {

  // ── タクシー・エレベーター専用ロジック ──────────────────────
  // IDに taxi_ / elev_ が含まれる席はfacing判定をスキップし
  // finalScore降順に役職をそのまま詰める（固定順位レイアウト）
  const baseIds = seats.map(s => s.id.replace(/^t\d+_/, ''));
  const isFixedLayout = baseIds.length > 0 &&
    baseIds.every(id => id.startsWith('taxi_') || id.startsWith('elev_'));

  if (isFixedLayout) {
    const total = counts.client + counts.senior + counts.general;
    const isTaxi = baseIds.every(id => id.startsWith('taxi_'));

    // タクシー3名以下: 後部中央(taxi_4)を除外し助手席(taxi_3)を3番目に使う
    const availableSeats = (isTaxi && total <= 3)
      ? [...seats].filter(s => !s.id.endsWith('taxi_4'))
      : seats;

    const ordered = [...availableSeats].sort(byScoreDesc);
    const queue: string[] = [
      ...Array(counts.client).fill('client'),
      ...Array(counts.senior).fill('senior'),
      ...Array(counts.general).fill('general'),
    ];
    const fp = new Map<string, { role: string; idx: number }>();
    const fc: Record<string, number> = {};
    ordered.forEach((s, i) => {
      if (i >= queue.length) return;
      const role = queue[i];
      fc[role] = (fc[role] ?? 0) + 1;
      fp.set(s.id, { role, idx: fc[role] });
    });
    return seats.map(s => {
      const p = fp.get(s.id);
      if (p) return { seatId: s.id, role: p.role as Role, roleIndex: p.idx, isEmpty: false, label: makeLabel(p.role, p.idx) };
      return { seatId: s.id, role: null, roleIndex: 0, isEmpty: true, label: '' };
    });
  }
  // ─────────────────────────────────────────────────────────────

  const placed = new Map<string, { role: string; idx: number }>();
  const counters: Record<string, number> = {};

  // 辺ごとにグループ化
  const sideMap = new Map<string, ScoredPosition[]>();
  for (const s of seats) {
    if (!sideMap.has(s.side)) sideMap.set(s.side, []);
    sideMap.get(s.side)!.push(s);
  }

  // 向かい合うペアを検出
  const facingPairs: [string, string][] = [['top', 'bottom'], ['left', 'right']];
  let kamiGroup: ScoredPosition[] | null = null;
  let shimoGroup: ScoredPosition[] | null = null;

  for (const [a, b] of facingPairs) {
    if (sideMap.has(a) && sideMap.has(b)) {
      const gA = sideMap.get(a)!;
      const gB = sideMap.get(b)!;
      const avgA = gA.reduce((s, x) => s + x.finalScore, 0) / gA.length;
      const avgB = gB.reduce((s, x) => s + x.finalScore, 0) / gB.length;
      // finalScore高い方=上座=来客辺
      [kamiGroup, shimoGroup] = avgA >= avgB ? [gA, gB] : [gB, gA];
      break;
    }
  }

  if (kamiGroup && shimoGroup) {
    // 上座辺（高スコア辺）に来客をfinalScore降順で配置
    const kamiSorted = [...kamiGroup].sort(byScoreDesc);
    for (const s of kamiSorted) {
      if ((counters['client'] ?? 0) >= counts.client) break;
      counters['client'] = (counters['client'] ?? 0) + 1;
      placed.set(s.id, { role: 'client', idx: counters['client'] });
    }

    // 下座辺（低スコア辺）に上席→一般をfinalScore降順で配置
    const shimoSorted = [...shimoGroup].sort(byScoreDesc);
    const shimoRoles: string[] = [
      ...Array(counts.senior).fill('senior'),
      ...Array(counts.general).fill('general'),
    ];
    shimoSorted.forEach((s, i) => {
      if (i < shimoRoles.length) {
        const role = shimoRoles[i];
        counters[role] = (counters[role] ?? 0) + 1;
        placed.set(s.id, { role, idx: counters[role] });
      }
    });

    // 来客が上座辺に収まらない場合は下座辺の残席に
    for (const s of shimoSorted) {
      if ((counters['client'] ?? 0) >= counts.client) break;
      if (!placed.has(s.id)) {
        counters['client'] = (counters['client'] ?? 0) + 1;
        placed.set(s.id, { role: 'client', idx: counters['client'] });
      }
    }
  } else {
    // 1辺・円卓: finalScore降順に client→senior→general
    const ordered = [...seats].sort(byScoreDesc);
    const queue = [
      ...Array(counts.client).fill('client'),
      ...Array(counts.senior).fill('senior'),
      ...Array(counts.general).fill('general'),
    ];
    ordered.forEach((s, i) => {
      if (i < queue.length) {
        const role = queue[i];
        counters[role] = (counters[role] ?? 0) + 1;
        placed.set(s.id, { role, idx: counters[role] });
      }
    });
  }

  return seats.map(s => {
    const p = placed.get(s.id);
    if (p) return { seatId: s.id, role: p.role as Role, roleIndex: p.idx, isEmpty: false, label: makeLabel(p.role, p.idx) };
    return { seatId: s.id, role: null, roleIndex: 0, isEmpty: true, label: '' };
  });
}

// ============================================================
// カスタムモード
// base に応じて配置ロジックを切り替える:
//   meeting / banquet → 名前を finalScore 降順にそのまま当てはめる
//   hospitality       → 来客名を上座（向かい合う高スコア辺 or 1辺なら最上位）、
//                        参加者名をランク順に残り席へ
// ============================================================
export function assignCustom(seats: ScoredPosition[], counts: CustomCounts): Assignment[] {
  const usable = seats.filter(s => !s.isChairperson);

  if (counts.base === 'hospitality') {
    return assignCustomHospitality(seats, usable, counts);
  }

  // meeting / banquet: 偉い人順の名前リストをスコア降順の席にそのまま当てはめる
  const ordered = [...usable].sort(byScoreDesc);
  const names = counts.names.filter(n => n.trim());
  const placed = new Map<string, string>();
  ordered.forEach((s, i) => {
    if (i < names.length) placed.set(s.id, names[i]);
  });

  return seats.map(s => {
    const name = placed.get(s.id);
    if (name) return { seatId: s.id, role: 'general' as Role, roleIndex: 1, isEmpty: false, label: name };
    return { seatId: s.id, role: null, roleIndex: 0, isEmpty: true, label: '' };
  });
}

function assignCustomHospitality(
  allSeats: ScoredPosition[],
  usable: ScoredPosition[],
  counts: CustomCounts,
): Assignment[] {
  const clientNames = counts.clientNames.filter(n => n.trim());
  const participantNames = counts.participantNames.filter(n => n.trim());
  const placed = new Map<string, string>();

  // 辺ごとにグループ化して向かい合いを検出（assignHospitalityと同じロジック）
  const sideMap = new Map<string, ScoredPosition[]>();
  for (const s of usable) {
    if (!sideMap.has(s.side)) sideMap.set(s.side, []);
    sideMap.get(s.side)!.push(s);
  }
  const facingPairs: [string, string][] = [['top', 'bottom'], ['left', 'right']];
  let kamiGroup: ScoredPosition[] | null = null;
  let shimoGroup: ScoredPosition[] | null = null;
  for (const [a, b] of facingPairs) {
    if (sideMap.has(a) && sideMap.has(b)) {
      const gA = sideMap.get(a)!;
      const gB = sideMap.get(b)!;
      const avgA = gA.reduce((s, x) => s + x.finalScore, 0) / gA.length;
      const avgB = gB.reduce((s, x) => s + x.finalScore, 0) / gB.length;
      [kamiGroup, shimoGroup] = avgA >= avgB ? [gA, gB] : [gB, gA];
      break;
    }
  }

  if (kamiGroup && shimoGroup) {
    // 上座辺に来客、下座辺に参加者
    const kamiSorted = [...kamiGroup].sort(byScoreDesc);
    kamiSorted.forEach((s, i) => { if (i < clientNames.length) placed.set(s.id, clientNames[i]); });

    const shimoSorted = [...shimoGroup].sort(byScoreDesc);
    shimoSorted.forEach((s, i) => { if (i < participantNames.length) placed.set(s.id, participantNames[i]); });

    // 来客が上座辺に収まらない場合は下座辺の残席へ
    let extraIdx = clientNames.length - kamiSorted.length;
    if (extraIdx > 0) {
      const remainingShimo = shimoSorted.filter(s => !placed.has(s.id));
      remainingShimo.forEach((s, i) => {
        if (i < extraIdx) placed.set(s.id, clientNames[kamiSorted.length + i]);
      });
    }
  } else {
    // 1辺・円卓: 来客を最上位スコア席から、続けて参加者
    const ordered = [...usable].sort(byScoreDesc);
    const queue = [...clientNames, ...participantNames];
    ordered.forEach((s, i) => { if (i < queue.length) placed.set(s.id, queue[i]); });
  }

  return allSeats.map(s => {
    const name = placed.get(s.id);
    if (name) {
      const isClient = clientNames.includes(name);
      return { seatId: s.id, role: (isClient ? 'client' : 'general') as Role, roleIndex: 1, isEmpty: false, label: name };
    }
    return { seatId: s.id, role: null, roleIndex: 0, isEmpty: true, label: '' };
  });
}

// ============================================================
// バリデーション
// ============================================================
export function validateCounts(mode: Mode, counts: Record<string, number>, totalSeats: number): string[] {
  const errors: string[] = [];
  const total = Object.values(counts).reduce((s, v) => s + v, 0);
  if (total === 0) { errors.push('参加人数を入力してください。'); return errors; }
  if (total > totalSeats) errors.push(`参加人数 ${total}名 が総席数 ${totalSeats}席 を超えています。`);
  if (mode === 'hospitality' && total > 10) errors.push(`接待モードの上限は10名です（現在 ${total}名）。`);
  if (mode === 'meeting' && (counts['chairperson'] ?? 0) > 1) errors.push('議長は最大1名です。');
  return errors;
}

// カスタムモード専用バリデーション（namesは文字列配列なのでvalidateCountsとは別関数）
export function validateCustom(counts: CustomCounts, totalSeats: number): string[] {
  const errors: string[] = [];
  const total = counts.base === 'hospitality'
    ? counts.clientNames.filter(n => n.trim()).length + counts.participantNames.filter(n => n.trim()).length
    : counts.names.filter(n => n.trim()).length;

  if (total === 0) { errors.push('参加者名を入力してください。'); return errors; }
  if (total > totalSeats) errors.push(`参加人数 ${total}名 が総席数 ${totalSeats}席 を超えています。`);
  return errors;
}
