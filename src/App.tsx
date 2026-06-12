import React, { useRef, useState, useCallback } from 'react';
import { useAppState } from './hooks/useAppState';
import { generateSeating } from './logic/seatingEngine';
import { ControlPanel } from './components/ControlPanel';
import { SeatingSvg } from './components/SeatingSvg';
import { Legend } from './components/Legend';
import { exportToPng, buildFilename } from './utils/pngExport';
import { SeatingResult, MODE_LABEL, LAYOUT_LABEL } from './types';

type Tab = 'settings' | 'result';

export default function App() {
  const { state, setMode, setLayout, setVenue, setEventInfo, setDebug, updateCount } = useAppState();
  const [result, setResult] = useState<SeatingResult | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [exporting, setExporting] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('settings');
  const [showDisclaimer, setShowDisclaimer] = useState(() => {
    return !localStorage.getItem('sekiji_disclaimer_accepted');
  });
  const svgRef = useRef<SVGSVGElement>(null);

  const handleGenerate = useCallback(() => {
    const r = generateSeating(state);
    setResult(r);
    setErrors(r.errors);
    // 生成成功したら結果タブへ自動切替
    if (r.errors.length === 0) setActiveTab('result');
  }, [state]);

  const handleExport = useCallback(async () => {
    if (!svgRef.current || !result) return;
    setExporting(true);
    try {
      await exportToPng({
        svgElement: svgRef.current,
        title: state.eventInfo.title || '席次表',
        date: state.eventInfo.date,
        venue: state.eventInfo.venue,
        mode: MODE_LABEL[state.mode],
        layout: LAYOUT_LABEL[state.layout.type],
      }, buildFilename(state.eventInfo.title, state.eventInfo.date));
    } finally { setExporting(false); }
  }, [result, state]);

  const hasResult = !!result && result.errors.length === 0;

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col"
      style={{ fontFamily: "'Hiragino Sans','Hiragino Kaku Gothic ProN','Noto Sans JP','Yu Gothic UI',sans-serif" }}>

      {/* ウェルカムモーダル */}
      {showDisclaimer && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-7 space-y-5">
            <div className="text-center">
              <div className="text-5xl mb-3">🪑</div>
              <h2 className="text-xl font-bold text-stone-800">席次メーカーへようこそ</h2>
              <p className="text-xs text-stone-400 mt-1">席順の悩みをすばやく解決</p>
            </div>
            <div className="bg-amber-50 rounded-2xl p-4 text-sm text-stone-600 leading-relaxed">
              <p>このアプリは一般的なマナーをもとにした<strong>参考情報</strong>をお届けします📖</p>
              <p className="mt-2 text-stone-500 text-xs">業界・会社・地域によってルールはいろいろ。迷ったら先輩や主催者に確認するのが◎ですよ😸</p>
            </div>
            <button
              onClick={() => { localStorage.setItem('sekiji_disclaimer_accepted', '1'); setShowDisclaimer(false); }}
              className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-3 rounded-2xl transition-colors text-base shadow-sm"
            >つかってみる →</button>
          </div>
        </div>
      )}

      {/* ヘッダー */}
      <header className="bg-white border-b border-stone-200 px-4 py-3 flex items-center justify-between shadow-sm flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-amber-500 rounded-xl flex items-center justify-center shadow-sm flex-shrink-0">
            <span className="text-xl">🪑</span>
          </div>
          <div>
            <h1 className="text-base font-bold text-stone-800 leading-none tracking-tight">席次メーカー</h1>
            <p className="text-xs text-stone-400 mt-0.5">席順の悩みをすばやく解決</p>
          </div>
        </div>
        {hasResult && (
          <div className="flex items-center gap-2 text-xs text-stone-500 bg-stone-50 px-2.5 py-1.5 rounded-full border border-stone-200">
            <span>🪑{result!.totalSeats}</span>
            <span className="text-stone-300">|</span>
            <span>👥{result!.totalPeople}</span>
          </div>
        )}
      </header>

      {/* ============ デスクトップ: 横並び2カラム ============ */}
      <div className="hidden md:flex flex-1 overflow-hidden">
        <aside className="w-72 flex-shrink-0 bg-stone-50 border-r border-stone-200 overflow-y-auto p-3">
          <ControlPanel
            state={state} onMode={setMode} onLayout={setLayout} onCount={updateCount}
            onVenue={setVenue} onEvent={setEventInfo} onDebug={setDebug}
            onGenerate={handleGenerate} onExport={handleExport}
            errors={errors} hasResult={hasResult}
          />
        </aside>
        <main className="flex-1 flex flex-col overflow-hidden bg-white">
          {(state.eventInfo.title || state.eventInfo.venue) && (
            <div className="px-5 py-2 bg-stone-800 text-white flex items-center gap-3 text-sm flex-shrink-0">
              <span className="font-semibold">{state.eventInfo.title}</span>
              {state.eventInfo.date && <span className="text-stone-400 text-xs">{state.eventInfo.date}</span>}
              {state.eventInfo.venue && <span className="text-stone-400 text-xs">📍 {state.eventInfo.venue}</span>}
              <span className="ml-auto text-stone-500 text-xs">{MODE_LABEL[state.mode]} · {LAYOUT_LABEL[state.layout.type]}</span>
            </div>
          )}
          <div className="flex-1 overflow-auto p-6">
            <ResultArea result={result} state={state} svgRef={svgRef} onGenerate={handleGenerate} />
          </div>
        </main>
      </div>

      {/* ============ スマホ: タブ切り替え ============ */}
      <div className="flex md:hidden flex-col flex-1 overflow-hidden">
        {/* タブバー */}
        <div className="flex bg-white border-b border-stone-200 flex-shrink-0">
          <button
            onClick={() => setActiveTab('settings')}
            className={`flex-1 py-3 text-sm font-semibold flex items-center justify-center gap-1.5 transition-colors border-b-2 ${
              activeTab === 'settings'
                ? 'border-amber-500 text-amber-600'
                : 'border-transparent text-stone-400'
            }`}
          >
            ⚙️ 設定
          </button>
          <button
            onClick={() => setActiveTab('result')}
            className={`flex-1 py-3 text-sm font-semibold flex items-center justify-center gap-1.5 transition-colors border-b-2 ${
              activeTab === 'result'
                ? 'border-amber-500 text-amber-600'
                : 'border-transparent text-stone-400'
            }`}
          >
            🪑 席次表
            {hasResult && (
              <span className="ml-1 bg-amber-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">✓</span>
            )}
          </button>
        </div>

        {/* 設定タブ */}
        {activeTab === 'settings' && (
          <div className="flex-1 overflow-y-auto bg-stone-50 p-3">
            <ControlPanel
              state={state} onMode={setMode} onLayout={setLayout} onCount={updateCount}
              onVenue={setVenue} onEvent={setEventInfo} onDebug={setDebug}
              onGenerate={handleGenerate} onExport={handleExport}
              errors={errors} hasResult={hasResult}
            />
          </div>
        )}

        {/* 結果タブ */}
        {activeTab === 'result' && (
          <div className="flex-1 overflow-auto bg-white p-4">
            <ResultArea result={result} state={state} svgRef={svgRef} onGenerate={() => { handleGenerate(); }} />
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================
// 結果エリア（デスクトップ・スマホ共通）
// ============================================================
function ResultArea({ result, state, svgRef, onGenerate }: {
  result: SeatingResult | null;
  state: any;
  svgRef: React.RefObject<SVGSVGElement>;
  onGenerate: () => void;
}) {
  if (!result) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center select-none py-8">
        <h2 className="text-xl font-bold text-stone-700 mb-2">席次メーカー</h2>
        <p className="text-stone-500 text-sm mb-4">席次要件をセットしてください</p>
        <img src="/china_dora.png" alt="" className="w-32 h-32 object-contain mb-5 opacity-90" />
        <button onClick={onGenerate}
          className="bg-amber-500 hover:bg-amber-600 text-white font-bold py-3 px-10 rounded-2xl transition-colors shadow-md text-base">
          生成
        </button>
      </div>
    );
  }

  if (result.errors.length > 0) {
    return (
      <div className="h-full flex items-center justify-center py-8">
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 max-w-sm text-center">
          <div className="text-2xl font-bold text-red-700 mb-3">⚠️ 生成エラー</div>
          {result.errors.map((e, i) => <p key={i} className="text-sm text-red-600 mb-1">{e}</p>)}
          <img src="/chair_game.png" alt="" className="w-36 h-36 object-contain mx-auto mt-4" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-stone-50 rounded-2xl border border-stone-100 px-4 py-3">
        <Legend mode={state.mode} />
      </div>
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-auto p-2 md:p-4">
        <SeatingSvg
          ref={svgRef}
          tables={result.tables}
          state={state}
          width={Math.min(1200, typeof window !== 'undefined' ? window.innerWidth - 32 : 800)}
          height={500}
        />
      </div>
    </div>
  );
}
