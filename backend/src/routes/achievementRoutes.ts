import { Router } from "express";
import { getAchievements } from "../controllers";
import { authMiddleware } from "../middleware";

const router = Router();

router.use(authMiddleware);

router.get("/", getAchievements);

export default router;
