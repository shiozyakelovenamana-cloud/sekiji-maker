import { useState, useCallback, useEffect } from 'react';
import {
  AppState, Mode, LayoutConfig, RoleCounts, VenueConfig, EventInfo,
  MeetingCounts, BanquetCounts, HospitalityCounts, CustomCounts,
} from '../types';
import { saveState, loadState } from '../utils/storage';

const DEF_MEETING: MeetingCounts = { chairperson: 1, secretary: 1, timekeeper: 1, senior: 3, general: 5 };
const DEF_BANQUET: BanquetCounts = {
  guest_of_honor: 1, senior: 2, entertainer: 1, newcomer: 2, general: 6, organizer: 1,
  hasFocalPoint: true,
};
const DEF_HOSPITALITY: HospitalityCounts = { client: 3, senior: 2, general: 3 };
const DEF_CUSTOM: CustomCounts = {
  base: 'meeting',
  hasFocalPoint: true,
  names: ['', '', '', ''],
  clientNames: ['', ''],
  participantNames: ['', '', ''],
};

const DEFAULT: AppState = {
  mode: 'meeting',
  layout: { type: 'rectangle', config: { topSeats: 5, bottomSeats: 5 } },
  counts: DEF_MEETING,
  venue: { door: 'bottom', front: 'top', tableCount: 1, tablesPerRow: 1 },
  eventInfo: { title: '', date: new Date().toISOString().slice(0, 10), venue: '' },
  debugShowScore: false,
  debugShowTableRank: false,
  schemaVersion: '3.0',
};

function defaultCounts(mode: Mode): RoleCounts {
  return mode === 'meeting' ? { ...DEF_MEETING }
    : mode === 'banquet' ? { ...DEF_BANQUET }
    : mode === 'custom' ? { ...DEF_CUSTOM }
    : { ...DEF_HOSPITALITY };
}

function defaultLayout(mode: Mode): LayoutConfig {
  if (mode === 'meeting') return { type: 'rectangle', config: { topSeats: 5, bottomSeats: 5 } };
  if (mode === 'banquet') return { type: 'round', config: { seatCount: 8 } };
  if (mode === 'custom')  return { type: 'rectangle', config: { topSeats: 5, bottomSeats: 5 } };
  return { type: 'western', config: { topSeats: 3, bottomSeats: 3 } };
}

export function useAppState() {
  const [state, setState] = useState<AppState>(() => {
    try { return loadState() ?? DEFAULT; } catch { return DEFAULT; }
  });
  useEffect(() => { saveState(state); }, [state]);

  const setMode = useCallback((mode: Mode) => setState(prev => ({
    ...prev, mode, counts: defaultCounts(mode), layout: defaultLayout(mode),
    venue: { ...prev.venue, tableCount: 1, tablesPerRow: 1 },
  })), []);

  const setLayout = useCallback((layout: LayoutConfig) => setState(prev => {
    if (prev.mode === 'hospitality') {
      const seatCount = (() => {
        switch (layout.type) {
          case 'rectangle': case 'western':
            return layout.config.topSeats + layout.config.bottomSeats;
          case 'round':    return layout.config.seatCount;
          case 'counter':  return layout.config.seatCount + 1;
          case 'taxi': case 'elevator': return 4;
          default: return 99;
        }
      })();
      const total = Object.values(prev.counts).reduce((s, v) => s + (typeof v === 'number' ? v : 0), 0);
      const counts = total > seatCount || total > 10
        ? { client: 2, senior: 2, general: 2 }
        : prev.counts;
      return { ...prev, layout, counts };
    }
    return { ...prev, layout };
  }), []);

  const setVenue     = useCallback((venue: VenueConfig)   => setState(prev => ({ ...prev, venue })), []);
  const setEventInfo = useCallback((eventInfo: EventInfo) => setState(prev => ({ ...prev, eventInfo })), []);
  const setDebug     = useCallback((key: keyof AppState, val: boolean) => setState(prev => ({ ...prev, [key]: val })), []);

  // 数値・boolean 両対応（hasFocalPointなどのチェックボックス用）
  const updateCount = useCallback((role: string, value: number | boolean) =>
    setState(prev => ({
      ...prev,
      counts: { ...prev.counts, [role]: typeof value === 'boolean' ? value : Math.max(0, value) },
    })), []);

  // カスタムモード: 偉い人順の名前リスト（meeting/banquet用）
  const updateNames = useCallback((names: string[]) =>
    setState(prev => ({ ...prev, counts: { ...prev.counts, names } })), []);

  // カスタムモード: 接待用の来客名リスト
  const updateClientNames = useCallback((clientNames: string[]) =>
    setState(prev => ({ ...prev, counts: { ...prev.counts, clientNames } })), []);

  // カスタムモード: 接待用の参加者名リスト
  const updateParticipantNames = useCallback((participantNames: string[]) =>
    setState(prev => ({ ...prev, counts: { ...prev.counts, participantNames } })), []);

  // カスタムモード: ベースロジック切替（meeting/banquet/hospitality）
  const updateCustomBase = useCallback((base: CustomCounts['base']) =>
    setState(prev => ({ ...prev, counts: { ...prev.counts, base } })), []);

  return {
    state, setMode, setLayout, setVenue, setEventInfo, setDebug, updateCount,
    updateNames, updateClientNames, updateParticipantNames, updateCustomBase,
  };
}
