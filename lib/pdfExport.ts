/**
 * pdfExport.ts
 * Generates a print-ready PDF from a Book using expo-print + expo-sharing.
 * The HTML layout mirrors the book-viewer: warm paper cover + one page per day.
 */

import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
import { monthLabel, formatFullDate, bookDisplayName } from './data';
import { getCategoryById } from '@/constants/categories';
import type { Book, DayLog, Entry } from './data';

// ─── Palette (warm paper, matches light theme) ────────────────────────────────

const PAPER   = '#F7F4EF';
const INK     = '#1C1916';
const MUTED   = '#7A746E';
const PRIMARY = '#E8593A';
const CARD    = '#FFFFFF';
const BORDER  = 'rgba(0,0,0,0.08)';
const MARGIN  = 'rgba(232,89,58,0.35)';

// ─── Cover palettes (matches BookCover.tsx) ───────────────────────────────────

const COVER_PALETTES = [
  { bg: '#2C3E6B', fg: '#FFFFFF', accent: '#F4C27A' },
  { bg: '#4A3728', fg: '#F7EDD8', accent: '#E8593A' },
  { bg: '#1E3A2F', fg: '#E8F5EF', accent: '#7EC8A0' },
  { bg: '#3B2A4E', fg: '#F0EBF8', accent: '#C27AE8' },
  { bg: '#5C2A2A', fg: '#FAE8E8', accent: '#F4A0A0' },
  { bg: '#1E3A4A', fg: '#E8F4FA', accent: '#7AC8E8' },
  { bg: '#3A3A1E', fg: '#F4F4E8', accent: '#C8C87A' },
  { bg: '#2A3A2A', fg: '#EAF4EA', accent: '#7AE87A' },
];

function coverPalette(book: Book) {
  if (book.coverColor) {
    return { bg: book.coverColor, fg: '#FFFFFF', accent: '#F4C27A' };
  }
  let hash = 0;
  for (let i = 0; i < book.monthKey.length; i++) {
    hash = (hash * 31 + book.monthKey.charCodeAt(i)) % COVER_PALETTES.length;
  }
  return COVER_PALETTES[hash];
}

// ─── Image & Asset preparation ───────────────────────────────────────────────

async function toBase64DataUri(uri: string): Promise<string> {
  if (!uri) return '';
  if (uri.startsWith('data:') || uri.startsWith('http://') || uri.startsWith('https://')) {
    return uri;
  }
  try {
    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    const lower = uri.toLowerCase();
    const mime = lower.endsWith('.png')
      ? 'image/png'
      : lower.endsWith('.webp')
      ? 'image/webp'
      : 'image/jpeg';
    return `data:${mime};base64,${base64}`;
  } catch (err) {
    console.warn('[PDF] Failed to convert local image to base64 data URI:', uri, err);
    return uri;
  }
}

async function prepareBookForExport(book: Book): Promise<Book> {
  const newDays = await Promise.all(
    book.days.map(async day => {
      const newEntries = await Promise.all(
        day.entries.map(async entry => {
          if (!entry.photos || entry.photos.length === 0) return entry;
          const newPhotos = await Promise.all(entry.photos.map(p => toBase64DataUri(p)));
          return { ...entry, photos: newPhotos };
        }),
      );
      const newExtras = await Promise.all(
        day.extras.map(async extra => {
          if (!extra.photos || extra.photos.length === 0) return extra;
          const newPhotos = await Promise.all(extra.photos.map(p => toBase64DataUri(p)));
          return { ...extra, photos: newPhotos };
        }),
      );
      return { ...day, entries: newEntries, extras: newExtras };
    }),
  );
  return { ...book, days: newDays };
}

// ─── HTML helpers ─────────────────────────────────────────────────────────────

function entryHtml(entry: Entry, slot: number): string {
  const cat = getCategoryById(entry.category);
  const photos = entry.photos ?? [];
  const photo = photos[0];
  return `
    <div class="entry-card">
      <div class="entry-media-wrap">
        ${photo
          ? `<img class="entry-photo" src="${photo}" />`
          : `<div class="entry-empty-photo">
               <span class="entry-empty-num">0${slot}</span>
               <span class="entry-empty-label">${escHtml(cat.label)}</span>
             </div>`
        }
        <div class="entry-cat-badge" style="background:${cat.color}22;border-color:${cat.color}66;color:${cat.color}">
          ${escHtml(cat.label)}
        </div>
      </div>
      <div class="entry-meta">
        <span class="entry-num">MOMENT 0${slot}</span>
      </div>
      <p class="entry-caption">${entry.text ? escHtml(entry.text) : '—'}</p>
    </div>`;
}

function emptySlotHtml(slot: number): string {
  return `
    <div class="entry-card empty">
      <div class="entry-empty-content">
        <span class="entry-empty-num">0${slot}</span>
        <span class="entry-empty-label">Unrecorded Moment</span>
      </div>
    </div>`;
}

function dayPageHtml(day: DayLog, book: Book): string {
  const slots = Array.from({ length: 4 }, (_, i) => day.entries[i] ?? null);
  const hasExtras = day.extras.length > 0;
  return `
    <div class="page day-page">
      <div class="margin-rule"></div>
      <div class="day-content">
        <div class="day-header">
          <div class="day-header-left">
            <span class="day-eyebrow">DEAR DAY ARCHIVAL RECORD</span>
            <h2 class="day-date">${formatFullDate(day.date)}</h2>
          </div>
          <div class="day-header-right">
            <span class="day-seal">❖</span>
          </div>
        </div>

        <div class="slots-grid">
          ${slots.map((e, i) => e ? entryHtml(e, i + 1) : emptySlotHtml(i + 1)).join('')}
        </div>

        <div class="day-footer">
          ${hasExtras
            ? `<span class="extras-note">+${day.extras.length} extra moment${day.extras.length > 1 ? 's' : ''} in diary vault</span>`
            : `<span class="day-footer-text">Archival Cotton Press · Dear Day</span>`
          }
          ${book.locked ? `<span class="locked-badge">🔒 Locked Volume</span>` : ''}
        </div>
      </div>
    </div>`;
}

function coverPageHtml(book: Book): string {
  const pal   = coverPalette(book);
  const label = bookDisplayName(book);
  const hidden = book.hiddenDays ?? [];
  const activeDays = book.days.filter(d => d.entries.length > 0 && !hidden.includes(d.date)).length;
  const totalMoments = book.days
    .filter(d => !hidden.includes(d.date))
    .reduce((s, d) => s + d.entries.length, 0);

  return `
    <div class="page cover-page" style="background:${pal.bg};">
      <div class="cover-spine" style="background:${pal.accent};"></div>
      <div class="cover-body">
        <div class="cover-dots">
          ${Array.from({ length: 16 }, (_, i) =>
            `<div class="dot" style="opacity:${0.08 + (i % 4) * 0.05};background:${pal.fg}"></div>`
          ).join('')}
        </div>
        <p class="cover-app" style="color:${pal.accent}">Dear Day</p>
        <h1 class="cover-title" style="color:${pal.fg}">${label}</h1>
        <p class="cover-meta" style="color:${pal.fg}88">
          ${activeDays} days · ${totalMoments} moments
          ${book.locked ? ' · Locked' : ''}
        </p>
        <div class="cover-rule" style="background:${pal.accent}55"></div>
      </div>
    </div>`;
}

function colophonPageHtml(book: Book): string {
  return `
    <div class="page colophon-page">
      <div class="colophon-inner">
        <div class="colophon-seal">❖</div>
        <h3 class="colophon-press">DEAR DAY ARCHIVAL PRESS</h3>
        <p class="colophon-volume">${escHtml(bookDisplayName(book))}</p>
        <div class="colophon-rule"></div>
        <p class="colophon-text">Archival First Edition · Acid-Free Cotton Paper Finish</p>
        <p class="colophon-text">Bound for a lifetime of remembering</p>
        <p class="colophon-quote">“The unexamined life is not worth living; the unremembered day is lost.”</p>
        <p class="colophon-sub">Preserved with Dear Day · app.daily5.android</p>
      </div>
    </div>`;
}

// ─── Full HTML document ───────────────────────────────────────────────────────

function buildHtml(book: Book, includeColophon: boolean = true): string {
  const hidden = book.hiddenDays ?? [];
  const sortedDays = [...book.days]
    .filter(d => d.entries.length > 0 && !hidden.includes(d.date))
    .sort((a, b) => a.date.localeCompare(b.date));

  const pageItems = [
    coverPageHtml(book),
    ...sortedDays.map(d => dayPageHtml(d, book)),
  ];

  if (includeColophon && sortedDays.length > 0) {
    pageItems.push(colophonPageHtml(book));
  }

  const pages = pageItems.join('\n');

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${bookDisplayName(book)} — Dear Day</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=Inter:wght@400;500;700&display=swap');

  * { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    font-family: 'Inter', sans-serif;
    background: ${PAPER};
    color: ${INK};
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  /* ── Page shell ── */
  .page {
    width: 210mm;
    min-height: 297mm;
    page-break-after: always;
    position: relative;
    overflow: hidden;
    background: ${PAPER};
  }

  /* ── Cover ── */
  .cover-page {
    display: flex;
    flex-direction: row;
  }
  .cover-spine {
    width: 14mm;
    flex-shrink: 0;
  }
  .cover-body {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    padding: 24mm 20mm;
    gap: 8mm;
    position: relative;
  }
  .cover-dots {
    position: absolute;
    top: 12mm; right: 12mm;
    display: grid;
    grid-template-columns: repeat(5, 6mm);
    gap: 3mm;
  }
  .dot {
    width: 4mm;
    height: 4mm;
    border-radius: 50%;
  }
  .cover-app {
    font-family: 'Inter', sans-serif;
    font-weight: 500;
    font-size: 11pt;
    letter-spacing: 0.15em;
    text-transform: uppercase;
  }
  .cover-title {
    font-family: 'Playfair Display', serif;
    font-size: 38pt;
    line-height: 1.15;
    letter-spacing: 0.01em;
  }
  .cover-meta {
    font-family: 'Inter', sans-serif;
    font-size: 11pt;
  }
  .cover-rule {
    width: 48mm;
    height: 1.5px;
    margin-top: 4mm;
  }

  /* ── Day page ── */
  .day-page {
    display: flex;
    flex-direction: row;
    height: 297mm;
    max-height: 297mm;
    page-break-after: always;
  }
  .margin-rule {
    width: 12mm;
    flex-shrink: 0;
    background: ${MARGIN};
    opacity: 0.35;
  }
  .day-content {
    flex: 1;
    padding: 14mm 16mm 14mm 14mm;
    display: flex;
    flex-direction: column;
    height: 297mm;
    box-sizing: border-box;
    justify-content: space-between;
  }
  .day-header {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: flex-end;
    border-bottom: 0.75pt solid ${BORDER};
    padding-bottom: 3.5mm;
    margin-bottom: 4mm;
  }
  .day-eyebrow {
    font-family: 'Inter', sans-serif;
    font-size: 7.5pt;
    font-weight: 700;
    letter-spacing: 0.12em;
    color: ${PRIMARY};
    text-transform: uppercase;
    display: block;
    margin-bottom: 1.5mm;
  }
  .day-date {
    font-family: 'Playfair Display', serif;
    font-size: 20pt;
    color: ${INK};
    line-height: 1.1;
  }
  .day-seal {
    font-size: 14pt;
    color: ${PRIMARY};
    opacity: 0.6;
  }

  /* ── 2x2 Grid ── */
  .slots-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    grid-template-rows: 1fr 1fr;
    gap: 6mm;
    flex: 1;
    margin-bottom: 3mm;
  }
  .entry-card {
    display: flex;
    flex-direction: column;
    background: #FFFFFF;
    border: 0.5pt solid ${BORDER};
    border-radius: 4mm;
    padding: 3.5mm;
    gap: 2.5mm;
    overflow: hidden;
    box-sizing: border-box;
  }
  .entry-card.empty {
    background: transparent;
    border: 0.5pt dashed ${BORDER};
    opacity: 0.35;
    justify-content: center;
    align-items: center;
  }
  .entry-media-wrap {
    position: relative;
    width: 100%;
    height: 60mm;
    border-radius: 2.5mm;
    overflow: hidden;
    background: #EBE5D8;
    flex-shrink: 0;
  }
  .entry-photo {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }
  .entry-empty-photo {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 2mm;
    background: #F2EDE4;
  }
  .entry-empty-num {
    font-family: 'Inter', sans-serif;
    font-size: 13pt;
    font-weight: 700;
    color: #B5ADA4;
  }
  .entry-empty-label {
    font-family: 'Playfair Display', serif;
    font-size: 10pt;
    color: #8C827A;
  }
  .entry-cat-badge {
    position: absolute;
    top: 2.5mm;
    left: 2.5mm;
    font-family: 'Inter', sans-serif;
    font-size: 6.5pt;
    font-weight: 700;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    padding: 1mm 2.5mm;
    border-radius: 99px;
    border: 0.5pt solid;
    background: rgba(255,255,255,0.92);
  }
  .entry-meta {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
  }
  .entry-num {
    font-family: 'Inter', sans-serif;
    font-size: 7pt;
    font-weight: 700;
    letter-spacing: 0.08em;
    color: ${PRIMARY};
  }
  .entry-caption {
    font-family: 'Inter', sans-serif;
    font-size: 9pt;
    line-height: 1.45;
    color: ${INK};
    overflow: hidden;
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
  }
  .entry-empty-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2mm;
  }
  .day-footer {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    padding-top: 3mm;
    border-top: 0.5pt solid ${BORDER};
  }
  .day-footer-text, .extras-note {
    font-family: 'Inter', sans-serif;
    font-size: 7.5pt;
    color: ${MUTED};
    letter-spacing: 0.05em;
  }
  .locked-badge {
    font-family: 'Inter', sans-serif;
    font-size: 7.5pt;
    color: ${MUTED};
  }

  /* ── Colophon ── */
  .colophon-page {
    display: flex;
    align-items: center;
    justify-content: center;
    text-align: center;
    background: ${PAPER};
  }
  .colophon-inner {
    max-width: 140mm;
    padding: 24mm 16mm;
    border: 0.5pt solid ${BORDER};
    border-radius: 6mm;
    background: #FFFFFF;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4mm;
    box-shadow: 0 4px 16px rgba(0,0,0,0.04);
  }
  .colophon-seal {
    font-size: 26pt;
    color: ${PRIMARY};
  }
  .colophon-press {
    font-family: 'Inter', sans-serif;
    font-size: 11pt;
    letter-spacing: 0.2em;
    font-weight: 700;
    color: ${PRIMARY};
  }
  .colophon-volume {
    font-family: 'Playfair Display', serif;
    font-size: 20pt;
    color: ${INK};
  }
  .colophon-rule {
    width: 36mm;
    height: 1.5px;
    background: ${PRIMARY}55;
    margin: 2mm 0;
  }
  .colophon-text {
    font-family: 'Inter', sans-serif;
    font-size: 9.5pt;
    color: ${MUTED};
    line-height: 1.5;
  }
  .colophon-quote {
    font-family: 'Playfair Display', serif;
    font-style: italic;
    font-size: 11pt;
    color: ${INK};
    margin-top: 4mm;
  }
  .colophon-sub {
    font-family: 'Inter', sans-serif;
    font-size: 8.5pt;
    color: ${MUTED};
    margin-top: 2mm;
  }

  /* ── Print overrides ── */
  @page {
    size: A4 portrait;
    margin: 0;
  }
  @media print {
    .page { page-break-after: always; }
  }
</style>
</head>
<body>
${pages}
</body>
</html>`;
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Generate a PDF for the given book and return its local file URI.
 * Resolves local image paths into base64 data URIs so that Android WebViews
 * render images with 100% fidelity without security-sandbox failures.
 */
export async function generateBookPdf(book: Book, includeColophon: boolean = true): Promise<string> {
  const preparedBook = await prepareBookForExport(book);
  const html = buildHtml(preparedBook, includeColophon);
  const { uri } = await Print.printToFileAsync({ html, base64: false });
  return uri;
}

/**
 * Generate and share a PDF for the given book.
 * Formats a clean, readable filename so WhatsApp and Android share targets
 * present an archival document card with proper title and thumbnail.
 */
export async function exportBookAsPdf(book: Book): Promise<void> {
  const rawUri = await generateBookPdf(book, true);

  const safeName = (bookDisplayName(book) || 'Memories')
    .replace(/[^a-zA-Z0-9_\-\s]/g, '')
    .trim()
    .replace(/\s+/g, '_');
  const targetUri = `${FileSystem.cacheDirectory}DearDay_${safeName}.pdf`;

  try {
    await FileSystem.copyAsync({ from: rawUri, to: targetUri });
  } catch (e) {
    // Fallback to rawUri if copy fails
  }

  const fileInfo = await FileSystem.getInfoAsync(targetUri);
  const shareUri = fileInfo.exists ? targetUri : rawUri;

  const canShare = await Sharing.isAvailableAsync();
  if (canShare) {
    await Sharing.shareAsync(shareUri, {
      mimeType: 'application/pdf',
      dialogTitle: `Dear Day — ${bookDisplayName(book)}`,
      UTI: 'com.adobe.pdf',
    });
  }
}

/**
 * Generate and share a single Day memory page as an archival PDF.
 */
export async function exportDayAsPdf(day: DayLog): Promise<void> {
  const dummyBook: Book = {
    monthKey: day.date.slice(0, 7),
    locked: false,
    days: [day],
  };
  const rawUri = await generateBookPdf(dummyBook, false);

  const safeDate = day.date.replace(/[^0-9]/g, '_');
  const targetUri = `${FileSystem.cacheDirectory}DearDay_${safeDate}.pdf`;

  try {
    await FileSystem.copyAsync({ from: rawUri, to: targetUri });
  } catch (e) {
    // Fallback to rawUri if copy fails
  }

  const fileInfo = await FileSystem.getInfoAsync(targetUri);
  const shareUri = fileInfo.exists ? targetUri : rawUri;

  const canShare = await Sharing.isAvailableAsync();
  if (canShare) {
    await Sharing.shareAsync(shareUri, {
      mimeType: 'application/pdf',
      dialogTitle: `Dear Day — ${formatFullDate(day.date)}`,
      UTI: 'com.adobe.pdf',
    });
  }
}

// ─── Utility ──────────────────────────────────────────────────────────────────

function escHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
