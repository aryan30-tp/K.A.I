import fs from 'node:fs';
import fsPromises from 'node:fs/promises';
import path from 'node:path';
import mammoth from 'mammoth';
import { PDFParse } from 'pdf-parse';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import ytdl from '@distube/ytdl-core';
import OpenAI from 'openai';

const groq = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: 'https://api.groq.com/openai/v1',
});

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

function extractVideoId(url) {
  const regExp = /^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = String(url).match(regExp);
  return match && match[2]?.length === 11 ? match[2] : null;
}

async function extractPdfText(filePath) {
  try {
    console.log(`Extracting PDF: ${filePath}`);
    const dataBuffer = await fsPromises.readFile(filePath);
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
 * Extracts the transcript from a YouTube URL via RapidAPI and converts it to a clean string.
 * @param {string} videoUrl - The full YouTube URL
 * @returns {Promise<string>} - The combined text transcript
 */
export async function extractYouTubeText(videoUrl) {
  try {
    console.log(`Starting RapidAPI extraction for: ${videoUrl}`);

    const apiKey = process.env.RAPIDAPI_KEY;
    if (!apiKey) throw new Error('RAPIDAPI_KEY is not set');

    const response = await axios.request({
      method: 'GET',
      url: 'https://youtube-transcript3.p.rapidapi.com/api/transcript-with-url',
      params: {
        url: videoUrl,
        flat_text: 'true',
        lang: 'en',
      },
      headers: {
        'x-rapidapi-host': 'youtube-transcript3.p.rapidapi.com',
        'x-rapidapi-key': apiKey,
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });

    let cleanText = '';
    if (typeof response.data === 'string') {
      cleanText = response.data;
    } else if (response.data?.text || response.data?.transcript) {
      cleanText = response.data.text || response.data.transcript;
    } else {
      throw new Error('Unexpected API response structure.');
    }

    console.log('YouTube extraction successful via RapidAPI.');
    return normalizeText(cleanText);
  } catch (error) {
    console.error('RapidAPI extraction error:', error?.response?.data || error?.message || error);

    // Fallback to Groq Whisper if RapidAPI fails or times out
    return extractViaWhisper(videoUrl);
  }
}

export async function extractViaWhisper(videoUrl) {
  const audioFilePath = path.resolve(`./uploads/${uuidv4()}.mp3`);

  try {
    console.log(`Starting Groq Whisper extraction for: ${videoUrl}`);

    await new Promise((resolve, reject) => {
      const stream = ytdl(videoUrl, {
        filter: 'audioonly',
        quality: 'highestaudio',
      });

      stream
        .pipe(fs.createWriteStream(audioFilePath))
        .on('finish', resolve)
        .on('error', reject);
    });

    const transcription = await groq.audio.transcriptions.create({
      file: fs.createReadStream(audioFilePath),
      model: 'whisper-large-v3',
      response_format: 'text',
    });

    fs.unlinkSync(audioFilePath);
    return transcription;
  } catch (error) {
    if (fs.existsSync(audioFilePath)) fs.unlinkSync(audioFilePath);
    console.error('Groq Whisper error:', error?.message || error);
    throw new Error('Failed to transcribe audio via Groq.');
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
