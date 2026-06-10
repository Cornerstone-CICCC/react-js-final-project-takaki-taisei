import { z } from "zod";

const nameSchema = z
  .string()
  .trim()
  .min(1, "name is required")
  .max(255, "name is too long")
  .refine((n) => !n.includes("/"), { message: 'name cannot contain "/"' });

export const createNodeSchema = z.object({
  name: nameSchema,
  type: z.enum(["FILE", "FOLDER"]),
  parentId: z.string().min(1).optional(),
  content: z.string().optional(),
});

export const updateNodeSchema = z
  .object({ name: nameSchema.optional(), content: z.string().optional() })
  .refine((d) => d.name !== undefined || d.content !== undefined, {
    message: "Provide at least one of: name, content",
  });

export const moveNodeSchema = z.object({
  parentId: z.string().min(1, "parentId is required"),
});

export const searchSchema = z.object({
  q: z.string().trim().min(1, 'query parameter "q" is required'),
});

// Metadata fields that accompany a multipart file upload (both optional).
export const uploadMetaSchema = z.object({
  name: nameSchema.optional(),
  parentId: z.string().min(1).optional(),
});

export type CreateNodeInput = z.infer<typeof createNodeSchema>;
export type UpdateNodeInput = z.infer<typeof updateNodeSchema>;
