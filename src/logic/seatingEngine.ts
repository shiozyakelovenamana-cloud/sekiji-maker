import {
  AppState, SeatingResult, TableData, Seat, Mode,
  MeetingCounts, BanquetCounts, HospitalityCounts, CustomCounts,
  LayoutConfig, Direction,
} from '../types';

import {
  posRectangle, posRound, posDesk, posUShaped, posOShaped,
  posCounter, posJapanese, posTaxi, posElevator, LayoutSeat,
} from './layoutPositions';

import { calcScores, ScoredPosition } from './scoreSeats';

import {
  assignMeeting, assignBanquet, assignHospitality, assignCustom,
  validateCounts, validateCustom, Assignment,
} from './assignRoles';

import { calcTableRanks } from './rankSeats';

function countCustomTotal(cc: CustomCounts): number {
  return cc.base === 'hospitality'
    ? cc.clientNames.filter(n => n.trim()).length + cc.participantNames.filter(n => n.trim()).length
    : cc.names.filter(n => n.trim()).length;
}

export function generateSeating(state: AppState): SeatingResult {
  const { mode, layout, counts, venue } = state;

  const door: Direction = layout.type === 'elevator' ? 'bottom' : venue.door;
  const front: Direction = layout.type === 'japanese'
    ? (layout.config as any).tokonoma
    : venue.front;

  const isSingle = ['ushaped','oshaped','counter','japanese','taxi','elevator','western'].includes(layout.type);
  const tableCount = isSingle ? 1 : Math.max(1, venue.tableCount);
  const tablesPerRow = Math.min(Math.max(1, venue.tablesPerRow), tableCount);

  const tableRanks = calcTableRanks(tableCount, tablesPerRow, door);
  const rankMap = new Map(tableRanks.map(t => [t.index, t.tableRank]));

  const tableRawSeats: LayoutSeat[][] = Array.from({ length: tableCount }, (_, ti) =>
    getLayoutSeats(layout).map(s => ({ ...s, id: `t${ti}_${s.id}` }))
  );

  const totalSeats = tableRawSeats.reduce((s, t) => s + t.length, 0);
  const totalPeople = mode === 'custom'
    ? countCustomTotal(counts as CustomCounts)
    : Object.values(counts).filter(v => typeof v === 'number').reduce((s, v) => s + (v as number), 0);

  // バリデーション（カスタムモードは専用関数、それ以外は共通関数）
  const errors = mode === 'custom'
    ? validateCustom(counts as CustomCounts, totalSeats)
    : validateCounts(mode, counts as unknown as Record<string, number>, totalSeats);

  if (errors.length > 0) {
    const tables = tableRawSeats.map((raw, ti) => {
      const scored = calcScores(raw, door, front, mode);
      return toTableData(scored, [], ti, rankMap.get(ti) ?? ti + 1, layout.type);
    });
    return { tables, totalSeats, totalPeople, errors };
  }

  // ── スコア重み計算 ──────────────────────────────────────────
  const isJapanese = layout.type === 'japanese';
  const isCounter  = layout.type === 'counter';
  const isTaxiElev = layout.type === 'taxi' || layout.type === 'elevator';

  const cc = counts as CustomCounts;
  // 正面有無の判定: 宴会モード、またはカスタムモードのbase='banquet'のときに有効
  const hasFocalPoint =
    mode === 'banquet' ? ((counts as BanquetCounts).hasFocalPoint ?? true) :
    mode === 'custom' && cc.base === 'banquet' ? (cc.hasFocalPoint ?? true) :
    true;

  // カスタムモードのベースロジックに応じて実効モード（スコア重み用）を決定
  const effectiveModeForScore: Mode = mode === 'custom' ? cc.base : mode;

  const scoreWeights =
    isJapanese || isCounter ? { door: 0.05, front: 0.95 } :
    (effectiveModeForScore === 'banquet' && !hasFocalPoint) ? { door: 1.0, front: 0.0 } :
    undefined;

  const effectiveFront: Direction = isCounter ? 'top' : front;

  const tableScored: ScoredPosition[][] = tableRawSeats.map(raw => {
    const scored = calcScores(raw, door, effectiveFront, effectiveModeForScore, scoreWeights);
    if (isTaxiElev) {
      return scored.map(s => {
        const baseId = s.id.replace(/^t\d+_/, '');
        const rankNum = parseInt(baseId.split('_')[1] ?? '1');
        const fixedScore = 100 - (rankNum - 1) * 30;
        return { ...s, finalScore: fixedScore, doorScore: fixedScore, frontScore: fixedScore };
      });
    }
    return scored;
  });

  // ── 役職配置 ──────────────────────────────────────────────
  let assignedPerTable: Assignment[][];

  if (mode === 'custom') {
    assignedPerTable = [assignCustom(tableScored[0], cc)];
  } else if (mode === 'meeting') {
    const mc = counts as MeetingCounts;
    if (tableCount === 1) {
      assignedPerTable = [assignMeeting(tableScored[0], mc)];
    } else {
      const sorted = [...tableScored.entries()]
        .sort(([ai], [bi]) => (rankMap.get(ai) ?? ai) - (rankMap.get(bi) ?? bi));
      const augmented = sorted.flatMap(([, seats], sortedRank) => {
        const tableBonus = (tableCount - sortedRank) * 200;
        return seats.map(s => ({ ...s, finalScore: s.finalScore + tableBonus }));
      });
      const allAssigned = assignMeeting(augmented, mc);
      const aMap = new Map(allAssigned.map(a => [a.seatId, a]));
      assignedPerTable = tableScored.map(seats =>
        seats.map(s => aMap.get(s.id) ?? { seatId: s.id, role: null, roleIndex: 0, isEmpty: true, label: '' })
      );
    }
  } else if (mode === 'banquet') {
    const sorted = [...tableScored.entries()]
      .sort(([ai], [bi]) => (rankMap.get(ai) ?? ai) - (rankMap.get(bi) ?? bi));
    const assigned = assignBanquet(sorted.map(([, s]) => s), counts as BanquetCounts);
    assignedPerTable = new Array(tableCount);
    sorted.forEach(([origIdx], si) => { assignedPerTable[origIdx] = assigned[si]; });
  } else {
    // 接待モード
    const hospSeats = tableScored[0].filter(s => !s.isChairperson);
    assignedPerTable = [assignHospitality(hospSeats, counts as HospitalityCounts)];
  }

  const tables = tableScored.map((scored, ti) => {
    const td = toTableData(scored, assignedPerTable[ti] ?? [], ti, rankMap.get(ti) ?? ti + 1, layout.type);
    return { ...td, seats: pushEmptyToLow(td.seats) };
  });

  return { tables, totalSeats, totalPeople, errors: [] };
}

function getLayoutSeats(layout: LayoutConfig): LayoutSeat[] {
  switch (layout.type) {
    case 'rectangle':
    case 'western':   return posRectangle(layout.config);
    case 'round':     return posRound(layout.config);
    case 'desk':      return posDesk(layout.config);
    case 'ushaped':   return posUShaped({ ...layout.config });
    case 'oshaped':   return posOShaped(layout.config);
    case 'counter':   return posCounter(layout.config);
    case 'japanese':  return posJapanese(layout.config);
    case 'taxi':      return posTaxi();
    case 'elevator':  return posElevator();
    default:          return [];
  }
}

function toTableData(
  scored: ScoredPosition[],
  assigned: Assignment[],
  ti: number,
  tableRank: number,
  layoutType: string,
): TableData {
  const aMap = new Map(assigned.map(a => [a.seatId, a]));
  const seats: Seat[] = scored.map(s => {
    const a = aMap.get(s.id);
    if (s.isChairperson) {
      const isMaster = s.id.includes('master_front');
      return {
        id: s.id, lx: s.lx, ly: s.ly, side: s.side,
        doorScore: s.doorScore, frontScore: s.frontScore, finalScore: s.finalScore,
        isChairperson: true,
        role: isMaster ? 'master' as const : 'chairperson' as const,
        roleIndex: 1, isEmpty: false,
        label: isMaster ? '大将' : '議長',
      };
    }
    return {
      id: s.id, lx: s.lx, ly: s.ly, side: s.side,
      doorScore: s.doorScore, frontScore: s.frontScore, finalScore: s.finalScore,
      isChairperson: false,
      role: a?.role ?? null,
      roleIndex: a?.roleIndex ?? 0,
      isEmpty: a?.isEmpty ?? true,
      label: a?.label ?? '',
    };
  });
  return { tableIndex: ti, tableRank, layoutType: layoutType as any, seats };
}

function pushEmptyToLow(seats: Seat[]): Seat[] {
  const groups = new Map<string, Seat[]>();
  for (const s of seats) {
    if (s.isChairperson) continue;
    const key = `${s.side}:${Math.round(s.ly * 100)}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(s);
  }

  type Pay = Pick<Seat, 'role' | 'roleIndex' | 'isEmpty' | 'label'>;
  const overrides = new Map<string, Pay>();

  for (const group of groups.values()) {
    if (group.length < 2) continue;
    const empties = group.filter(s => s.isEmpty).length;
    if (empties === 0 || empties === group.length) continue;
    const byScore = [...group].sort((a, b) => b.finalScore - a.finalScore);
    const filled = byScore.filter(s => !s.isEmpty);
    const reordered: Pay[] = [
      ...filled.map(s => ({ role: s.role, roleIndex: s.roleIndex, isEmpty: false, label: s.label })),
      ...Array.from({ length: empties }, () => ({ role: null as Seat['role'], roleIndex: 0, isEmpty: true, label: '' })),
    ];
    byScore.forEach((s, i) => overrides.set(s.id, reordered[i]));
  }

  return seats.map(s => {
    const o = overrides.get(s.id);
    return o ? { ...s, ...o } : s;
  });
}
