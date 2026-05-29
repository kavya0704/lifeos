import { Router } from "express";
import { getGoals, createGoal, updateGoal, deleteGoal } from "../controllers";
import { authMiddleware } from "../middleware";

const router = Router();

router.use(authMiddleware);

router.get("/", getGoals);
router.post("/", createGoal);
router.put("/:id", updateGoal);
router.delete("/:id", deleteGoal);

export default router;
