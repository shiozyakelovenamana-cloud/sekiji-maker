// ============================================================
// PNG出力ユーティリティ
// SVG → Canvas → PNG (A4横: 3508×2480px)
// ============================================================
export interface PngExportOptions {
  svgElement: SVGSVGElement;
  title: string;
  date: string;
  venue: string;
  mode: string;
  layout: string;
}

const PNG_WIDTH = 3508;
const PNG_HEIGHT = 2480;
const MIN_FONT = 8;

export async function exportToPng(options: PngExportOptions, filename: string): Promise<void> {
  const { svgElement, title, date, venue, mode, layout } = options;

  const serializer = new XMLSerializer();
  const svgStr = serializer.serializeToString(svgElement);
  const svgBlob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' });
  const svgUrl = URL.createObjectURL(svgBlob);
  const img = new Image();
  img.src = svgUrl;
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = reject;
  });

  const canvas = document.createElement('canvas');
  canvas.width = PNG_WIDTH;
  canvas.height = PNG_HEIGHT;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, PNG_WIDTH, PNG_HEIGHT);

  const headerH = 160;
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(0, 0, PNG_WIDTH, headerH);

  const titleFontSize = Math.max(MIN_FONT, 72);
  ctx.font = `bold ${titleFontSize}px "Noto Serif JP", serif`;
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.fillText(title || '席次表', PNG_WIDTH / 2, 90);

  const subFontSize = Math.max(MIN_FONT, 40);
  ctx.font = `${subFontSize}px "Noto Sans JP", sans-serif`;
  ctx.fillStyle = '#94a3b8';
  const subText = [date, venue, `${mode}モード`, layout].filter(Boolean).join('　|　');
  ctx.fillText(subText, PNG_WIDTH / 2, 140);

  const svgArea = { x: 40, y: headerH + 20, w: PNG_WIDTH - 80, h: PNG_HEIGHT - headerH - 40 };
  const svgW = svgElement.viewBox.baseVal.width || svgElement.clientWidth;
  const svgH = svgElement.viewBox.baseVal.height || svgElement.clientHeight;
  const scale = Math.min(svgArea.w / svgW, svgArea.h / svgH);
  const drawW = svgW * scale;
  const drawH = svgH * scale;
  const drawX = svgArea.x + (svgArea.w - drawW) / 2;
  const drawY = svgArea.y + (svgArea.h - drawH) / 2;
  ctx.drawImage(img, drawX, drawY, drawW, drawH);
  URL.revokeObjectURL(svgUrl);

  // ダウンロードリンク方式（PC・スマホ共通）
  const dataUrl = canvas.toDataURL('image/png');
  const link = document.createElement('a');
  link.download = filename;
  link.href = dataUrl;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function buildFilename(title: string, date: string): string {
  const safeName = title.replace(/[^\w\u3000-\u9fff\u30a0-\u30ff\u3040-\u309f]/g, '_') || '席次表';
  const safeDate = date.replace(/-/g, '') || new Date().toISOString().slice(0, 10).replace(/-/g, '');
  return `席次表_${safeName}_${safeDate}.png`;
}
