import fs from 'node:fs/promises';
import path from 'node:path';
import mammoth from 'mammoth';
import officeParser from 'officeparser';
import { PDFParse } from 'pdf-parse';
import { fetchTranscript, YoutubeTranscript } from 'youtube-transcript';

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
  return extractYouTubeText(input);
}

/**
 * Extracts the transcript from a YouTube URL and converts it to a clean string.
 * @param {string} videoUrl - The full YouTube URL or video id
 * @returns {Promise<string>} - The combined text transcript
 */
export async function extractYouTubeText(videoUrl) {
  try {
    console.log(`Starting extraction for: ${videoUrl}`);

    // Fetch the transcript array
    const transcriptArray = await YoutubeTranscript.fetchTranscript(videoUrl);

    // The package returns an array of objects: { text: "hello", duration: 1.5, offset: 0 }
    // We map through it to grab just the text and join it with spaces.
    const cleanText = transcriptArray.map((item) => item.text).join(' ');

    console.log('Extraction successful!');
    return normalizeText(cleanText);
  } catch (error) {
    console.error('Error extracting YouTube transcript:', error?.message || error);
    throw new Error('Failed to extract video transcript. Make sure the video has captions enabled.');
  }
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
