import { Router } from "express";
import { getHabits, createHabit, logHabit, deleteHabit } from "../controllers";
import { authMiddleware } from "../middleware";

const router = Router();

router.use(authMiddleware);

router.get("/", getHabits);
router.post("/", createHabit);
router.post("/:id/log", logHabit);
router.delete("/:id", deleteHabit);

export default router;
