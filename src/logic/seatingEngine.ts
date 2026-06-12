// ============================================================
// 席次生成エンジン v5.0
//
// フロー:
//   1. layoutPositions で (lx, ly) 生成
//   2. scoreSeats で doorScore/frontScore/finalScore 計算
//   3. assignRoles でスコア順マッチング
//   4. TableData に合成
// ============================================================

import {
  AppState, SeatingResult, TableData, Seat, Mode,
  MeetingCounts, BanquetCounts, HospitalityCounts,
  LayoutConfig, Direction,
} from '../types';

import {
  posRectangle, posRound, posDesk, posUShaped, posOShaped,
  posCounter, posJapanese, posTaxi, posElevator, LayoutSeat,
} from './layoutPositions';

import { calcScores, ScoredPosition } from './scoreSeats';

import {
  assignMeeting, assignBanquet, assignHospitality,
  validateCounts, Assignment,
} from './assignRoles';

import { calcTableRanks } from './rankSeats';

// ============================================================
// メイン
// ============================================================
export function generateSeating(state: AppState): SeatingResult {
  const { mode, layout, counts, venue } = state;

  // エレベーターは出入口=下固定
  const door: Direction  = layout.type === 'elevator' ? 'bottom' : venue.door;
  // 和室は床の間を正面として扱う
  const front: Direction = layout.type === 'japanese'
    ? (layout.config as any).tokonoma
    : venue.front;

  // 単一卓レイアウト
  const isSingle = ['ushaped','oshaped','counter','japanese','taxi','elevator','western'].includes(layout.type);
  const tableCount = isSingle ? 1 : Math.max(1, venue.tableCount);
  const tablesPerRow = Math.min(Math.max(1, venue.tablesPerRow), tableCount);

  // 卓順位
  const tableRanks = calcTableRanks(tableCount, tablesPerRow, door);
  const rankMap = new Map(tableRanks.map(t => [t.index, t.tableRank]));

  // 議長席の固定配置は廃止。スコア最高席に議長を配置。
  const hasCh = false; // コの字・ロの字でも固定議長席なし

  // 各卓の LayoutSeat を生成（IDに卓インデックスを付与）
  const tableRawSeats: LayoutSeat[][] = Array.from({ length: tableCount }, (_, ti) =>
    getLayoutSeats(layout, hasCh).map(s => ({ ...s, id: `t${ti}_${s.id}` }))
  );

  const totalSeats = tableRawSeats.reduce((s, t) => s + t.length, 0);
  const totalPeople = Object.values(counts).reduce((s, v) => s + (v as number), 0);

  // バリデーション
  const errors = validateCounts(mode, counts as Record<string, number>, totalSeats);
  if (errors.length > 0) {
    const tables = tableRawSeats.map((raw, ti) => {
      const scored = calcScores(raw, door, front, mode);
      return toTableData(scored, [], ti, rankMap.get(ti) ?? ti + 1, layout.type);
    });
    return { tables, totalSeats, totalPeople, errors };
  }

  // スコア計算
  const isJapanese = layout.type === 'japanese';
  const isCounter  = layout.type === 'counter';
  const isTaxiElev = layout.type === 'taxi' || layout.type === 'elevator';
  // 和室: 床の間を最優先 / カウンター: 大将(top方向)を最優先
  const scoreWeights = isJapanese || isCounter ? { door: 0.05, front: 0.95 } : undefined;
  // カウンターは大将がtop方向なので front=top 固定
  const effectiveFront: Direction = isCounter ? 'top' : front;

  const tableScored: ScoredPosition[][] = tableRawSeats.map(raw => {
    const scored = calcScores(raw, door, effectiveFront, mode, scoreWeights);
    // タクシー・エレベーターは固定順位を finalScore に直接反映
    // ID の末尾数字（1〜4）が順位 → finalScore = 100 - (順位-1)*30
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

  // 役職配置
  let assignedPerTable: Assignment[][];
  if (mode === 'meeting') {
    const mc = counts as MeetingCounts;
    if (tableCount === 1) {
      assignedPerTable = [assignMeeting(tableScored[0], mc)];
    } else {
      // 長机複数: 卓順位で補正した合成スコアで全席を一本のリストにして一括配置
      // 卓順位1=最上位卓に +1000 ボーナス、卓順位2に +666...と段階的に減衰
      const totalTables = tableCount;
      const sorted = [...tableScored.entries()]
        .sort(([ai], [bi]) => (rankMap.get(ai) ?? ai) - (rankMap.get(bi) ?? bi));
      // 卓順位ボーナス: 上位卓ほど大きい補正値を付与
      const augmented = sorted.flatMap(([origIdx, seats], sortedRank) => {
        const tableBonus = (totalTables - sortedRank) * 200; // 卓間を席スコア差より大きく
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
    // 接待モード: isChairperson=true (大将席等) を除外してから役職配置
    const hospSeats = tableScored[0].filter(s => !s.isChairperson);
    assignedPerTable = [assignHospitality(hospSeats, counts as HospitalityCounts)];
  }

  // TableData 合成 → 空席を下座へ押し出し
  const tables = tableScored.map((scored, ti) => {
    const td = toTableData(scored, assignedPerTable[ti] ?? [], ti, rankMap.get(ti) ?? ti + 1, layout.type);
    return { ...td, seats: pushEmptyToLow(td.seats) };
  });

  return { tables, totalSeats, totalPeople, errors: [] };
}

// ============================================================
// レイアウト別座標生成
// ============================================================
function getLayoutSeats(layout: LayoutConfig, hasCh: boolean): LayoutSeat[] {
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

// ============================================================
// ScoredPosition + Assignment → TableData
// ============================================================
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
      // カウンターの大将席（id に master_front を含む）は master ロール
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

// ============================================================
// 空席を下座（finalScore 低い方）へ寄せる
// 同一辺・同一 ly グループ内で有人席を上座から詰める
// ============================================================
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

    // finalScore 降順（高=上座）で並べ、有人を先に
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
