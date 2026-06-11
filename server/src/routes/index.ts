import { Router } from "express";
import swaggerUi from "swagger-ui-express";
import nodeRoutes from "./node.routes";
import authRoutes from "./auth.routes";
import { openapiSpec } from "../docs/openapi";

const router = Router();

router.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "pseudo-fs-server" });
});

// API docs: interactive Swagger UI + the raw OpenAPI document.
router.get("/openapi.json", (_req, res) => res.json(openapiSpec));
router.use(
  "/docs",
  swaggerUi.serve,
  swaggerUi.setup(openapiSpec as object, {
    customSiteTitle: "Pseudo-FS API Docs",
  }),
);

router.use("/", nodeRoutes);
router.use("/auth", authRoutes);

export default router;
