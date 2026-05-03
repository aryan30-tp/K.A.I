import fs from 'node:fs';
import fsPromises from 'node:fs/promises';
import path from 'node:path';
import mammoth from 'mammoth';
import { PDFParse } from 'pdf-parse';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import OpenAI from 'openai';
import officeParser from 'officeparser';

const groq = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: 'https://api.groq.com/openai/v1',
});

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

// --- 3. PPTX / DOCX EXTRACTOR ---
export async function extractOfficeFile(filePath) {
  try {
    console.log(`Extracting text from office file: ${filePath}`);
    const header = await readFileHeader(filePath, 8);
    const isZip = header[0] === 0x50 && header[1] === 0x4b;
    const isOle =
      header[0] === 0xd0 &&
      header[1] === 0xcf &&
      header[2] === 0x11 &&
      header[3] === 0xe0;
    const ext = path.extname(filePath).toLowerCase();

    if (ext === '.pptx' && !isZip) {
      throw new Error('This file is not a valid .pptx. Please re-export as .pptx.');
    }

    if (ext === '.ppt' || isOle) {
      throw new Error('Legacy .ppt files are not supported. Please export as .pptx.');
    }

    let rawText = '';
    if (typeof officeParser.parseOfficeAsync === 'function') {
      rawText = await officeParser.parseOfficeAsync(filePath);
    } else if (typeof officeParser.parseOffice === 'function') {
      rawText = await officeParser.parseOffice(filePath);
    } else {
      throw new Error('officeparser API not available.');
    }
    console.log('Office extraction successful.');
    return normalizeText(rawText || '');
  } catch (error) {
    const message = error?.message || String(error || 'Unknown error');
    console.error('Office Extraction Error:', message);
    throw new Error(
      `Failed to extract text from the presentation or document. ${message}`
    );
  }
}

async function readFileHeader(filePath, length) {
  const handle = await fsPromises.open(filePath, 'r');
  try {
    const buffer = Buffer.alloc(length);
    await handle.read(buffer, 0, length, 0);
    return buffer;
  } finally {
    await handle.close();
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
    console.log(`Starting bulletproof Whisper extraction for: ${videoUrl}`);

    console.log('Asking RapidAPI for the audio bypass link...');

    const videoId = extractVideoId(videoUrl);
    if (!videoId) throw new Error('Invalid YouTube URL');

    const mp3ApiOptions = {
      method: 'GET',
      url: 'https://youtube-mp36.p.rapidapi.com/dl',
      params: { id: videoId },
      headers: {
        'x-rapidapi-host': 'youtube-mp36.p.rapidapi.com',
        'x-rapidapi-key': process.env.RAPIDAPI_KEY,
        'Content-Type': 'application/json',
      },
      timeout: 20000,
    };

    let downloadUrl = '';
    let attempts = 0;
    const maxAttempts = 15;

    while (attempts < maxAttempts) {
      const mp3Response = await axios.request(mp3ApiOptions);
      const data = mp3Response.data;

      if (data?.link) {
        downloadUrl = data.link;
        console.log('API finished processing! Link acquired.');
        break;
      }

      if (data?.status === 'processing' || data?.msg === 'in process') {
        attempts += 1;
        console.log(
          `API is processing the audio (Attempt ${attempts}/${maxAttempts}). Waiting 3 seconds...`
        );
        await new Promise((resolve) => setTimeout(resolve, 3000));
        continue;
      }

      throw new Error(
        `RapidAPI returned an unexpected error: ${JSON.stringify(data)}`
      );
    }

    if (!downloadUrl) {
      throw new Error(
        'RapidAPI timed out while trying to generate the audio link. The file might be too large.'
      );
    }

    console.log('Downloading audio file from bypass link...');

    const fileStream = fs.createWriteStream(audioFilePath);
    const downloadResponse = await axios({
      method: 'GET',
      url: downloadUrl,
      responseType: 'stream',
      timeout: 60000,
    });

    await new Promise((resolve, reject) => {
      downloadResponse.data
        .pipe(fileStream)
        .on('finish', resolve)
        .on('error', reject);
    });

    const stats = fs.statSync(audioFilePath);
    const fileSizeInMB = stats.size / (1024 * 1024);
    console.log(`Audio downloaded successfully. Size: ${fileSizeInMB.toFixed(2)} MB`);

    if (fileSizeInMB >= 24.5) {
      fs.unlinkSync(audioFilePath);
      throw new Error(
        'This video is too large for AI Audio Transcription. For videos over 30 minutes, please ensure they have YouTube captions enabled so K.A.I. can read the text directly.'
      );
    }

    console.log('File size safe. Transcribing via Groq Whisper...');
    const transcription = await groq.audio.transcriptions.create({
      file: fs.createReadStream(audioFilePath),
      model: 'whisper-large-v3',
      response_format: 'text',
    });

    fs.unlinkSync(audioFilePath);
    return transcription;
  } catch (error) {
    if (fs.existsSync(audioFilePath)) fs.unlinkSync(audioFilePath);
    console.error('Whisper Pipeline Error:', error?.response?.data || error?.message || error);
    throw new Error('Failed to transcribe audio. See backend logs.');
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

  if (extension === '.pptx') {
    return extractOfficeFile(source);
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
  if (type === 'pptx') return extractOfficeFile(source);
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
  extractOfficeFile,
  processStudyMaterial,
  resolveInputPath,
};
