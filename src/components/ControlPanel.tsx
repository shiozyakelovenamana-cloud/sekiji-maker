import React from 'react';
import {
  AppState, Mode, LayoutConfig, VenueConfig, EventInfo, Direction,
  MeetingCounts, BanquetCounts, HospitalityCounts, CustomCounts,
  MODE_LABEL, LAYOUT_LABEL,
} from '../types';

interface Props {
  state: AppState; onMode: (m: Mode) => void; onLayout: (l: LayoutConfig) => void;
  onCount: (role: string, v: number | boolean) => void; onVenue: (v: VenueConfig) => void;
  onEvent: (e: EventInfo) => void; onDebug: (key: keyof AppState, v: boolean) => void;
  onGenerate: () => void; onExport: () => void; onNames: (names: string[]) => void;
  errors: string[]; hasResult: boolean;
}

const ic  = "w-full border border-stone-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white text-stone-700";
const lc  = "block text-xs font-semibold text-stone-400 uppercase tracking-wider mb-1.5";
const sc  = "bg-white rounded-2xl border border-stone-100 shadow-sm p-4 space-y-3";
const stc = "text-sm font-bold text-stone-700 border-b border-stone-100 pb-2 mb-3 flex items-center gap-1.5";

const MODE_ICON: Record<Mode, string> = { meeting: '🏢', banquet: '🍽️', hospitality: '🤝', custom: '✏️' };
const MODE_DESC: Record<Mode, string> = {
  meeting: '会議・打ち合わせ', banquet: '宴会・懇親会',
  hospitality: '接待・おもてなし', custom: '名前で席を決める',
};

function Num({ label, value, min = 0, max = 999, onChange }: {
  label: string; value: number; min?: number; max?: number; onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-stone-600">{label}</span>
      <div className="flex items-center gap-1">
        <button className="w-7 h-7 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-600 text-sm font-bold transition-colors"
          onClick={() => onChange(Math.max(min, value - 1))}>−</button>
        <input type="number" value={value} min={min} max={max}
          className="w-14 border border-stone-200 rounded-lg px-1 py-1 text-sm text-center text-stone-700 focus:outline-none focus:ring-2 focus:ring-amber-400"
          onChange={e => onChange(Math.max(min, Math.min(max, parseInt(e.target.value) || 0)))} />
        <button className="w-7 h-7 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-600 text-sm font-bold transition-colors"
          onClick={() => onChange(Math.min(max, value + 1))}>＋</button>
      </div>
    </div>
  );
}

function DirButtons({ label, value, onChange, disabled }: {
  label: string; value: Direction; onChange: (d: Direction) => void; disabled?: boolean;
}) {
  const dirs: Direction[] = ['top', 'bottom', 'left', 'right'];
  const dLabels = { top: '上', bottom: '下', left: '左', right: '右' };
  return (
    <div>
      <label className={lc}>{label}</label>
      <div className="grid grid-cols-4 gap-1">
        {dirs.map(d => (
          <button key={d} disabled={disabled} onClick={() => onChange(d)}
            className={`py-1.5 text-xs rounded-xl border font-medium transition-all ${
              value === d ? 'bg-amber-500 text-white border-amber-500'
              : disabled ? 'bg-stone-100 text-stone-400 border-stone-200 cursor-not-allowed'
              : 'bg-white text-stone-600 border-stone-200 hover:border-amber-300'}`}>
            {dLabels[d]}
          </button>
        ))}
      </div>
    </div>
  );
}

function LayoutConfigEditor({ state, onChange }: { state: AppState; onChange: (l: LayoutConfig) => void }) {
  const { layout } = state;
  function up(p: Partial<any>) { onChange({ ...layout, config: { ...layout.config, ...p } } as LayoutConfig); }

  switch (layout.type) {
    case 'round':
      return <Num label="席数" value={layout.config.seatCount} min={2} max={10} onChange={v => up({ seatCount: v })} />;
    case 'rectangle': case 'western':
      return <>
        <Num label="上辺席数" value={layout.config.topSeats} min={1} max={9} onChange={v => up({ topSeats: v })} />
        <Num label="下辺席数" value={layout.config.bottomSeats} min={1} max={9} onChange={v => up({ bottomSeats: v })} />
        <p className="text-xs text-stone-400">合計 {layout.config.topSeats + layout.config.bottomSeats}席</p>
      </>;
    case 'desk':
      return <>
        <label className={lc}>机の向き</label>
        <div className="grid grid-cols-2 gap-1">
          {(['horizontal', 'vertical'] as const).map(o => (
            <button key={o} onClick={() => up({ orientation: o })}
              className={`py-1.5 text-xs rounded-xl border font-medium transition-all ${layout.config.orientation === o ? 'bg-amber-500 text-white border-amber-500' : 'bg-white text-stone-600 border-stone-200 hover:border-amber-300'}`}>
              {o === 'horizontal' ? '横（←→）' : '縦（↑↓）'}
            </button>
          ))}
        </div>
        <p className="text-xs text-stone-400">1枚4席固定 · 枚数は総卓数で</p>
      </>;
    case 'ushaped':
      return <>
        <label className={lc}>コの字の向き</label>
        <div className="grid grid-cols-2 gap-1">
          {(['bottom', 'top'] as const).map(o => (
            <button key={o} onClick={() => up({ opening: o })}
              className={`py-1.5 text-xs rounded-xl border font-medium transition-all ${layout.config.opening === o ? 'bg-amber-500 text-white border-amber-500' : 'bg-white text-stone-600 border-stone-200 hover:border-amber-300'}`}>
              {o === 'bottom' ? 'コ字（下あき）' : '∪字（上あき）'}
            </button>
          ))}
        </div>
        <Num label="正面辺" value={layout.config.frontSeats} min={1} max={20} onChange={v => up({ frontSeats: v })} />
        <Num label="左辺" value={layout.config.leftSeats} min={1} max={20} onChange={v => up({ leftSeats: v })} />
        <Num label="右辺" value={layout.config.rightSeats} min={1} max={20} onChange={v => up({ rightSeats: v })} />
      </>;
    case 'oshaped':
      return <>
        <Num label="正面辺" value={layout.config.frontSeats} min={1} max={20} onChange={v => up({ frontSeats: v })} />
        <Num label="左辺" value={layout.config.leftSeats} min={1} max={20} onChange={v => up({ leftSeats: v })} />
        <Num label="右辺" value={layout.config.rightSeats} min={1} max={20} onChange={v => up({ rightSeats: v })} />
        <Num label="出入口辺" value={layout.config.doorSeats} min={1} max={20} onChange={v => up({ doorSeats: v })} />
      </>;
    case 'counter':
      return <Num label="客席数" value={layout.config.seatCount} min={1} max={9} onChange={v => up({ seatCount: v })} />;
    case 'japanese': {
      const c = layout.config;
      return <>
        <DirButtons label="床の間の位置" value={c.tokonoma}
          onChange={v => onChange({ ...layout, config: { ...c, tokonoma: v } })} />
        <div>
          <label className={lc}>内部レイアウト</label>
          <div className="grid grid-cols-2 gap-1">
            {(['rectangle', 'round'] as const).map(il => (
              <button key={il} onClick={() => onChange({ ...layout, config: {
                ...c, innerLayout: il,
                rectangleConfig: il === 'rectangle' ? { topSeats: 4, bottomSeats: 4 } : undefined,
                roundConfig: il === 'round' ? { seatCount: 8 } : undefined,
              }})}
                className={`py-1.5 text-xs rounded-xl border font-medium transition-all ${c.innerLayout === il ? 'bg-amber-500 text-white border-amber-500' : 'bg-white text-stone-600 border-stone-200 hover:border-amber-300'}`}>
                {LAYOUT_LABEL[il]}
              </button>
            ))}
          </div>
        </div>
        {c.innerLayout === 'rectangle' && c.rectangleConfig && <>
          <Num label="上辺" value={c.rectangleConfig.topSeats} min={1} max={9}
            onChange={v => onChange({ ...layout, config: { ...c, rectangleConfig: { ...c.rectangleConfig!, topSeats: v } } })} />
          <Num label="下辺" value={c.rectangleConfig.bottomSeats} min={1} max={9}
            onChange={v => onChange({ ...layout, config: { ...c, rectangleConfig: { ...c.rectangleConfig!, bottomSeats: v } } })} />
        </>}
        {c.innerLayout === 'round' && c.roundConfig && (
          <Num label="席数" value={c.roundConfig.seatCount} min={2} max={10}
            onChange={v => onChange({ ...layout, config: { ...c, roundConfig: { seatCount: v } } })} />
        )}
      </>;
    }
    case 'taxi': case 'elevator':
      return <p className="text-xs text-stone-400">固定レイアウト（変更不可）</p>;
    default: return null;
  }
}

export function ControlPanel({
  state, onMode, onLayout, onCount, onVenue, onEvent, onDebug,
  onGenerate, onExport, onNames, errors, hasResult,
}: Props) {
  const { mode, layout, counts, venue, eventInfo } = state;
  const cc = counts as CustomCounts;
  const mc = counts as MeetingCounts;
  const bc = counts as BanquetCounts;
  const hc = counts as HospitalityCounts;

  const total = mode === 'custom'
    ? cc.names.filter(n => n.trim()).length
    : Object.values(counts).filter(v => typeof v === 'number').reduce((s, v) => s + (v as number), 0);

  const isSingle = ['ushaped','oshaped','counter','japanese','taxi','elevator','western'].includes(layout.type);

  function seatsPerTable(): number {
    switch (layout.type) {
      case 'rectangle': case 'western': return layout.config.topSeats + layout.config.bottomSeats;
      case 'round': return layout.config.seatCount;
      case 'desk': return 4;
      case 'ushaped': return layout.config.frontSeats + layout.config.leftSeats + layout.config.rightSeats;
      case 'oshaped': return layout.config.frontSeats + layout.config.leftSeats + layout.config.rightSeats + layout.config.doorSeats;
      default: return 0;
    }
  }
  const spt = seatsPerTable();
  const minTables = spt > 0 && mode !== 'hospitality' && mode !== 'custom' && !isSingle ? Math.ceil(total / spt) : 0;

  const meetingLayouts = ['rectangle', 'round', 'desk', 'ushaped', 'oshaped'] as const;
  const banquetLayouts = ['round', 'rectangle'] as const;
  const hospLayouts    = ['western', 'round', 'rectangle', 'counter', 'japanese', 'taxi', 'elevator'] as const;
  const customLayouts  = ['rectangle', 'round', 'desk', 'ushaped', 'oshaped', 'western', 'counter', 'japanese', 'taxi', 'elevator'] as const;
  const layouts: readonly string[] =
    mode === 'meeting' ? meetingLayouts :
    mode === 'banquet' ? banquetLayouts :
    mode === 'custom'  ? customLayouts :
    hospLayouts;

  function selectLayout(type: string) {
    const map: Record<string, LayoutConfig> = {
      rectangle: { type: 'rectangle', config: { topSeats: 5, bottomSeats: 5 } },
      round:     { type: 'round',     config: { seatCount: 8 } },
      desk:      { type: 'desk',      config: { orientation: 'horizontal' } },
      ushaped:   { type: 'ushaped',   config: { frontSeats: 5, leftSeats: 3, rightSeats: 3, opening: 'bottom' } },
      oshaped:   { type: 'oshaped',   config: { frontSeats: 5, leftSeats: 3, rightSeats: 3, doorSeats: 5 } },
      western:   { type: 'western',   config: { topSeats: 3, bottomSeats: 3 } },
      counter:   { type: 'counter',   config: { seatCount: 6 } },
      japanese:  { type: 'japanese',  config: { tokonoma: 'top', innerLayout: 'rectangle', rectangleConfig: { topSeats: 4, bottomSeats: 4 } } },
      taxi:      { type: 'taxi',      config: {} },
      elevator:  { type: 'elevator',  config: {} },
    };
    if (map[type]) onLayout(map[type]);
  }

  return (
    <div className="flex flex-col gap-3 h-full overflow-y-auto pr-1 pb-2">

      {/* モード */}
      <div className={sc}>
        <div className={stc}>モード</div>
        <div className="grid grid-cols-2 gap-2">
          {(['meeting', 'banquet', 'hospitality', 'custom'] as Mode[]).map(m => (
            <button key={m} onClick={() => onMode(m)}
              className={`py-2.5 rounded-2xl text-xs font-semibold border transition-all flex flex-col items-center gap-1 ${
                mode === m
                  ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
                  : 'bg-white text-stone-600 border-stone-200 hover:border-amber-300'}`}>
              <span className="text-lg">{MODE_ICON[m]}</span>
              <span>{MODE_LABEL[m]}</span>
            </button>
          ))}
        </div>
        <p className="text-xs text-stone-400 text-center">{MODE_DESC[mode]}</p>
      </div>

      {/* 参加人数 */}
      <div className={sc}>
        <div className={stc}>
          参加人数
          <span className="font-normal text-stone-400 ml-auto text-xs">計 {total}名</span>
          {minTables > 0 && <span className="font-normal text-amber-500 text-xs">· 最低{minTables}卓</span>}
        </div>

        {mode === 'meeting' && <>
          <Num label="議長" value={mc.chairperson} min={0} max={1} onChange={v => onCount('chairperson', v)} />
          <Num label="議事録係" value={mc.secretary} onChange={v => onCount('secretary', v)} />
          <Num label="タイムキーパー" value={mc.timekeeper} onChange={v => onCount('timekeeper', v)} />
          <Num label="上席" value={mc.senior} onChange={v => onCount('senior', v)} />
          <Num label="一般" value={mc.general} onChange={v => onCount('general', v)} />
        </>}

        {mode === 'banquet' && <>
          <Num label="主賓" value={bc.guest_of_honor} onChange={v => onCount('guest_of_honor', v)} />
          <Num label="上席" value={bc.senior} onChange={v => onCount('senior', v)} />
          <Num label="盛り上げ役" value={bc.entertainer} onChange={v => onCount('entertainer', v)} />
          <Num label="初参加" value={bc.newcomer} onChange={v => onCount('newcomer', v)} />
          <Num label="一般" value={bc.general} onChange={v => onCount('general', v)} />
          <Num label="幹事" value={bc.organizer} onChange={v => onCount('organizer', v)} />
          <label className="flex items-center gap-2 text-sm text-stone-600 cursor-pointer">
            <input type="checkbox"
              checked={bc.hasFocalPoint ?? true}
              onChange={e => onCount('hasFocalPoint', e.target.checked)}
              className="w-4 h-4 rounded accent-amber-500" />
            正面（ステージ・スクリーン）あり
          </label>
        </>}

        {mode === 'hospitality' && <>
          <Num label="来客" value={hc.client} max={10} onChange={v => onCount('client', v)} />
          <Num label="同席上席" value={hc.senior} max={10} onChange={v => onCount('senior', v)} />
          <Num label="一般" value={hc.general} max={10} onChange={v => onCount('general', v)} />
          <p className={`text-xs ${total > 10 ? 'text-red-500 font-bold' : 'text-stone-400'}`}>
            上限10名（現在 {total}名）
          </p>
        </>}

        {mode === 'custom' && (
          <div className="space-y-2">
            <p className="text-xs text-stone-500">偉い人順に名前を入力してください（1人1行）</p>
            <textarea
              className="w-full border border-stone-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white text-stone-700 resize-none"
              rows={6}
              placeholder={"例：\n丸本社長\n田中部長\n取引先担当者"}
              value={cc.names.join('\n')}
              onChange={e => onNames(e.target.value.split('\n'))}
            />
            <p className="text-xs text-stone-400">{total}名入力中</p>
          </div>
        )}
      </div>

      {/* レイアウト */}
      <div className={sc}>
        <div className={stc}>レイアウト</div>
        <div className="grid grid-cols-2 gap-1.5">
          {layouts.map(lt => (
            <button key={lt} onClick={() => selectLayout(lt)}
              className={`py-1.5 px-2 rounded-xl text-xs font-medium border transition-all ${
                layout.type === lt
                  ? 'bg-amber-500 text-white border-amber-500'
                  : 'bg-white text-stone-600 border-stone-200 hover:border-amber-300'}`}>
              {LAYOUT_LABEL[lt]}
            </button>
          ))}
        </div>
        <div className="pt-1 space-y-2">
          <LayoutConfigEditor state={state} onChange={onLayout} />
        </div>
      </div>

      {/* 会場設定 */}
      <div className={sc}>
        <div className={stc}>会場設定</div>
        {layout.type !== 'counter' && layout.type !== 'taxi' && (
          <DirButtons
            label={`出入口の方向${layout.type === 'elevator' ? '（固定=下）' : ''}`}
            value={layout.type === 'elevator' ? 'bottom' : venue.door}
            onChange={d => onVenue({ ...venue, door: d })}
            disabled={layout.type === 'elevator'}
          />
        )}
        {layout.type !== 'japanese' && layout.type !== 'counter' && layout.type !== 'taxi' && (
          <DirButtons label="正面の方向" value={venue.front} onChange={d => onVenue({ ...venue, front: d })} />
        )}
        {!isSingle && mode !== 'hospitality' && mode !== 'custom' && <>
          <Num label="総卓数" value={venue.tableCount} min={1} max={50} onChange={v => onVenue({ ...venue, tableCount: v })} />
          <Num label="1列あたり卓数" value={venue.tablesPerRow} min={1} max={venue.tableCount}
            onChange={v => onVenue({ ...venue, tablesPerRow: Math.min(v, venue.tableCount) })} />
        </>}
        {(layout.type === 'counter') && <p className="text-xs text-stone-400">カウンターは方向設定なし</p>}
        {(layout.type === 'taxi') && <p className="text-xs text-stone-400">タクシーは方向設定なし</p>}
      </div>

      {/* イベント情報 */}
      <div className={sc}>
        <div className={stc}>イベント情報</div>
        <div>
          <label className={lc}>タイトル</label>
          <input type="text" className={ic} value={eventInfo.title} placeholder="例：3Q全社定例会"
            onChange={e => onEvent({ ...eventInfo, title: e.target.value })} />
        </div>
        <div>
          <label className={lc}>日付</label>
          <input type="date" className={ic} value={eventInfo.date}
            onChange={e => onEvent({ ...eventInfo, date: e.target.value })} />
        </div>
        <div>
          <label className={lc}>場所</label>
          <input type="text" className={ic} value={eventInfo.venue} placeholder="例：第1会議室"
            onChange={e => onEvent({ ...eventInfo, venue: e.target.value })} />
        </div>
      </div>

      {/* デバッグ */}
      <div className={sc}>
        <div className={stc}>デバッグ</div>
        <label className="flex items-center gap-2 text-sm text-stone-600 cursor-pointer hover:text-stone-800 transition-colors">
          <input type="checkbox" checked={state.debugShowTableRank as boolean}
            onChange={e => onDebug('debugShowTableRank', e.target.checked)}
            className="w-4 h-4 rounded accent-amber-500" />
          卓番号を表示
        </label>
      </div>

      {/* エラー */}
      {errors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-3 space-y-1">
          <p className="text-xs font-bold text-red-600 mb-1">🤔 こんなエラーが出てます</p>
          {errors.map((e, i) => <p key={i} className="text-xs text-red-500">{e}</p>)}
        </div>
      )}

      {/* アクションボタン（最下部） */}
      <div className="space-y-2 pt-1 pb-4">
        <button onClick={onGenerate}
          className="w-full bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white font-bold py-3 rounded-2xl transition-colors shadow-sm text-base">
          生成
        </button>
        {hasResult && (
          <button onClick={onExport}
            className="w-full bg-stone-700 hover:bg-stone-800 text-white font-semibold py-2.5 rounded-2xl transition-colors text-sm">
            PNG で保存 📥
          </button>
        )}
      </div>
    </div>
  );
}
