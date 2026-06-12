import { formatMoney, formatPollen } from './costs';
import type { RoiSummary } from './ledger/roi';

/**
 * Renders the shareable "harvest receipt" — a 1080×1350 card in the
 * Cashflower ledger style — onto a canvas and returns it as a PNG blob.
 */
export async function renderReceipt(summary: RoiSummary, projectCount: number): Promise<Blob> {
  const W = 1080;
  const H = 1350;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;

  try {
    await Promise.all([
      (document as Document & { fonts: FontFaceSet }).fonts.load('700 90px Fraunces'),
      (document as Document & { fonts: FontFaceSet }).fonts.load('400 36px "Spline Sans Mono"'),
    ]);
  } catch {
    /* fall back to whatever is available */
  }

  // paper
  ctx.fillStyle = '#f4efe2';
  ctx.fillRect(0, 0, W, H);
  // deckle border
  ctx.strokeStyle = '#1e4d36';
  ctx.lineWidth = 6;
  ctx.strokeRect(36, 36, W - 72, H - 72);
  ctx.lineWidth = 1.5;
  ctx.strokeRect(52, 52, W - 104, H - 104);

  ctx.textAlign = 'center';
  ctx.fillStyle = '#1e4d36';
  ctx.font = '400 30px "Spline Sans Mono", monospace';
  ctx.fillText('CASHFLOWER · HARVEST RECEIPT', W / 2, 140);

  ctx.font = '36px Fraunces, serif';
  ctx.fillStyle = '#6b5d40';
  ctx.fillText(new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }), W / 2, 196);

  rule(ctx, 260);

  ctx.fillStyle = '#1c2a21';
  ctx.font = '400 34px "Spline Sans Mono", monospace';
  ctx.fillText('POLLEN PLANTED', W / 2, 340);
  ctx.font = '700 84px Fraunces, serif';
  ctx.fillText(`${formatPollen(summary.spent)} ≈ ${formatMoney(summary.spent)}`, W / 2, 430);

  ctx.font = '400 34px "Spline Sans Mono", monospace';
  ctx.fillText('INCOME HARVESTED', W / 2, 560);
  ctx.fillStyle = '#1e4d36';
  ctx.font = '700 110px Fraunces, serif';
  ctx.fillText(formatMoney(summary.earned), W / 2, 670);

  rule(ctx, 760);

  if (summary.multiplier !== null && summary.multiplier >= 1) {
    ctx.fillStyle = '#b8892b';
    ctx.font = '700 150px Fraunces, serif';
    ctx.fillText(`${summary.multiplier.toLocaleString()}×`, W / 2, 940);
    ctx.fillStyle = '#1c2a21';
    ctx.font = '400 34px "Spline Sans Mono", monospace';
    ctx.fillText('RETURN ON EVERY POLLEN SPENT', W / 2, 1000);
  } else {
    ctx.fillStyle = '#1c2a21';
    ctx.font = 'italic 48px Fraunces, serif';
    ctx.fillText('Seeds in the ground.', W / 2, 940);
  }

  ctx.font = '400 30px "Spline Sans Mono", monospace';
  ctx.fillStyle = '#6b5d40';
  ctx.fillText(`${projectCount} project${projectCount === 1 ? '' : 's'} · grown with my own pollen`, W / 2, 1110);

  rule(ctx, 1180);
  ctx.fillStyle = '#1e4d36';
  ctx.font = '400 32px "Spline Sans Mono", monospace';
  ctx.fillText('cashflower.cru2.net · powered by pollinations.ai', W / 2, 1250);

  return new Promise((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('canvas export failed'))), 'image/png');
  });
}

function rule(ctx: CanvasRenderingContext2D, y: number): void {
  ctx.save();
  ctx.strokeStyle = '#1c2a21';
  ctx.globalAlpha = 0.35;
  ctx.setLineDash([2, 6]);
  ctx.beginPath();
  ctx.moveTo(120, y);
  ctx.lineTo(960, y);
  ctx.stroke();
  ctx.restore();
}
