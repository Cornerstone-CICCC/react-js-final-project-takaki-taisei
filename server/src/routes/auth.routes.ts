import { Router } from "express";
import * as controller from "../controllers/auth.controller";
import { authenticate } from "../middleware/authenticate";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();

router.post("/signup", asyncHandler(controller.signup));
router.post("/login", asyncHandler(controller.login));
router.post("/logout", controller.logout);
router.get("/me", authenticate, asyncHandler(controller.getMe));

export default router;
