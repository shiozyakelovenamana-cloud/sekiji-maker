// ============================================================
// 席次メーカー 型定義 v5.0
// スコアベース設計
// ============================================================

export type Mode = 'meeting' | 'banquet' | 'hospitality' | 'custom';

// 出入口・正面の方向（画面基準）
// 正面は画面上が「正面=top」のとき、正面は上側にある
export type Direction = 'top' | 'bottom' | 'left' | 'right';

// モード別スコア重み
export const SCORE_WEIGHTS: Record<Mode, { door: number; front: number }> = {
  meeting:     { door: 0.6, front: 0.4 }, // ビジネス重視
  banquet:     { door: 0.5, front: 0.5 }, // バランス
  hospitality: { door: 0.3, front: 0.7 }, // フォーマル重視
  custom:      { door: 0.5, front: 0.5 }, // ベースタイプにより上書きされる
};

// ============================================================
// レイアウト
// ============================================================
export type LayoutType =
  | 'rectangle' // テーブル席（両面）
  | 'round'     // 円卓
  | 'desk'      // 長机（片面・4席固定）
  | 'ushaped'   // コの字
  | 'oshaped'   // ロの字
  | 'western'   // 洋室（接待）
  | 'counter'   // カウンター（接待）
  | 'japanese'  // 和室（接待）
  | 'taxi'      // タクシー（固定）
  | 'elevator'; // エレベーター（固定）

export interface RectangleConfig { topSeats: number; bottomSeats: number }
export interface RoundConfig     { seatCount: number }
export interface DeskConfig      { orientation: 'horizontal' | 'vertical' }
export interface UShapedConfig   { frontSeats: number; leftSeats: number; rightSeats: number; opening: 'bottom' | 'top' }
export interface OShapedConfig   { frontSeats: number; leftSeats: number; rightSeats: number; doorSeats: number }
export interface CounterConfig   { seatCount: number }
export interface JapaneseConfig  {
  tokonoma: Direction;
  innerLayout: 'rectangle' | 'round';
  rectangleConfig?: RectangleConfig;
  roundConfig?: RoundConfig;
}

export type LayoutConfig =
  | { type: 'rectangle'; config: RectangleConfig }
  | { type: 'round';     config: RoundConfig }
  | { type: 'desk';      config: DeskConfig }
  | { type: 'ushaped';   config: UShapedConfig }
  | { type: 'oshaped';   config: OShapedConfig }
  | { type: 'western';   config: RectangleConfig }
  | { type: 'counter';   config: CounterConfig }
  | { type: 'japanese';  config: JapaneseConfig }
  | { type: 'taxi';      config: Record<string, never> }
  | { type: 'elevator';  config: Record<string, never> };

// ============================================================
// 人数設定
// ============================================================
export interface MeetingCounts {
  chairperson: number; // 0 or 1
  secretary: number;
  timekeeper: number;
  senior: number;
  general: number;
}

export interface BanquetCounts {
  guest_of_honor: number;
  senior: number;
  entertainer: number;
  newcomer: number;
  general: number;
  organizer: number;
  hasFocalPoint: boolean; // 正面（ステージ・スクリーン）有無
}

export interface HospitalityCounts {
  client: number;
  senior: number;
  general: number;
}

// カスタムモードのベースロジック種別
export type CustomBase = 'meeting' | 'banquet' | 'hospitality';

export interface CustomCounts {
  base: CustomBase;          // どの配置ロジックを使うか
  hasFocalPoint: boolean;    // base='banquet'のときのみ有効
  names: string[];           // 偉い人順の名前リスト（base='meeting'|'banquet'用）
  clientNames: string[];     // 来客名リスト（base='hospitality'用）
  participantNames: string[]; // 参加者名リスト（base='hospitality'用、ランク順）
}

export type RoleCounts = MeetingCounts | BanquetCounts | HospitalityCounts | CustomCounts;

// ============================================================
// 役職とスコア
// ============================================================
export type Role =
  | 'chairperson' | 'secretary' | 'timekeeper'
  | 'senior' | 'general' | 'organizer'
  | 'guest_of_honor' | 'entertainer' | 'newcomer'
  | 'client' | 'host' | 'master';

// 役職ランク（高いほど上座に配置）
export const ROLE_RANK: Record<string, number> = {
  chairperson:    100,
  guest_of_honor: 100,
  client:         100,
  senior:          80,
  secretary:       70,
  timekeeper:      70,
  entertainer:     60,
  newcomer:        50,
  general:         40,
  organizer:        10, // 幹事は下座
  host:            10,
};

export const ROLE_LABEL: Record<string, string> = {
  chairperson: '議長',    secretary: '議録',  timekeeper: '時',
  senior: '上',           general: '般',      organizer: '幹',
  guest_of_honor: '主',   entertainer: '盛',  newcomer: '初',
  client: '客',           host: '接',
  master: '大将',
};

export const ROLE_COLOR: Record<string, string> = {
  chairperson: '#dc2626', secretary: '#7c3aed',   timekeeper: '#2563eb',
  senior: '#0891b2',      general: '#059669',     organizer: '#d97706',
  guest_of_honor: '#dc2626', entertainer: '#db2777', newcomer: '#16a34a',
  client: '#dc2626',      host: '#d97706',
  master: '#7f1d1d',
};

// ============================================================
// 席（スコアを持つ）
// ============================================================
export interface Seat {
  id: string;
  lx: number;  // 論理X座標（正規化前）
  ly: number;  // 論理Y座標（正規化前）
  side: 'top' | 'bottom' | 'left' | 'right' | 'round';
  // スコア（0〜100、高いほど上座）
  doorScore: number;   // 出入口からの距離スコア
  frontScore: number;  // 正面からの距離スコア
  finalScore: number;  // 重み付き合成スコア
  // 議長席フラグ（コの字・ロの字）
  isChairperson: boolean;
  // 配置結果
  role: Role | null;
  roleIndex: number;
  isEmpty: boolean;
  label: string;
}

export interface TableData {
  tableIndex: number;
  tableRank: number;
  seats: Seat[];
  layoutType: LayoutType;
}

// ============================================================
// 会場・アプリ設定
// ============================================================
export interface VenueConfig {
  door: Direction;   // 出入口方向
  front: Direction;  // 正面方向
  tableCount: number;
  tablesPerRow: number;
}

export interface EventInfo {
  title: string;
  date: string;
  venue: string;
}

export interface AppState {
  mode: Mode;
  layout: LayoutConfig;
  counts: RoleCounts;
  venue: VenueConfig;
  eventInfo: EventInfo;
  debugShowScore: boolean;
  debugShowTableRank: boolean;
  schemaVersion: string;
}

export interface SeatingResult {
  tables: TableData[];
  totalSeats: number;
  totalPeople: number;
  errors: string[];
}

export const MODE_LABEL: Record<Mode, string> = {
  meeting: '会議', banquet: '宴会', hospitality: '接待', custom: 'カスタム',
};

export const LAYOUT_LABEL: Record<string, string> = {
  rectangle: 'テーブル席', round: '円卓',    desk: '長机',
  ushaped: 'コの字',       oshaped: 'ロの字', western: '洋室',
  counter: 'カウンター',   japanese: '和室',  taxi: 'タクシー',
  elevator: 'エレベーター',
};
