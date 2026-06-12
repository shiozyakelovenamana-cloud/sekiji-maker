// ============================================================
// LocalStorage 保存・読込ユーティリティ
// 保存件数: 1件、上書き方式
// schemaVersion: "1.0"
// ============================================================

import { AppState } from '../types';

const STORAGE_KEY = 'sekiji_maker_state';
const SCHEMA_VERSION = '1.0';

export function saveState(state: AppState): void {
  try {
    const data = JSON.stringify({ ...state, schemaVersion: SCHEMA_VERSION });
    localStorage.setItem(STORAGE_KEY, data);
  } catch (e) {
    console.warn('LocalStorage 保存失敗:', e);
  }
}

export function loadState(): AppState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AppState;
    if (parsed.schemaVersion !== SCHEMA_VERSION) {
      console.warn('スキーマバージョン不一致。設定を無視します。');
      return null;
    }
    return parsed;
  } catch (e) {
    console.warn('LocalStorage 読込失敗:', e);
    return null;
  }
}

export function clearState(): void {
  localStorage.removeItem(STORAGE_KEY);
}
