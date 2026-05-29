import { Router } from "express";
import { logActivity, getActivities, getActivitySummary } from "../controllers";
import { authMiddleware } from "../middleware";

const router = Router();

router.use(authMiddleware);

router.get("/", getActivities);
router.post("/", logActivity);
router.get("/summary", getActivitySummary);

export default router;
