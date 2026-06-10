import type { Request, Response } from 'express';
import * as service from '../services/node.service';
import { AppError } from '../utils/AppError';
import {
  createNodeSchema,
  updateNodeSchema,
  moveNodeSchema,
  searchSchema,
  uploadMetaSchema,
} from '../validation/node.schema';

export async function getTree(_req: Request, res: Response) {
  const tree = await service.getTree();
  res.json({ data: tree });
}

export async function getNode(req: Request, res: Response) {
  const node = await service.getNode(String(req.params.id));
  res.json({ data: node });
}

export async function createNode(req: Request, res: Response) {
  const input = createNodeSchema.parse(req.body);
  const node = await service.createNode(input);
  res.status(201).json({ data: node });
}

export async function updateNode(req: Request, res: Response) {
  const input = updateNodeSchema.parse(req.body);
  const node = await service.updateNode(String(req.params.id), input);
  res.json({ data: node });
}

export async function moveNode(req: Request, res: Response) {
  const { parentId } = moveNodeSchema.parse(req.body);
  const node = await service.moveNode(String(req.params.id), parentId);
  res.json({ data: node });
}

export async function uploadNode(req: Request, res: Response) {
  if (!req.file) {
    throw new AppError(400, 'No file uploaded — send it as multipart form field "file"');
  }
  const meta = uploadMetaSchema.parse({
    name: req.body?.name || undefined,
    parentId: req.body?.parentId || undefined,
  });
  const node = await service.uploadNode({
    name: meta.name ?? req.file.originalname,
    parentId: meta.parentId,
    mimeType: req.file.mimetype,
    buffer: req.file.buffer,
  });
  res.status(201).json({ data: node });
}

export async function getRaw(req: Request, res: Response) {
  const raw = await service.getRaw(String(req.params.id));
  res.type(raw.mimeType);
  res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(raw.name)}"`);
  res.send(raw.kind === 'binary' ? raw.buffer : raw.text);
}

export async function deleteNode(req: Request, res: Response) {
  const result = await service.deleteNode(String(req.params.id));
  res.json({ data: result });
}

export async function search(req: Request, res: Response) {
  const { q } = searchSchema.parse({ q: req.query.q });
  const results = await service.search(q);
  res.json({ data: results, count: results.length });
}
