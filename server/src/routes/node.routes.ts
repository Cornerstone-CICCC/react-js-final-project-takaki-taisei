import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { upload } from "../middleware/upload";
import * as controller from "../controllers/node.controller";

const router = Router();

// Whole tree (nested) and search come before the parameterised routes.
router.get("/tree", asyncHandler(controller.getTree));
router.get("/search", asyncHandler(controller.search));

// Binary upload (multipart/form-data, field name "file").
router.post(
  "/nodes/upload",
  upload.single("file"),
  asyncHandler(controller.uploadNode),
);

router.get("/nodes/:id", asyncHandler(controller.getNode));
router.get("/nodes/:id/raw", asyncHandler(controller.getRaw));
router.post("/nodes", asyncHandler(controller.createNode));
router.patch("/nodes/:id", asyncHandler(controller.updateNode));
router.post("/nodes/:id/move", asyncHandler(controller.moveNode));
router.delete("/nodes/:id", asyncHandler(controller.deleteNode));

export default router;
