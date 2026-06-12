// ============================================================
// レイアウト別 論理座標生成 v5.0
//
// 各レイアウトの席の論理座標 (lx, ly) を返す
// 座標は後で正規化されるので絶対値は関係なく相対位置だけ正確にする
//
// 【座標系】
// lx: 左が小さい・右が大きい
// ly: 上が小さい（画面上部=正面方向）・下が大きい
// ============================================================

import { RectangleConfig, RoundConfig, DeskConfig, UShapedConfig, OShapedConfig, CounterConfig, JapaneseConfig } from '../types';

export interface LayoutSeat {
  id: string;
  lx: number;
  ly: number;
  side: 'top' | 'bottom' | 'left' | 'right' | 'round';
  isChairperson?: boolean;
}

// ============================================================
// テーブル席・洋室（長方形・両面）
// 上辺 ly=-1, 下辺 ly=+1
// ============================================================
export function posRectangle(cfg: RectangleConfig): LayoutSeat[] {
  const seats: LayoutSeat[] = [];
  for (let i = 0; i < cfg.topSeats; i++) {
    seats.push({ id: `top_${i}`, lx: i - (cfg.topSeats - 1) / 2, ly: -1, side: 'top' });
  }
  for (let i = 0; i < cfg.bottomSeats; i++) {
    seats.push({ id: `bot_${i}`, lx: i - (cfg.bottomSeats - 1) / 2, ly: 1, side: 'bottom' });
  }
  return seats;
}

// ============================================================
// 円卓
// 半径100の円上に均等配置、反時計回り
// ly が小さい = 画面上部 = 出入口反対側
// ============================================================
export function posRound(cfg: RoundConfig): LayoutSeat[] {
  const n = cfg.seatCount;
  const R = 100;
  return Array.from({ length: n }, (_, i) => {
    // 0番を12時（ly最小）から反時計回り
    const deg = -90 - (360 / n) * i;
    const rad = deg * Math.PI / 180;
    return {
      id: `r_${i}`,
      lx: R * Math.cos(rad),
      ly: R * Math.sin(rad),
      side: 'round' as const,
    };
  });
}

// ============================================================
// 長机（片面4席固定）
// horizontal: 横一列 ly=0
// vertical:   縦一列 lx=0
// ============================================================
export function posDesk(cfg: DeskConfig): LayoutSeat[] {
  if (cfg.orientation === 'horizontal') {
    // 中央席(i=1,2)を ly=-0.05 にずらして「正面に近い=上座」の判定を機能させる
    // 中央: lx=-0.5(i=1), lx=0.5(i=2) → ly=-0.05
    // 端  : lx=-1.5(i=0), lx=1.5(i=3) → ly=0
    return [0, 1, 2, 3].map(i => ({
      id: `d_${i}`,
      lx: i - 1.5,
      ly: (i === 1 || i === 2) ? -0.05 : 0,
      side: 'top' as const,
    }));
  } else {
    // 縦向き: 中央席のlxを-0.05にずらして正面に近い判定を機能させる
    return [0, 1, 2, 3].map(i => ({
      id: `d_${i}`,
      lx: (i === 1 || i === 2) ? -0.05 : 0,
      ly: i - 1.5,
      side: 'left' as const,
    }));
  }
}

// ============================================================
// コの字
// opening='bottom'（下が開口・コ字）:
//   正面辺 ly=-2（上辺）, 左右辺 ly=0〜
// opening='top'（上が開口・∪字）:
//   正面辺 ly=maxSide（下辺）, 左右辺 ly=0〜
// ============================================================
export function posUShaped(cfg: UShapedConfig): LayoutSeat[] {
  const { frontSeats, leftSeats, rightSeats, opening } = cfg;
  const seats: LayoutSeat[] = [];
  const maxSide = Math.max(leftSeats, rightSeats);
  const lx_left  = -(frontSeats - 1) / 2 - 1.5;
  const lx_right =  (frontSeats - 1) / 2 + 1.5;

  if (opening === 'bottom') {
    // 正面辺=上辺(ly=-2)、左右辺はy=0〜下方向
    for (let i = 0; i < frontSeats; i++) {
      seats.push({ id: `front_${i}`, lx: i - (frontSeats - 1) / 2, ly: -2, side: 'top' });
    }
    for (let i = 0; i < leftSeats; i++) {
      seats.push({ id: `left_${i}`, lx: lx_left, ly: i, side: 'left' });
    }
    for (let i = 0; i < rightSeats; i++) {
      seats.push({ id: `right_${i}`, lx: lx_right, ly: i, side: 'right' });
    }
  } else {
    // opening='top': 正面辺=下辺(ly=maxSide+1)、左右辺はy=0〜上方向
    for (let i = 0; i < frontSeats; i++) {
      seats.push({ id: `front_${i}`, lx: i - (frontSeats - 1) / 2, ly: maxSide + 1, side: 'bottom' });
    }
    for (let i = 0; i < leftSeats; i++) {
      seats.push({ id: `left_${i}`, lx: lx_left, ly: i, side: 'left' });
    }
    for (let i = 0; i < rightSeats; i++) {
      seats.push({ id: `right_${i}`, lx: lx_right, ly: i, side: 'right' });
    }
  }
  return seats;
}

// ============================================================
// ロの字
// 正面辺（上辺）、左辺、右辺、出入口辺（下辺）
// ============================================================
export function posOShaped(cfg: OShapedConfig): LayoutSeat[] {
  const { frontSeats, leftSeats, rightSeats, doorSeats } = cfg;
  const maxSide = Math.max(leftSeats, rightSeats);
  const seats: LayoutSeat[] = [];

  for (let i = 0; i < frontSeats; i++) {
    seats.push({ id: `front_${i}`, lx: i - (frontSeats - 1) / 2, ly: -1, side: 'top' });
  }
  for (let i = 0; i < leftSeats; i++) {
    seats.push({ id: `left_${i}`, lx: -(frontSeats - 1) / 2 - 1.5, ly: i, side: 'left' });
  }
  for (let i = 0; i < rightSeats; i++) {
    seats.push({ id: `right_${i}`, lx: (frontSeats - 1) / 2 + 1.5, ly: i, side: 'right' });
  }
  for (let i = 0; i < doorSeats; i++) {
    seats.push({ id: `door_${i}`, lx: i - (doorSeats - 1) / 2, ly: maxSide, side: 'bottom' });
  }
  return seats;
}

// ============================================================
// カウンター（大将あり固定）
//
// 配置:
//   大将正面席 (top辺, ly=-1, lx=0): 1席
//   客席 (bottom辺, ly=0): seatCount席 横一列
//
// 上座判定: スコアベース（出入口・正面からの距離）
// 客席は横一列なのでlx方向のスコア差で奥/入口が決まる
// ============================================================
export function posCounter(cfg: CounterConfig): LayoutSeat[] {
  const { seatCount } = cfg;
  // 大将正面席（中央上）- isChairperson=true で役職配置から除外
  const seats: LayoutSeat[] = [
    { id: 'master_front', lx: 0, ly: -1, side: 'top', isChairperson: true }
  ];
  // 客席（横一列）
  // 大将(lx=0,ly=-1)から各客席までの距離で上座が決まる
  // 中央(lx=0)が最も近く上座、端ほど遠くなる
  // ly を |lx| に応じてわずかにずらすことで距離スコアに差をつける
  for (let i = 0; i < seatCount; i++) {
    const lx = i - (seatCount - 1) / 2;
    // 中央から離れるほど ly を大きく（大将から遠くなる）
    const lyOffset = Math.abs(lx) * 0.15;
    seats.push({
      id: `c_${i}`,
      lx,
      ly: lyOffset,
      side: 'bottom',
    });
  }
  return seats;
}

// ============================================================
// 和室（床の間が正面）
// 床の間の方向を front として rectangle/round を配置
// ============================================================
export function posJapanese(cfg: JapaneseConfig): LayoutSeat[] {
  if (cfg.innerLayout === 'rectangle' && cfg.rectangleConfig) {
    return posRectangle(cfg.rectangleConfig);
  }
  if (cfg.innerLayout === 'round' && cfg.roundConfig) {
    return posRound(cfg.roundConfig);
  }
  return [];
}

// ============================================================
// タクシー（固定座標・固定順位）
// 日本は右ハンドル
// 1位: 後部左（運転席後ろ）  lx=-1
// 2位: 後部右（助手席後ろ）  lx=+1
// 3位: 後部中央              lx=0
// 4位: 助手席（前右）        lx=+1, ly=-1
// ============================================================
export function posTaxi(): LayoutSeat[] {
  // 日本は右ハンドル: 運転席=右前、助手席=左前
  // 1位: 運転席後ろ（右後部）
  // 2位: 助手席後ろ（左後部）
  // 3位: 助手席（左前）← 3名以下はここまで
  // 4位: 後部中央     ← 4名のときのみ使用
  // ※ スコアは seatingEngine で id末尾番号から固定付与: 1→100, 2→70, 3→40, 4→10
  return [
    { id: 'taxi_1', lx:  1, ly:  1, side: 'bottom' }, // 1位: 運転席後ろ（右後部）
    { id: 'taxi_2', lx: -1, ly:  1, side: 'bottom' }, // 2位: 助手席後ろ（左後部）
    { id: 'taxi_3', lx: -1, ly: -1, side: 'top'    }, // 3位: 助手席（左前）
    { id: 'taxi_4', lx:  0, ly:  1, side: 'bottom' }, // 4位: 後部中央（4名時のみ）
  ];
}

// ============================================================
// エレベーター（固定座標・出入口=下固定）
// ============================================================
export function posElevator(): LayoutSeat[] {
  return [
    { id: 'elev_1', lx: -1, ly: -1, side: 'top'    }, // 左奥
    { id: 'elev_2', lx:  1, ly: -1, side: 'top'    }, // 右奥
    { id: 'elev_3', lx: -1, ly:  1, side: 'bottom' }, // 左手前
    { id: 'elev_4', lx:  1, ly:  1, side: 'bottom' }, // 右手前（操作盤）
  ];
}
