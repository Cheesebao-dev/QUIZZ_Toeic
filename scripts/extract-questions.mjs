import { existsSync } from 'node:fs';
import { mkdir, readdir, writeFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import path from 'node:path';
import { PDFParse } from 'pdf-parse';
import sharp from 'sharp';
import { createWorker } from 'tesseract.js';

const ROOT = process.cwd();
const TMP_DIR = path.join(ROOT, '.tmp', 'extract');
const OUT_DIR = path.join(ROOT, 'src');
const OUT_FILE = path.join(OUT_DIR, 'questions.js');

const DEFAULT_PDF_PREFIX = 'TOEIC Part 5';
const ANSWER_LETTERS = ['A', 'B', 'C', 'D'];

async function findPdf() {
  const explicit = process.argv[2];
  if (explicit && existsSync(explicit)) return explicit;

  const downloads = path.join(homedir(), 'Downloads');
  const files = await readdir(downloads);
  const match = files.find((file) => file.startsWith(DEFAULT_PDF_PREFIX) && file.toLowerCase().endsWith('.pdf'));
  if (!match) {
    throw new Error(`Could not find a PDF starting with "${DEFAULT_PDF_PREFIX}" in ${downloads}`);
  }
  return path.join(downloads, match);
}

function columnRects(width, height, pageNumber) {
  const shiftedRightPage = pageNumber === 11 || pageNumber === 14;
  return [
    { side: 'left', left: 0, top: 0, width: Math.round(width * 0.51), height },
    {
      side: 'right',
      left: Math.round(width * (shiftedRightPage ? 0.46 : 0.495)),
      top: 0,
      width: Math.round(width * (shiftedRightPage ? 0.54 : 0.495)),
      height,
    },
  ];
}

async function renderPages(pdfPath) {
  await mkdir(TMP_DIR, { recursive: true });
  const data = await import('node:fs/promises').then((fs) => fs.readFile(pdfPath));
  const parser = new PDFParse({ data });
  const result = await parser.getScreenshot({ scale: 2, imageDataUrl: false, imageBuffer: true });
  await parser.destroy();

  const pages = [];
  for (const page of result.pages) {
    const file = path.join(TMP_DIR, `page-${String(page.pageNumber).padStart(2, '0')}.png`);
    await writeFile(file, page.data);
    pages.push({ number: page.pageNumber, file });
  }
  return pages;
}

async function cleanImage(inputFile, outputFile) {
  const { data, info } = await sharp(inputFile).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const output = Buffer.alloc(data.length);

  for (let i = 0; i < data.length; i += 3) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const mean = (r + g + b) / 3;
    const neutral = max - min < 60;
    const blueInk = b > 110 && b > r + 30 && b > g + 10;
    const pinkInk = r > 150 && b > 90 && r > g + 30 && Math.abs(r - b) < 100;
    const redInk = r > 150 && r > g + 45 && r > b + 20;
    const keepPrintedText = (mean < 165 && !blueInk && !pinkInk && !redInk) || (neutral && mean < 210);

    output[i] = keepPrintedText ? 0 : 255;
    output[i + 1] = keepPrintedText ? 0 : 255;
    output[i + 2] = keepPrintedText ? 0 : 255;
  }

  await sharp(output, { raw: info }).png().toFile(outputFile);
}

async function cropColumns(page) {
  const meta = await sharp(page.file).metadata();
  const rects = columnRects(meta.width, meta.height, page.number);
  const columns = [];

  for (const rect of rects) {
    const rawFile = path.join(TMP_DIR, `page-${String(page.number).padStart(2, '0')}-${rect.side}.png`);
    const cleanFile = path.join(TMP_DIR, `page-${String(page.number).padStart(2, '0')}-${rect.side}-clean.png`);
    await sharp(page.file).extract(rect).png().toFile(rawFile);
    await cleanImage(rawFile, cleanFile);
    columns.push({ ...rect, pageNumber: page.number, rawFile, cleanFile });
  }

  return columns;
}

function compact(text) {
  return text.replace(/\s+/g, ' ').trim();
}

function getLines(data) {
  const lines = [];
  for (const block of data.blocks || []) {
    for (const paragraph of block.paragraphs || []) {
      for (const line of paragraph.lines || []) {
        const text = compact(line.text || '');
        if (text) lines.push({ text, bbox: line.bbox, confidence: line.confidence ?? 0 });
      }
    }
  }
  return lines;
}

function questionNumber(text) {
  const match = text.match(/\b(10[1-9]|1[12][0-9]|130)\s*[.,;:)]/);
  if (match) return Number(match[1]);
  if (/^\s*(?:ii|l0l|lol|1o1|ioi)\s*[.,;:)]/i.test(text)) return 101;
  return null;
}

function optionCandidate(line) {
  return line.bbox.x0 < 260 && (optionLetter(line.text) || (/^[\s({\[@©®€?'‘"`]/.test(line.text) && /[A-Za-z]/.test(line.text)));
}

function optionLetter(text) {
  const match =
    text.match(/^[\s({\["'‘“`]*([A-D])\s*[\)\].;:}>\-]/i) ||
    text.match(/^[^A-D]{0,4}([A-D])\s*[\)\].;:}>\-]/i) ||
    text.match(/^\s*([A-D])[yjv¥]\s+/i);
  return match ? match[1].toUpperCase() : null;
}

function stripOptionLabel(text, inferred = false) {
  const known =
    text.match(/^[\s({\[ "'‘“`]*[A-D]\s*[\)\].;:}>\-]\s*(.*)$/i) ||
    text.match(/^[^A-D]{0,4}[A-D]\s*[\)\].;:}>\-¥]\s*(.*)$/i) ||
    text.match(/^\s*[A-D][yjv¥]\s+(.*)$/i);
  if (known) return cleanOptionText(known[1]);

  if (inferred) {
    const cleaned = text.replace(/^[^A-Za-z]+/, '');
    return cleanOptionText(cleaned);
  }

  return cleanOptionText(text);
}

function cleanOptionText(text) {
  return cleanSentence(
    text
      .replace(/^[A-D][yjv¥]\s*/i, '')
      .replace(/^[A-D]\s*[\)\].;:}>\-¥]\s*/i, '')
      .replace(/^[\)\].;:}>\-¥]+\s*/i, '')
  );
}

function cleanSentence(text) {
  return compact(
    text
      .replace(/[—–_-](?:\s*[—–_-])+/g, '_____')
      .replace(/\s+([,.!?;:])/g, '$1')
      .replace(/^[~"'.\s]+(?=[A-Z])/g, '')
      .replace(/\s*[~"'`´-]+\s*$/g, '')
      .replace(/[|]+$/g, '')
  );
}

function cleanQuestionLine(text) {
  const withNumber = text.match(/\b(10[1-9]|1[12][0-9]|130)\s*[.,;:)]\s*(.*)$/);
  const withoutNumber = withNumber
    ? withNumber[2]
    : text
        .replace(/^\s*(?:ii|l0l|lol|1o1|ioi)\s*[.,;:)]\s*/i, '')
        .replace(/^[^A-Za-z0-9-]*(10[1-9]|1[12][0-9]|130)\s*[.,;:)]?\s*/, '');

  return cleanSentence(withoutNumber.replace(/^[~"'.\s]+(?=[A-Z-])/g, ''));
}

async function rawImage(file) {
  return sharp(file).removeAlpha().raw().toBuffer({ resolveWithObject: true });
}

function markerScore(raw, info, bbox) {
  const top = Math.max(0, Math.floor(bbox.y0 - 4));
  const bottom = Math.min(info.height, Math.floor(bbox.y1 + 4));
  const narrowLeft = Math.max(0, Math.floor(bbox.x0 - 14));
  const narrowRight = Math.min(info.width, Math.floor(bbox.x0 + 75));
  const wideLeft = Math.max(0, Math.floor(bbox.x0 - 14));
  const wideRight = Math.min(info.width, Math.floor(bbox.x1 + 90));
  let score = 0;
  let blue = 0;
  let pink = 0;
  let yellow = 0;

  for (let y = top; y < bottom; y += 1) {
    for (let x = wideLeft; x < wideRight; x += 1) {
      const i = (y * info.width + x) * 3;
      const r = raw[i];
      const g = raw[i + 1];
      const b = raw[i + 2];
      const isBlue = b > 120 && b > r + 35 && b > g + 10;
      const isPink = r > 155 && b > 95 && r > g + 35 && Math.abs(r - b) < 95;
      const isRed = r > 150 && r > g + 45 && r > b + 25;
      const isYellow = r > 175 && g > 145 && b < 155 && r > b + 45 && g > b + 25;

      if (isBlue || isPink || isRed || isYellow) {
        const inNarrow = x >= narrowLeft && x < narrowRight;
        score += inNarrow ? 2 : 1;
        if (isBlue) blue += 1;
        if (isPink || isRed) pink += 1;
        if (isYellow) yellow += 1;
      }
    }
  }

  return { score, blue, pink, yellow };
}

function selectAnswer(options) {
  const ranked = options
    .map((option) => ({ letter: option.letter, score: option.marker.score }))
    .sort((a, b) => b.score - a.score);

  if (!ranked.length || ranked[0].score < 20) return null;
  return ranked[0].letter;
}

function parseQuestionBlock({ testNumber, pageNumber, side, number, lines, raw, info }) {
  const optionLines = [];
  let expected = 0;
  let collectingOptions = false;

  for (const line of lines) {
    const detected = optionLetter(line.text);
    const inferredLine =
      collectingOptions &&
      line.bbox.x0 < 300 &&
      compact(line.text).length < 90 &&
      /[A-Za-z]/.test(line.text) &&
      !questionNumber(line.text);

    if ((!optionCandidate(line) && !inferredLine) || expected >= 4) continue;

    if (!collectingOptions) {
      expected = Math.max(0, ANSWER_LETTERS.indexOf(detected || 'A'));
      collectingOptions = true;
    }

    const letter = ANSWER_LETTERS[expected];
    const inferred = !detected || detected !== letter;

    optionLines.push({
      letter,
      text: stripOptionLabel(line.text, inferred),
      bbox: line.bbox,
      marker: markerScore(raw, info, line.bbox),
    });
    expected += 1;
  }

  if (optionLines.length !== 4) {
    const plausible = lines
      .filter((line) => {
        const text = compact(line.text);
        return line.bbox.x0 < 320 && text.length < 90 && /[A-Za-z]/.test(text) && !questionNumber(text);
      })
      .slice(-4);

    if (plausible.length === 4) {
      optionLines.length = 0;
      plausible.forEach((line, index) => {
        optionLines.push({
          letter: ANSWER_LETTERS[index],
          text: stripOptionLabel(line.text, true),
          bbox: line.bbox,
          marker: markerScore(raw, info, line.bbox),
        });
      });
    }
  }

  const firstOptionY = optionLines[0]?.bbox.y0 ?? Number.POSITIVE_INFINITY;
  const stem = lines
    .filter((line) => line.bbox.y0 < firstOptionY - 2)
    .map((line) => cleanQuestionLine(line.text))
    .filter(Boolean)
    .join(' ');

  const options = optionLines.map(({ letter, text }) => ({ letter, text }));
  const answer = selectAnswer(optionLines);

  return {
    id: `T${testNumber}-${number}`,
    test: testNumber,
    sourceNumber: number,
    sourcePage: pageNumber,
    sourceSide: side,
    _order: {
      page: pageNumber,
      side: side === 'left' ? 0 : 1,
      y: lines[0]?.bbox.y0 ?? 0,
    },
    question: stem,
    options,
    answer,
  };
}

async function parseColumn(worker, column) {
  const { data } = await worker.recognize(column.cleanFile, {}, { text: true, blocks: true });
  const lines = getLines(data).sort((a, b) => a.bbox.y0 - b.bbox.y0);
  const starts = lines
    .map((line) => ({ line, number: questionNumber(line.text) }))
    .filter((start) => start.number !== null && start.line.bbox.x0 < 260);
  const { data: raw, info } = await rawImage(column.rawFile);
  const questions = [];

  for (let i = 0; i < starts.length; i += 1) {
    const start = starts[i];
    const next = starts[i + 1];
    const y0 = Math.max(0, start.line.bbox.y0 - 8);
    const y1 = next ? Math.max(y0, next.line.bbox.y0 - 8) : column.height;
    const blockLines = lines.filter((line) => {
      const center = (line.bbox.y0 + line.bbox.y1) / 2;
      return center >= y0 && center < y1;
    });

    questions.push(
      parseQuestionBlock({
        testNumber: Math.floor((column.pageNumber - 1) / 3) + 1,
        pageNumber: column.pageNumber,
        side: column.side,
        number: start.number,
        lines: blockLines,
        raw,
        info,
      })
    );
  }

  return questions;
}

function validate(questions) {
  const warnings = [];
  const ids = new Set();
  for (const question of questions) {
    if (ids.has(question.id)) warnings.push(`Duplicate id: ${question.id}`);
    ids.add(question.id);
    if (!question.question) warnings.push(`Missing stem: ${question.id}`);
    if (question.options.length !== 4) warnings.push(`Expected 4 options: ${question.id} has ${question.options.length}`);
    if (!question.answer) warnings.push(`Missing marked answer: ${question.id}`);
  }
  return warnings;
}

function toQuestionBankJs(questions) {
  return `window.QUESTION_BANK = ${JSON.stringify(questions, null, 2)};\n`;
}

const pdfPath = await findPdf();
console.log(`Reading PDF: ${pdfPath}`);

await mkdir(OUT_DIR, { recursive: true });
const pages = await renderPages(pdfPath);
const allColumns = [];
for (const page of pages) {
  allColumns.push(...(await cropColumns(page)));
}

const worker = await createWorker('eng');
const questions = [];
for (const column of allColumns) {
  const parsed = await parseColumn(worker, column);
  questions.push(...parsed);
  console.log(`Page ${column.pageNumber} ${column.side}: ${parsed.length} questions`);
}
await worker.terminate();

questions.sort(
  (a, b) =>
    a.test - b.test ||
    a._order.page - b._order.page ||
    a._order.side - b._order.side ||
    a._order.y - b._order.y
);

let currentTest = null;
let indexInTest = 0;
for (const question of questions) {
  if (question.test !== currentTest) {
    currentTest = question.test;
    indexInTest = 0;
  }
  question.sourceNumber = 101 + indexInTest;
  question.id = `T${question.test}-${question.sourceNumber}`;
  delete question._order;
  indexInTest += 1;
}

const warnings = validate(questions);
await writeFile(OUT_FILE, toQuestionBankJs(questions), 'utf8');

console.log(`Wrote ${questions.length} questions to ${path.relative(ROOT, OUT_FILE)}`);
if (warnings.length) {
  console.log('Warnings:');
  for (const warning of warnings) console.log(`- ${warning}`);
}
