const fs = require('fs');
const path = require('path');

/**
 * Extract text from uploaded file (server-side)
 * Supports: PDF, DOCX, TXT, MD
 */
async function extractText(filePath, originalName) {
  const ext = path.extname(originalName).toLowerCase().slice(1);

  if (ext === 'pdf') {
    return await extractFromPDF(filePath);
  } else if (ext === 'docx' || ext === 'doc') {
    return await extractFromDOCX(filePath);
  } else if (['txt', 'md', 'text'].includes(ext)) {
    return fs.readFileSync(filePath, 'utf-8');
  } else {
    // Try reading as text
    try {
      return fs.readFileSync(filePath, 'utf-8');
    } catch {
      throw new Error(`Unsupported file type: .${ext}. Supported formats: PDF, DOCX, TXT`);
    }
  }
}

async function extractFromPDF(filePath) {
  try {
    const pdfParse = require('pdf-parse');
    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdfParse(dataBuffer);
    
    if (!data.text || data.text.trim().length < 50) {
      throw new Error('PDF appears to be scanned/image-based. Please use a text-based PDF or DOCX.');
    }
    
    return data.text;
  } catch (err) {
    if (err.message.includes('scanned')) throw err;
    throw new Error(`Failed to extract PDF text: ${err.message}`);
  }
}

async function extractFromDOCX(filePath) {
  try {
    const mammoth = require('mammoth');
    const result = await mammoth.extractRawText({ path: filePath });
    
    if (!result.value || result.value.trim().length < 10) {
      throw new Error('DOCX file appears to be empty or corrupt.');
    }
    
    return result.value;
  } catch (err) {
    throw new Error(`Failed to extract DOCX text: ${err.message}`);
  }
}

/**
 * Clean up uploaded file after processing
 */
function cleanupFile(filePath) {
  try {
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  } catch (e) {
    console.warn('Failed to cleanup file:', filePath, e.message);
  }
}

/**
 * Validate file before processing
 */
function validateFile(file) {
  const maxSize = (parseInt(process.env.MAX_FILE_SIZE_MB) || 10) * 1024 * 1024;
  const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword', 'text/plain', 'text/markdown'];
  const allowedExts = ['pdf', 'docx', 'doc', 'txt', 'md'];

  if (file.size > maxSize) {
    throw new Error(`File too large. Maximum size: ${process.env.MAX_FILE_SIZE_MB || 10}MB`);
  }

  const ext = path.extname(file.originalname).toLowerCase().slice(1);
  if (!allowedExts.includes(ext)) {
    throw new Error(`Unsupported file type: .${ext}. Use: ${allowedExts.join(', ')}`);
  }
}

module.exports = { extractText, cleanupFile, validateFile };
