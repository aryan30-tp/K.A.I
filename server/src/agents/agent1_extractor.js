import fs from 'node:fs/promises';
import path from 'node:path';
import mammoth from 'mammoth';
import { PDFParse } from 'pdf-parse';
import { YoutubeTranscript } from 'youtube-transcript';

const DOCUMENT_EXTENSIONS = new Set(['.pdf', '.docx']);

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
  try {
    console.log(`Extracting PDF: ${filePath}`);
    const dataBuffer = await fs.readFile(filePath);
    const parser = new PDFParse({ data: dataBuffer });
    const data = await parser.getText();
    await parser.destroy();
    return normalizeText((data.text || '').replace(/\n+/g, ' '));
  } catch (error) {
    console.error('Error extracting PDF:', error?.message || error);
    throw new Error('Failed to parse PDF.');
  }
}

async function extractWordText(filePath) {
  try {
    console.log(`Extracting Docx: ${filePath}`);
    const result = await mammoth.extractRawText({ path: filePath });
    return normalizeText(result.value || '');
  } catch (error) {
    console.error('Error extracting Docx:', error?.message || error);
    throw new Error('Failed to parse Document.');
  }
}

export async function extractFromPdf(filePath) {
  return extractPdfText(filePath);
}

export async function extractFromDocx(filePath) {
  return extractWordText(filePath);
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

    const videoId = extractYoutubeId(videoUrl);
    const attempts = [
      { input: videoUrl, options: undefined },
      { input: videoId, options: undefined },
      { input: videoUrl, options: { lang: 'en' } },
      { input: videoId, options: { lang: 'en' } },
    ];

    let lastError = null;

    for (const attempt of attempts) {
      try {
        const transcriptArray = await YoutubeTranscript.fetchTranscript(
          attempt.input,
          attempt.options
        );

        const cleanText = transcriptArray.map((item) => item.text).join(' ');
        console.log('Extraction successful!');
        return normalizeText(cleanText);
      } catch (err) {
        lastError = err;
      }
    }

    console.error('Error extracting YouTube transcript:', lastError?.message || lastError);
    throw new Error('Failed to extract video transcript. Make sure the video has captions enabled and is publicly available.');
  } catch (error) {
    console.error('Error extracting YouTube transcript:', error?.message || error);
    throw error;
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

  throw new Error(`Unsupported source type: ${source}`);
}

/**
 * Routes the file/URL to the correct extractor and returns the text.
 */
export async function processStudyMaterial(type, source) {
  if (type === 'youtube') return extractYouTubeText(source);
  if (type === 'pdf') return extractPdfText(source);
  if (type === 'docx') return extractWordText(source);
  throw new Error('Unsupported file type');
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
  extractFromYoutube,
  processStudyMaterial,
  resolveInputPath,
};
