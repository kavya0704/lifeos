import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../config";
import { AuthRequest } from "../middleware";

// ─── Register ────────────────────────────────────────────────────────────────

export async function register(req: Request, res: Response): Promise<void> {
  try {
    const { email, password, name } = req.body;

    if (!email || !password || !name) {
      res.status(400).json({ error: "Name, email, and password are required." });
      return;
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      res.status(409).json({ error: "User with this email already exists." });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: { email, passwordHash, name },
      select: { id: true, email: true, name: true, profileImage: true, createdAt: true },
    });

    const token = generateToken(user.id);

    res.status(201).json({ user, token });
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({ error: "Registration failed." });
  }
}

// ─── Login ───────────────────────────────────────────────────────────────────

export async function login(req: Request, res: Response): Promise<void> {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: "Email and password are required." });
      return;
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.passwordHash) {
      res.status(401).json({ error: "Invalid credentials." });
      return;
    }

    const validPassword = await bcrypt.compare(password, user.passwordHash);
    if (!validPassword) {
      res.status(401).json({ error: "Invalid credentials." });
      return;
    }

    const token = generateToken(user.id);

    res.json({
      user: formatUserResponse(user),
      token,
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Login failed." });
  }
}

// ─── Get Current User ───────────────────────────────────────────────────────

export async function getMe(req: AuthRequest, res: Response): Promise<void> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: {
        id: true,
        email: true,
        name: true,
        profileImage: true,
        wakeTime: true,
        sleepTime: true,
        englishLevel: true,
        gymSchedule: true,
        weakAreas: true,
        strongAreas: true,
        subjects: true,
        xp: true,
        level: true,
        createdAt: true,
      },
    });

    if (!user) {
      res.status(404).json({ error: "User not found." });
      return;
    }

    res.json({ user: formatUserResponse(user) });
  } catch (error) {
    console.error("GetMe error:", error);
    res.status(500).json({ error: "Failed to fetch user." });
  }
}

// ─── Update Profile ─────────────────────────────────────────────────────────

export async function updateProfile(req: AuthRequest, res: Response): Promise<void> {
  try {
    const allowedFields = [
      "name", "profileImage", "wakeTime", "sleepTime",
      "englishLevel", "gymSchedule", "weakAreas", "strongAreas", "subjects",
    ];

    const arrayFields = ["gymSchedule", "weakAreas", "strongAreas", "subjects"];

    const data: Record<string, unknown> = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        if (arrayFields.includes(field) && Array.isArray(req.body[field])) {
          data[field] = req.body[field].filter((x: string) => x).join(",");
        } else {
          data[field] = req.body[field];
        }
      }
    }

    const user = await prisma.user.update({
      where: { id: req.userId },
      data,
      select: {
        id: true, email: true, name: true, profileImage: true,
        wakeTime: true, sleepTime: true, englishLevel: true,
        gymSchedule: true, weakAreas: true, strongAreas: true, subjects: true,
        xp: true, level: true,
      },
    });

    res.json({ user: formatUserResponse(user) });
  } catch (error) {
    console.error("UpdateProfile error:", error);
    res.status(500).json({ error: "Failed to update profile." });
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatUserResponse(user: any) {
  const arrayFields = ["gymSchedule", "weakAreas", "strongAreas", "subjects"];
  const formatted = { ...user };
  for (const field of arrayFields) {
    if (typeof formatted[field] === "string") {
      formatted[field] = formatted[field] ? formatted[field].split(",") : [];
    }
  }
  return formatted;
}

function generateToken(userId: string): string {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET || "fallback-secret",
    { expiresIn: (process.env.JWT_EXPIRES_IN || "7d") as any }
  );
}

export async function debugUsers(req: Request, res: Response): Promise<void> {
  try {
    const { action, email } = req.query;
    if (action === "delete" && typeof email === "string") {
      const deleted = await prisma.user.delete({ where: { email } });
      res.json({ message: `Successfully deleted user ${email}`, deleted });
      return;
    }
    const users = await prisma.user.findMany({
      select: { email: true, name: true, createdAt: true },
    });
    res.json({ users });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Debug failed" });
  }
}
