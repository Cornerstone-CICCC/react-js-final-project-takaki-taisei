import multer from "multer";

/**
 * Receives uploaded files into memory (req.file.buffer) so the service can
 * send the bytes to private Storage. Capped at 10 MB per file.
 */
export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024, files: 1, fields: 2, parts: 3, fieldSize: 1024 },
});
