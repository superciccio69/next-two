import fs from 'fs/promises';
import path from 'path';

const LOG_DIR = path.join(process.cwd(), 'logs');
const MAX_LOG_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_LOG_FILES = 5;

interface FileSystemError extends Error {
  code: string;
}

function isFileSystemError(error: unknown): error is FileSystemError {
  return error !== null && 
         typeof error === 'object' && 
         'code' in error;
}

async function rotateLog(logFile: string) {
  try {
    const stats = await fs.stat(logFile);
    if (stats.size >= MAX_LOG_SIZE) {
      // Rotate existing log files
      for (let i = MAX_LOG_FILES - 1; i > 0; i--) {
        const oldFile = `${logFile}.${i}`;
        const newFile = `${logFile}.${i + 1}`;
        try {
          await fs.access(oldFile);
          if (i === MAX_LOG_FILES - 1) {
            await fs.unlink(oldFile);
          } else {
            await fs.rename(oldFile, newFile);
          }
        } catch (error) {
          // File doesn't exist, skip
        }
      }
      // Rename current log file
      await fs.rename(logFile, `${logFile}.1`);
    }
  } catch (error: unknown) {
    if (isFileSystemError(error) && error.code !== 'ENOENT') {
      console.error('Error rotating log file:', error);
    }
  }
}

export async function logRetryProcess(message: string, data?: any) {
  const timestamp = new Date().toISOString();
  const logEntry = `[${timestamp}] ${message}\n${data ? JSON.stringify(data, null, 2) + '\n' : ''}`;
  const logFile = path.join(LOG_DIR, 'retry-process.log');
  
  try {
    await fs.mkdir(LOG_DIR, { recursive: true });
    await rotateLog(logFile);
    await fs.appendFile(logFile, logEntry);
  } catch (error) {
    console.error('Failed to write to log file:', error);
  }
}