import React from 'react';
import { Mode, ROLE_LABEL, ROLE_COLOR } from '../types';

export function Legend({ mode }: { mode: Mode }) {
  const roles = mode === 'meeting'
    ? ['chairperson', 'secretary', 'timekeeper', 'senior', 'general']
    : mode === 'banquet'
    ? ['guest_of_honor', 'senior', 'entertainer', 'newcomer', 'general', 'organizer']
    : ['client', 'senior', 'general', 'master'];

  const names: Record<string, string> = {
    chairperson: '議長', secretary: '議事録係', timekeeper: 'タイムキーパー',
    senior: mode === 'hospitality' ? '同席上席' : '上席',
    general: '一般', organizer: '幹事',
    guest_of_honor: '主賓', entertainer: '盛り上げ役', newcomer: '初参加',
    client: '来客', host: '接待担当', master: '大将',
  };

  return (
    <div className="flex flex-wrap gap-x-3 gap-y-1.5 items-center">
      <span className="text-xs text-stone-400 font-medium mr-1">凡例:</span>
      {roles.map(r => (
        <div key={r} className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ backgroundColor: ROLE_COLOR[r] ?? '#94a3b8' }} />
          <span className="text-xs text-stone-500">
            <span className="font-semibold" style={{ color: ROLE_COLOR[r] }}>{ROLE_LABEL[r]}</span>
            <span className="text-stone-400"> = {names[r]}</span>
          </span>
        </div>
      ))}
      <div className="flex items-center gap-1.5">
        <div className="w-2.5 h-2.5 rounded-sm bg-stone-200 flex-shrink-0" />
        <span className="text-xs text-stone-400">空席</span>
      </div>
    </div>
  );
}
