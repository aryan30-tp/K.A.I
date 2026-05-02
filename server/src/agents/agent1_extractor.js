import fs from 'node:fs/promises';
import path from 'node:path';
import mammoth from 'mammoth';
import officeParser from 'officeparser';
import { PDFParse } from 'pdf-parse';
import { fetchTranscript } from 'youtube-transcript';

const DOCUMENT_EXTENSIONS = new Set(['.pdf', '.docx', '.pptx']);

function normalizeText(value) {
  return value
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function isYoutubeUrl(input) {
  return /(?:youtube\.com|youtu\.be)/i.test(input);
}

function extractYoutubeId(input) {
  try {
    const url = new URL(input);

    if (url.hostname.includes('youtu.be')) {
      return url.pathname.split('/').filter(Boolean)[0] || '';
    }

    return url.searchParams.get('v') || '';
  } catch {
    return input;
  }
}

async function extractPdfText(filePath) {
  const fileBuffer = await fs.readFile(filePath);
  const parser = new PDFParse({ data: fileBuffer });
  const result = await parser.getText();
  await parser.destroy();
  return normalizeText(result.text || '');
}

async function extractWordText(filePath) {
  const result = await mammoth.extractRawText({ path: filePath });
  return normalizeText(result.value || '');
}

async function extractPresentationText(filePath) {
  const ast = await officeParser.parseOffice(filePath, {
    newlineDelimiter: '\n',
    ignoreNotes: false,
  });

  return normalizeText(ast.toText() || '');
}

export async function extractFromPdf(filePath) {
  return extractPdfText(filePath);
}

export async function extractFromDocx(filePath) {
  return extractWordText(filePath);
}

export async function extractFromPptx(filePath) {
  return extractPresentationText(filePath);
}

export async function extractFromYoutube(input) {
  const videoId = extractYoutubeId(input);
  const transcript = await fetchTranscript(videoId);
  const text = transcript.map((chunk) => chunk.text).join(' ');
  return normalizeText(text);
}

export async function extractContent(source) {
  if (isYoutubeUrl(source)) {
    return extractFromYoutube(source);
  }

  const extension = path.extname(source).toLowerCase();

  if (!DOCUMENT_EXTENSIONS.has(extension)) {
    throw new Error(`Unsupported source type: ${source}`);
  }

  if (extension === '.pdf') {
    return extractFromPdf(source);
  }

  if (extension === '.docx') {
    return extractFromDocx(source);
  }

  return extractFromPptx(source);
}

export function resolveInputPath(relativeOrAbsolutePath) {
  return path.isAbsolute(relativeOrAbsolutePath)
    ? relativeOrAbsolutePath
    : path.resolve(process.cwd(), relativeOrAbsolutePath);
}

export default {
  extractContent,
  extractFromDocx,
  extractFromPdf,
  extractFromPptx,
  extractFromYoutube,
  resolveInputPath,
};
