import multer from 'multer';

/**
 * Receives uploaded files into memory (req.file.buffer) so the service can
 * persist the bytes into the SQLite BLOB column. Capped at 10 MB per file.
 */
export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});
