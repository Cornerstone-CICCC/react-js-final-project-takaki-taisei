import { Router } from "express";
import swaggerUi from "swagger-ui-express";
import nodeRoutes from "./node.routes";
import authRoutes from "./auth.routes";
import { openapiSpec } from "../docs/openapi";
import { prisma } from "../lib/prisma";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();

router.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "pseudo-fs-server" });
});

router.get("/ready", asyncHandler(async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: "ready" });
  } catch {
    res.status(503).json({ status: "unavailable" });
  }
}));

// API docs: interactive Swagger UI + the raw OpenAPI document.
router.get("/openapi.json", (_req, res) => res.json(openapiSpec));
router.use(
  "/docs",
  swaggerUi.serve,
  swaggerUi.setup(openapiSpec as object, {
    customSiteTitle: "Pseudo-FS API Docs",
  }),
);

router.use("/auth", authRoutes);
router.use("/", nodeRoutes);

export default router;
