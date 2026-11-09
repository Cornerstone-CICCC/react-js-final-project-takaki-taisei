import { z } from "zod";

export const nameSchema = z
  .string()
  .trim()
  .min(1, "name is required")
  .max(255, "name is too long")
  .refine((n) => !/[\\/\x00-\x1f\x7f]/.test(n) && n !== "." && n !== "..", { message: "Invalid file name" });

const idSchema = z.string().regex(/^[a-zA-Z0-9_-]{1,128}$/, "Invalid node ID");

export const createNodeSchema = z.object({
  name: nameSchema,
  type: z.enum(["FILE", "FOLDER"]),
  parentId: idSchema.optional(),
  content: z.string().max(1000000).optional(),
});

export const updateNodeSchema = z
  .object({ name: nameSchema.optional(), content: z.string().max(1000000).optional() })
  .refine((d) => d.name !== undefined || d.content !== undefined, {
    message: "Provide at least one of: name, content",
  });

export const moveNodeSchema = z.object({
  parentId: idSchema,
});

export const searchSchema = z.object({
  q: z.string().trim().min(1, 'query parameter "q" is required').max(255),
});

// Metadata fields that accompany a multipart file upload (both optional).
export const uploadMetaSchema = z.object({
  name: nameSchema.optional(),
  parentId: idSchema.optional(),
});

export type CreateNodeInput = z.infer<typeof createNodeSchema>;
export type UpdateNodeInput = z.infer<typeof updateNodeSchema>;
