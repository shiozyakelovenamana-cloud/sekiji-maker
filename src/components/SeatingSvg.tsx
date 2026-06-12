import React, { forwardRef, useMemo } from 'react';
import { TableData, Seat, ROLE_COLOR, AppState, Direction } from '../types';
import { calcDrawTable, DrawSeat } from '../logic/drawLayout';

interface Props { tables: TableData[]; state: AppState; width?: number; height?: number; }

const MARGIN = 40;

function SeatBox({ ds, showScore }: { ds: DrawSeat; showScore: boolean }) {
  const { seat: s, svgX: x, svgY: y, seatW: w, seatH: h } = ds;
  const hw = w / 2, hh = h / 2;
  const bg     = s.isEmpty ? '#f1f5f9' : s.role ? `${ROLE_COLOR[s.role]}1a` : '#f8fafc';
  const border = s.isEmpty ? '#e2e8f0' : s.role ? ROLE_COLOR[s.role] : '#cbd5e1';
  const tc     = s.isEmpty ? '#cbd5e1' : s.role ? ROLE_COLOR[s.role] : '#94a3b8';
  const fs     = s.label.length > 3 ? 9 : s.label.length > 2 ? 10 : 12;
  return (
    <g>
      <rect x={x-hw} y={y-hh} width={w} height={h} rx={5} fill={bg} stroke={border} strokeWidth={1.5} />
      <text x={x} y={y+1} textAnchor="middle" dominantBaseline="middle" fontSize={fs} fill={tc}
        fontWeight="normal" fontFamily="'Noto Sans JP','Yu Gothic UI',sans-serif">
        {s.label}
      </text>
      {showScore && !s.isEmpty && (
        <text x={x+hw-2} y={y-hh+9} textAnchor="end" fontSize={7} fill="#818cf8">{s.finalScore}</text>
      )}
    </g>
  );
}

function TableGroup({ table, ox, oy, showScore, showTableRank }: {
  table: TableData; ox: number; oy: number; showScore: boolean; showTableRank: boolean;
}) {
  const draw = useMemo(() => calcDrawTable(table.seats, table.layoutType), [table]);
  return (
    <g transform={`translate(${ox},${oy})`}>
      {draw.tableRects.map((r, i) => (
        <rect key={i} x={r.x} y={r.y} width={r.w} height={r.h}
          rx={r.isRound ? Math.min(r.w, r.h) / 2 : 6}
          fill="#e2e8f0" stroke="#cbd5e1" strokeWidth={1.5} />
      ))}
      {showTableRank && (
        <text x={6} y={16} fontSize={11} fill="#818cf8" fontWeight="bold"
          fontFamily="'Noto Sans JP',sans-serif">卓{table.tableRank}</text>
      )}
      {table.layoutType === 'taxi' && <TaxiBg w={draw.tableW} h={draw.tableH} />}
      {table.layoutType === 'elevator' && <ElevBg w={draw.tableW} h={draw.tableH} />}
      {draw.seats.map(ds => <SeatBox key={ds.id} ds={ds} showScore={showScore} />)}
    </g>
  );
}

function TaxiBg({ w, h }: { w: number; h: number }) {
  const cx = w / 2;
  return <g>
    <rect x={10} y={10} width={w-20} height={h-20} rx={18} fill="#f0f4f8" stroke="#94a3b8" strokeWidth={1.5} />
    <rect x={cx+4} y={22} width={48} height={26} rx={4} fill="#e2e8f0" stroke="#94a3b8" strokeWidth={1} />
    <text x={cx+28} y={39} textAnchor="middle" fontSize={8} fill="#64748b">運転席</text>
    <text x={cx-28} y={39} textAnchor="middle" fontSize={8} fill="#94a3b8">助手席</text>
    <text x={cx} y={h-10} textAnchor="middle" fontSize={9} fill="#64748b">後部（出入口）</text>
  </g>;
}

function ElevBg({ w, h }: { w: number; h: number }) {
  const cx = w / 2;
  return <g>
    <rect x={8} y={8} width={w-16} height={h-16} rx={8} fill="#f0f4f8" stroke="#94a3b8" strokeWidth={1.5} />
    <rect x={cx-20} y={h-24} width={40} height={10} rx={3} fill="#cbd5e1" />
    <text x={cx} y={h-6} textAnchor="middle" fontSize={9} fill="#64748b">出入口</text>
    <rect x={w-26} y={h/2-18} width={12} height={36} rx={3} fill="#e2e8f0" stroke="#94a3b8" strokeWidth={1} />
  </g>;
}

// 方向ラベル（出入口・床の間）
function DirLabel({ dir, label, totalW, totalH, isTokonoma, offset = 0 }: {
  dir: Direction; label: string; totalW: number; totalH: number;
  isTokonoma?: boolean; offset?: number;
}) {
  const W = label.length * 13 + 16;
  const H = 22;
  const bg    = isTokonoma ? '#fef3c7' : '#fee2e2';
  const color = isTokonoma ? '#92400e' : '#dc2626';
  const bord  = isTokonoma ? '#f59e0b' : '#fca5a5';

  // offset: 床の間と出入口が同方向に重なる場合にずらす
  const cx = totalW / 2 + (dir === 'top' || dir === 'bottom' ? offset : 0);
  const cy = totalH / 2 + (dir === 'left' || dir === 'right' ? offset : 0);

  if (dir === 'top') return <g>
    <rect x={cx-W/2} y={4} width={W} height={H} rx={4} fill={bg} stroke={bord} strokeWidth={1}/>
    <text x={cx} y={18} textAnchor="middle" fontSize={12} fill={color} fontWeight="bold" fontFamily="'Noto Sans JP',sans-serif">{label}</text>
  </g>;
  if (dir === 'bottom') return <g>
    <rect x={cx-W/2} y={totalH-H-4} width={W} height={H} rx={4} fill={bg} stroke={bord} strokeWidth={1}/>
    <text x={cx} y={totalH-8} textAnchor="middle" fontSize={12} fill={color} fontWeight="bold" fontFamily="'Noto Sans JP',sans-serif">{label}</text>
  </g>;
  if (dir === 'left') return <g>
    <rect x={4} y={cy-W/2} width={H} height={W} rx={4} fill={bg} stroke={bord} strokeWidth={1}/>
    <text x={4+H/2} y={cy} textAnchor="middle" fontSize={12} fill={color} fontWeight="bold" fontFamily="'Noto Sans JP',sans-serif" transform={`rotate(-90,${4+H/2},${cy})`}>{label}</text>
  </g>;
  return <g>
    <rect x={totalW-H-4} y={cy-W/2} width={H} height={W} rx={4} fill={bg} stroke={bord} strokeWidth={1}/>
    <text x={totalW-H/2-4} y={cy} textAnchor="middle" fontSize={12} fill={color} fontWeight="bold" fontFamily="'Noto Sans JP',sans-serif" transform={`rotate(90,${totalW-H/2-4},${cy})`}>{label}</text>
  </g>;
}

// 正面ラベル（正面方向に合わせて表示）
function FrontLabel({ front, totalW, totalH }: { front: Direction; totalW: number; totalH: number }) {
  const W = 64; const H = 22;
  const bg = '#dbeafe'; const color = '#1e40af';
  if (front === 'top') return <g>
    <rect x={totalW/2-W/2} y={4} width={W} height={H} rx={5} fill={bg}/>
    <text x={totalW/2} y={19} textAnchor="middle" fontSize={13} fill={color} fontWeight="bold" fontFamily="'Noto Sans JP',sans-serif">正面</text>
  </g>;
  if (front === 'bottom') return <g>
    <rect x={totalW/2-W/2} y={totalH-H-4} width={W} height={H} rx={5} fill={bg}/>
    <text x={totalW/2} y={totalH-8} textAnchor="middle" fontSize={13} fill={color} fontWeight="bold" fontFamily="'Noto Sans JP',sans-serif">正面</text>
  </g>;
  if (front === 'left') return <g>
    <rect x={4} y={totalH/2-W/2} width={H} height={W} rx={5} fill={bg}/>
    <text x={4+H/2} y={totalH/2} textAnchor="middle" fontSize={13} fill={color} fontWeight="bold" fontFamily="'Noto Sans JP',sans-serif" transform={`rotate(-90,${4+H/2},${totalH/2})`}>正面</text>
  </g>;
  return <g>
    <rect x={totalW-H-4} y={totalH/2-W/2} width={H} height={W} rx={5} fill={bg}/>
    <text x={totalW-H/2-4} y={totalH/2} textAnchor="middle" fontSize={13} fill={color} fontWeight="bold" fontFamily="'Noto Sans JP',sans-serif" transform={`rotate(90,${totalW-H/2-4},${totalH/2})`}>正面</text>
  </g>;
}

export const SeatingSvg = forwardRef<SVGSVGElement, Props>(
  ({ tables, state, width = 900, height = 620 }, ref) => {
    const { venue, layout, debugShowScore, debugShowTableRank } = state;
    const door: Direction  = layout.type === 'elevator' ? 'bottom' : venue.door;
    const front: Direction = layout.type === 'japanese'
      ? (layout.config as any).tokonoma : venue.front;

    const isTaxi     = layout.type === 'taxi';
    const isCounter  = layout.type === 'counter';
    const isJapanese = layout.type === 'japanese';
    const hideDirectionLabels = isTaxi || isCounter;

    const drawTables = useMemo(() =>
      tables.map(t => ({ table: t, draw: calcDrawTable(t.seats, t.layoutType) })),
      [tables]
    );

    const cols  = Math.max(1, venue.tablesPerRow || 1);
    const maxW  = Math.max(...drawTables.map(d => d.draw.tableW), 100);
    const maxH  = Math.max(...drawTables.map(d => d.draw.tableH), 80);
    const gridW = cols * (maxW + MARGIN) + MARGIN;
    const gridH = Math.ceil(tables.length / cols) * (maxH + MARGIN) + MARGIN;

    // 各方向に必要なパディング（ラベル表示用）
    const pad = (dir: Direction) => {
      if (isTaxi) return 0; // タクシーはラベルなし
      if (isJapanese && dir === front) return 28; // 床の間ラベル
      if (dir === door) return 28;
      if (!isTaxi && dir === front) return 28;
      return 0;
    };

    const padTop    = Math.max(pad('top'),    8);
    const padBottom = pad('bottom');
    const padLeft   = pad('left');
    const padRight  = pad('right');

    const totalW = gridW + padLeft + padRight;
    const totalH = gridH + padTop + padBottom;
    const offX   = padLeft;
    const offY   = padTop;

    // 床の間と出入口が同方向の場合にずらすオフセット
    const tokonomaOffset = (isJapanese && front === door) ? 40 : 0;

    return (
      <svg ref={ref} viewBox={`0 0 ${totalW} ${totalH}`} width={width} height={height}
        style={{ maxWidth: '100%', background: 'white', display: 'block' }}
        xmlns="http://www.w3.org/2000/svg">
        <rect width={totalW} height={totalH} fill="white" />

        {/* 正面ラベル（タクシー・カウンター・和室では非表示） */}
        {!hideDirectionLabels && !isJapanese && (
          <FrontLabel front={front} totalW={totalW} totalH={totalH} />
        )}

        {/* 出入口ラベル（タクシー・カウンターでは非表示） */}
        {!hideDirectionLabels && (
          <DirLabel dir={door} label="出入口" totalW={totalW} totalH={totalH} />
        )}

        {/* 床の間ラベル（和室のみ）: 出入口と同方向の場合は横にずらす */}
        {isJapanese && (
          <DirLabel dir={front} label="床の間" totalW={totalW} totalH={totalH}
            isTokonoma offset={front === door ? tokonomaOffset : 0} />
        )}

        {/* 卓グループ */}
        {drawTables.map(({ table }, i) => {
          const col = i % cols;
          const row = Math.floor(i / cols);
          const ox = offX + MARGIN + col * (maxW + MARGIN);
          const oy = offY + MARGIN + row * (maxH + MARGIN);
          return (
            <TableGroup key={table.tableIndex} table={table} ox={ox} oy={oy}
              showScore={debugShowScore ?? false}
              showTableRank={debugShowTableRank ?? false} />
          );
        })}
      </svg>
    );
  }
);
SeatingSvg.displayName = 'SeatingSvg';
