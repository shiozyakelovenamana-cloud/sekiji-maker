import React, { useRef, useState, useCallback, useEffect } from 'react';
import { useAppState } from './hooks/useAppState';
import { generateSeating } from './logic/seatingEngine';
import { ControlPanel } from './components/ControlPanel';
import { SeatingSvg } from './components/SeatingSvg';
import { Legend } from './components/Legend';
import { FaqContent } from './components/Faq';
import { exportToPng, buildFilename } from './utils/pngExport';
import { SeatingResult, MODE_LABEL, LAYOUT_LABEL } from './types';

type Tab = 'settings' | 'result';

const GUIDE_STEPS = [
  { emoji: '①', title: 'まずはモードを選択', body: '会議・宴会・接待・カスタムの中から、今回のシーンに近いモードを選びます。' },
  { emoji: '②', title: '参加人数を入力', body: '役職ごとの人数（カスタムなら名前）を入力します。' },
  { emoji: '③', title: 'レイアウトと会場設定', body: '部屋の形、出入口・正面の有無と向き、1卓/辺当たりの着席数を設定します。' },
  { emoji: '④', title: 'あとは「生成」を押すだけ', body: 'ボタンを押すと席次表が出来上がります。PNG保存も可能です。' },
];

export default function App() {
  const { state, setMode, setLayout, setVenue, setEventInfo, setDebug, updateCount, updateNames } = useAppState();
  const [result, setResult] = useState<SeatingResult | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [exporting, setExporting] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('settings');
  const [showDisclaimer, setShowDisclaimer] = useState(() => {
    return !localStorage.getItem('sekiji_disclaimer_accepted');
  });
  const [showGuide, setShowGuide] = useState(false);
  const [guideStep, setGuideStep] = useState(0);
  const [showFaq, setShowFaq] = useState(false);
  const [showContact, setShowContact] = useState(false);
  const [generateCount, setGenerateCount] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    fetch('/api/count')
      .then(r => r.json())
      .then(d => setGenerateCount(d.count))
      .catch(() => {});
  }, []);

  const handleGenerate = useCallback(() => {
    const r = generateSeating(state);
    setResult(r);
    setErrors(r.errors);
    setActiveTab('result');
    if (r.errors.length === 0) {
      fetch('/api/count', { method: 'POST' })
        .then(res => res.json())
        .then(d => setGenerateCount(d.count))
        .catch(() => {});
    }
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
              <p className="mt-2 text-stone-500 text-xs">業界・会社・地域によってルールはいろいろ。迷ったら先輩や主催者に確認するのが◎ですよ^^</p>
            </div>
            <button
              onClick={() => {
                localStorage.setItem('sekiji_disclaimer_accepted', '1');
                setShowDisclaimer(false);
                setGuideStep(0);
                setShowGuide(true);
              }}
              className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-3 rounded-2xl transition-colors text-base shadow-sm"
            >つかってみる →</button>
          </div>
        </div>
      )}

      {showGuide && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-7 space-y-5">
            <div className="text-center">
              <div className="text-3xl mb-2">{GUIDE_STEPS[guideStep].emoji}</div>
              <h3 className="text-lg font-bold text-stone-800">{GUIDE_STEPS[guideStep].title}</h3>
            </div>
            <p className="text-sm text-stone-600 leading-relaxed text-center">
              {GUIDE_STEPS[guideStep].body}
            </p>
            <div className="flex items-center justify-center gap-1.5">
              {GUIDE_STEPS.map((_, i) => (
                <span key={i} className={`w-1.5 h-1.5 rounded-full ${i === guideStep ? 'bg-amber-500' : 'bg-stone-200'}`} />
              ))}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowGuide(false)}
                className="flex-1 text-stone-400 text-sm py-2.5 rounded-2xl hover:bg-stone-50 transition-colors"
              >スキップ</button>
              <button
                onClick={() => {
                  if (guideStep < GUIDE_STEPS.length - 1) setGuideStep(s => s + 1);
                  else setShowGuide(false);
                }}
                className="flex-1 bg-amber-500 hover:bg-amber-600 text-white font-bold py-2.5 rounded-2xl transition-colors text-sm"
              >{guideStep < GUIDE_STEPS.length - 1 ? '次へ' : 'はじめる'}</button>
            </div>
          </div>
        </div>
      )}

      <header className="bg-white border-b border-stone-200 px-4 py-3 flex items-center justify-between shadow-sm flex-shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 bg-amber-500 rounded-xl flex items-center justify-center shadow-sm flex-shrink-0">
            <span className="text-xl">🪑</span>
          </div>
          <div className="min-w-0">
            <h1 className="text-base font-bold text-stone-800 leading-none tracking-tight">席次メーカー</h1>
            <p className="text-xs text-stone-400 mt-0.5">席順の悩みをすばやく解決</p>
          </div>
          <button onClick={() => setShowFaq(true)}
            className="ml-1 text-xs font-semibold text-stone-500 bg-stone-100 hover:bg-stone-200 px-2.5 py-1.5 rounded-full transition-colors flex-shrink-0">
            Q&A
          </button>
          <button onClick={() => setShowContact(true)}
            className="text-xs font-semibold text-stone-500 bg-stone-100 hover:bg-stone-200 px-2.5 py-1.5 rounded-full transition-colors flex-shrink-0">
            お問い合わせ
          </button>
        </div>
        {hasResult && (
          <div className="hidden sm:flex items-center gap-2 text-xs text-stone-500 bg-stone-50 px-2.5 py-1.5 rounded-full border border-stone-200 flex-shrink-0">
            <span>🪑{result!.totalSeats}</span>
            <span className="text-stone-300">|</span>
            <span>👥{result!.totalPeople}</span>
          </div>
        )}
      </header>

      {/* Q&A モーダル */}
      {showFaq && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowFaq(false)}>
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full max-h-[80vh] overflow-y-auto p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-bold text-stone-800">よくある質問</h2>
              <button onClick={() => setShowFaq(false)} className="text-stone-400 hover:text-stone-600 text-xl px-2">×</button>
            </div>
            <FaqContent />
          </div>
        </div>
      )}

      {/* お問い合わせ モーダル */}
      {showContact && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowContact(false)}>
          <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-7 space-y-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-stone-800">お問い合わせ</h2>
              <button onClick={() => setShowContact(false)} className="text-stone-400 hover:text-stone-600 text-xl px-2">×</button>
            </div>
            <p className="text-sm text-stone-600 leading-relaxed">
              不具合の報告やご意見・ご要望など、お気軽にご連絡ください。
            </p>
            <a href="mailto:bonitotsukudani@gmail.com"
              className="block w-full text-center bg-amber-500 hover:bg-amber-600 text-white font-bold py-3 rounded-2xl transition-colors text-sm">
              bonitotsukudani@gmail.com
            </a>
          </div>
        </div>
      )}

      <div className="hidden md:flex flex-1 overflow-hidden">
        <aside className="w-72 flex-shrink-0 bg-stone-50 border-r border-stone-200 overflow-y-auto p-3">
          <ControlPanel
            state={state} onMode={setMode} onLayout={setLayout} onCount={updateCount}
            onVenue={setVenue} onEvent={setEventInfo} onDebug={setDebug}
            onGenerate={handleGenerate} onExport={handleExport}
            onNames={updateNames}
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
            <ResultArea result={result} state={state} svgRef={svgRef} onGenerate={handleGenerate}
              generateCount={generateCount} onExport={handleExport} exporting={exporting} />
          </div>
        </main>
      </div>

      <div className="flex md:hidden flex-col flex-1 overflow-hidden">
        <div className="flex bg-white border-b border-stone-200 flex-shrink-0">
          <button onClick={() => setActiveTab('settings')}
            className={`flex-1 py-3 text-sm font-semibold flex items-center justify-center gap-1.5 transition-colors border-b-2 ${
              activeTab === 'settings' ? 'border-amber-500 text-amber-600' : 'border-transparent text-stone-400'}`}>
            ⚙️ 設定
          </button>
          <button onClick={() => setActiveTab('result')}
            className={`flex-1 py-3 text-sm font-semibold flex items-center justify-center gap-1.5 transition-colors border-b-2 ${
              activeTab === 'result' ? 'border-amber-500 text-amber-600' : 'border-transparent text-stone-400'}`}>
            🪑 席次表
            {hasResult && (
              <span className="ml-1 bg-amber-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">✓</span>
            )}
          </button>
        </div>

        {activeTab === 'settings' && (
          <div className="flex-1 overflow-y-auto bg-stone-50 p-3">
            <ControlPanel
              state={state} onMode={setMode} onLayout={setLayout} onCount={updateCount}
              onVenue={setVenue} onEvent={setEventInfo} onDebug={setDebug}
              onGenerate={handleGenerate} onExport={handleExport}
              onNames={updateNames}
              errors={errors} hasResult={hasResult}
            />
          </div>
        )}

        {activeTab === 'result' && (
          <div className="flex-1 overflow-auto bg-white p-4">
            <ResultArea result={result} state={state} svgRef={svgRef} onGenerate={handleGenerate}
              generateCount={generateCount} onExport={handleExport} exporting={exporting} />
          </div>
        )}
      </div>
    </div>
  );
}

function ResultArea({ result, state, svgRef, onGenerate, generateCount, onExport, exporting }: {
  result: SeatingResult | null;
  state: any;
  svgRef: React.RefObject<SVGSVGElement>;
  onGenerate: () => void;
  generateCount: number | null;
  onExport: () => void;
  exporting: boolean;
}) {
  if (!result) {
    return (
      <div className="space-y-4">
        <div className="flex flex-col items-center justify-center text-center select-none py-8">
          <h2 className="text-xl font-bold text-stone-700 mb-2">席次メーカー</h2>
          <p className="text-stone-500 text-sm mb-4">席次要件をセットしてください</p>
          <img src="/china_dora.png" alt="" className="w-32 h-32 object-contain mb-5 opacity-90" />
          <button onClick={onGenerate}
            className="bg-amber-500 hover:bg-amber-600 text-white font-bold py-3 px-10 rounded-2xl transition-colors shadow-md text-base">
            生成
          </button>
        </div>
      </div>
    );
  }

  if (result.errors.length > 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-center py-4">
          <div className="bg-red-50 border border-red-200 rounded-2xl p-6 max-w-sm w-full text-center">
            <div className="text-2xl font-bold text-red-700 mb-3">⚠️ 生成エラー</div>
            <div className="space-y-1 mb-4">
              {result.errors.map((e, i) => (
                <p key={i} className="text-sm text-red-600">{e}</p>
              ))}
            </div>
            <img src="/chair_game.png" alt="" className="w-32 h-32 object-contain mx-auto mb-4" />
            <button onClick={onGenerate}
              className="bg-amber-500 hover:bg-amber-600 text-white font-bold py-2.5 px-8 rounded-2xl transition-colors shadow-sm text-sm">
              設定を直して再生成
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {state.mode !== 'custom' && (
        <div className="bg-stone-50 rounded-2xl border border-stone-100 px-4 py-3">
          <Legend mode={state.mode} />
        </div>
      )}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-auto p-2 md:p-4">
        <SeatingSvg
          ref={svgRef}
          tables={result.tables}
          state={state}
          width={Math.min(1200, typeof window !== 'undefined' ? window.innerWidth - 32 : 800)}
          height={500}
        />
      </div>
      <button onClick={onExport} disabled={exporting}
        className="w-full bg-stone-700 hover:bg-stone-800 disabled:opacity-50 text-white font-semibold py-2.5 rounded-2xl transition-colors text-sm">
        {exporting ? '保存中...' : 'PNG で保存 📥'}
      </button>
      {generateCount !== null && (
        <p className="text-center text-xs text-stone-400 mt-1">
          🪑 これまでに{' '}
          <span className="font-bold text-amber-500">
            {generateCount.toLocaleString()}
          </span>{' '}
          回、席次が作られました
        </p>
      )}
    </div>
  );
}
