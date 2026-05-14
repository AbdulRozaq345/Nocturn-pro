// Generator artwork dinamis buat Media Session notification (OS-level).
// Bikin tiap track punya cover unik dengan tema neon cyberpunk Nocturn,
// di-cache supaya gak regenerate tiap kali.

type Track = {
  id?: string | number;
  title?: string;
  artist?: string;
  [key: string]: any;
};

const NEON = "#72fe8f";
const cache = new Map<string, string>();

function cacheKeyFor(track: Track) {
  return `${track?.id ?? "x"}::${track?.title ?? ""}::${track?.artist ?? ""}`;
}

function drawCornerBrackets(
  ctx: CanvasRenderingContext2D,
  size: number,
  margin: number,
  bracket: number,
) {
  ctx.strokeStyle = "rgba(114, 254, 143, 0.55)";
  ctx.lineWidth = 3;
  ctx.lineCap = "round";

  // TL
  ctx.beginPath();
  ctx.moveTo(margin, margin + bracket);
  ctx.lineTo(margin, margin);
  ctx.lineTo(margin + bracket, margin);
  ctx.stroke();
  // TR
  ctx.beginPath();
  ctx.moveTo(size - margin - bracket, margin);
  ctx.lineTo(size - margin, margin);
  ctx.lineTo(size - margin, margin + bracket);
  ctx.stroke();
  // BL
  ctx.beginPath();
  ctx.moveTo(margin, size - margin - bracket);
  ctx.lineTo(margin, size - margin);
  ctx.lineTo(margin + bracket, size - margin);
  ctx.stroke();
  // BR
  ctx.beginPath();
  ctx.moveTo(size - margin - bracket, size - margin);
  ctx.lineTo(size - margin, size - margin);
  ctx.lineTo(size - margin, size - margin - bracket);
  ctx.stroke();
}

function fitText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  startSize: number,
  minSize: number,
  fontTemplate: (size: number) => string,
) {
  let size = startSize;
  ctx.font = fontTemplate(size);
  while (ctx.measureText(text).width > maxWidth && size > minSize) {
    size -= 2;
    ctx.font = fontTemplate(size);
  }
  let display = text;
  if (ctx.measureText(display).width > maxWidth) {
    while (
      ctx.measureText(display + "…").width > maxWidth &&
      display.length > 0
    ) {
      display = display.slice(0, -1);
    }
    display = display + "…";
  }
  return display;
}

// Seeded pseudo-random pattern dari string biar bar waveform tiap track unik & stabil
function seededHeights(seed: string, count: number) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  }
  const out: number[] = [];
  let s = h || 1;
  for (let i = 0; i < count; i++) {
    s = (s * 1664525 + 1013904223) >>> 0;
    out.push(8 + (s % 36));
  }
  return out;
}

export function generateMediaArtwork(track: Track, size = 512): string | null {
  if (typeof document === "undefined") return null;
  const key = cacheKeyFor(track);
  const cached = cache.get(key);
  if (cached) return cached;

  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  // ─── Background gradient
  const bg = ctx.createLinearGradient(0, 0, 0, size);
  bg.addColorStop(0, "#050505");
  bg.addColorStop(0.6, "#070b09");
  bg.addColorStop(1, "#0a1812");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, size, size);

  // ─── Radial neon glow (kiri-atas → tengah)
  const glowX = size * 0.35;
  const glowY = size * 0.45;
  const glow = ctx.createRadialGradient(
    glowX,
    glowY,
    0,
    glowX,
    glowY,
    size * 0.7,
  );
  glow.addColorStop(0, "rgba(114, 254, 143, 0.22)");
  glow.addColorStop(0.55, "rgba(114, 254, 143, 0.06)");
  glow.addColorStop(1, "rgba(114, 254, 143, 0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, size, size);

  // ─── Diagonal stripes (subtle texture)
  ctx.strokeStyle = "rgba(114, 254, 143, 0.05)";
  ctx.lineWidth = 1;
  for (let i = -size; i < size * 2; i += 14) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i + size, size);
    ctx.stroke();
  }

  // ─── Horizontal scanlines (very subtle)
  ctx.fillStyle = "rgba(255, 255, 255, 0.015)";
  for (let y = 0; y < size; y += 3) {
    ctx.fillRect(0, y, size, 1);
  }

  // ─── Corner brackets
  drawCornerBrackets(ctx, size, 32, 36);

  // ─── Top: "// NOW PLAYING" tag
  ctx.fillStyle = NEON;
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.font = "bold 16px ui-monospace, Menlo, Consolas, monospace";
  ctx.fillText("// NOW PLAYING", size / 2, 92);

  // Tag underline
  ctx.fillStyle = "rgba(114, 254, 143, 0.4)";
  ctx.fillRect(size / 2 - 60, 102, 120, 2);

  // ─── NOCTURN brand
  ctx.fillStyle = "rgba(255, 255, 255, 0.92)";
  ctx.font = "bold 22px ui-monospace, Menlo, Consolas, monospace";
  ctx.fillText("N O C T U R N", size / 2, 138);

  // ─── Title (big, italic, uppercase)
  const title = (track.title || "UNKNOWN TITLE").toUpperCase();
  const displayTitle = fitText(
    ctx,
    title,
    size - 80,
    62,
    24,
    (s) => `900 italic ${s}px Inter, system-ui, sans-serif`,
  );
  ctx.shadowColor = "rgba(114, 254, 143, 0.55)";
  ctx.shadowBlur = 18;
  ctx.fillStyle = "#ffffff";
  ctx.fillText(displayTitle, size / 2, size * 0.52);
  ctx.shadowBlur = 0;

  // Separator
  ctx.fillStyle = NEON;
  ctx.fillRect(size / 2 - 18, size * 0.55, 36, 3);

  // ─── Artist
  const artist = (track.artist || "UNKNOWN ARTIST").toUpperCase();
  const displayArtist = fitText(
    ctx,
    artist,
    size - 100,
    20,
    12,
    (s) =>
      `bold ${s}px ui-monospace, Menlo, Consolas, monospace`,
  );
  ctx.fillStyle = NEON;
  ctx.fillText(displayArtist, size / 2, size * 0.62);

  // ─── Waveform decoration
  const heights = seededHeights(displayTitle + displayArtist, 36);
  const barWidth = 5;
  const barGap = 4;
  const totalBarWidth = heights.length * (barWidth + barGap) - barGap;
  const startX = (size - totalBarWidth) / 2;
  const baseY = size * 0.78;
  for (let i = 0; i < heights.length; i++) {
    const h = heights[i] * (1 + Math.sin(i * 0.4) * 0.15);
    const x = startX + i * (barWidth + barGap);
    // Glow
    ctx.fillStyle = "rgba(114, 254, 143, 0.25)";
    ctx.fillRect(x - 1, baseY - h - 1, barWidth + 2, h + 2);
    // Solid bar
    const grad = ctx.createLinearGradient(0, baseY - h, 0, baseY);
    grad.addColorStop(0, NEON);
    grad.addColorStop(1, "rgba(114, 254, 143, 0.55)");
    ctx.fillStyle = grad;
    ctx.fillRect(x, baseY - h, barWidth, h);
  }

  // Waveform baseline
  ctx.fillStyle = "rgba(114, 254, 143, 0.18)";
  ctx.fillRect(40, baseY + 2, size - 80, 1);

  // ─── Bottom signature
  ctx.fillStyle = "rgba(160, 160, 170, 0.55)";
  ctx.font = "11px ui-monospace, Menlo, Consolas, monospace";
  ctx.fillText("HIGH-FIDELITY • LIVE SESSION", size / 2, size - 56);

  // Bottom status dots
  const dotY = size - 38;
  const dotSize = 4;
  for (let i = 0; i < 3; i++) {
    ctx.fillStyle =
      i === 0 ? NEON : "rgba(114, 254, 143, 0.25)";
    ctx.beginPath();
    ctx.arc(size / 2 - 16 + i * 16, dotY, dotSize, 0, Math.PI * 2);
    ctx.fill();
  }

  const url = canvas.toDataURL("image/png");
  cache.set(key, url);
  return url;
}
