import { Router } from "express";
import { getTasks, createTask, completeTask, updateTask, deleteTask } from "../controllers";
import { authMiddleware } from "../middleware";

const router = Router();

router.use(authMiddleware);

router.get("/", getTasks);
router.post("/", createTask);
router.patch("/:id/complete", completeTask);
router.put("/:id", updateTask);
router.delete("/:id", deleteTask);

export default router;
