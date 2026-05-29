import { Router } from "express";
import { chatWithCoach, generateSchedule, generateDailyReview, getDailyReviews } from "../controllers/aiController";
import { authMiddleware } from "../middleware";

const router = Router();

router.use(authMiddleware);

router.post("/chat", chatWithCoach);
router.post("/schedule", generateSchedule);
router.post("/review", generateDailyReview);
router.get("/reviews", getDailyReviews);

export default router;
