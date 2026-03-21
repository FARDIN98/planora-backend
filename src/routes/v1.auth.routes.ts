import { Router } from "express";
import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma.js";
import { signToken } from "../lib/jwt.js";
import { requireAuth } from "../middleware/auth.js";
import { catchAsync } from "../utils/catch-async.js";
import type { Request, Response } from "express";

const router = Router();

/**
 * @swagger
 * /api/v1/auth/register:
 *   post:
 *     tags: [Auth]
 *     summary: Create a new account
 *     description: |
 *       Register a new user with name, email, and password.
 *       On success, a JWT accessToken is returned for immediate authentication.
 *       Password must be at least 8 characters.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, password]
 *             properties:
 *               name:
 *                 type: string
 *                 example: "John Doe"
 *                 description: Full name of the user (min 2 characters)
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "john@example.com"
 *                 description: Unique email address
 *               password:
 *                 type: string
 *                 format: password
 *                 minLength: 8
 *                 example: "securepass123"
 *                 description: Must be at least 8 characters
 *     responses:
 *       201:
 *         description: Account created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *                     accessToken:
 *                       type: string
 *                       description: JWT access token for authentication
 *       409:
 *         description: Email already registered
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               error:
 *                 message: "An account with this email already exists"
 *                 code: "USER_ALREADY_EXISTS"
 *       422:
 *         description: Validation error (missing fields, invalid email, short password)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       429:
 *         description: Too many authentication attempts
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RateLimitError'
 */
router.post("/register", catchAsync(async (req: Request, res: Response) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    res.status(422).json({
      success: false,
      error: { message: "Name, email, and password are required", code: "VALIDATION_ERROR" },
    });
    return;
  }

  if (typeof name !== "string" || name.trim().length < 2) {
    res.status(422).json({
      success: false,
      error: { message: "Name must be at least 2 characters", code: "VALIDATION_ERROR" },
    });
    return;
  }

  if (typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    res.status(422).json({
      success: false,
      error: { message: "Invalid email address", code: "VALIDATION_ERROR" },
    });
    return;
  }

  if (typeof password !== "string" || password.length < 8) {
    res.status(422).json({
      success: false,
      error: { message: "Password must be at least 8 characters", code: "VALIDATION_ERROR" },
    });
    return;
  }

  const existingUser = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (existingUser) {
    res.status(409).json({
      success: false,
      error: { message: "An account with this email already exists", code: "USER_ALREADY_EXISTS" },
    });
    return;
  }

  const hashedPassword = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: { name: name.trim(), email: email.toLowerCase(), password: hashedPassword },
  });

  const accessToken = signToken({ id: user.id, name: user.name, email: user.email, role: user.role });

  res.status(201).json({
    success: true,
    data: {
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
      accessToken,
    },
  });
}));

/**
 * @swagger
 * /api/v1/auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Sign in to an existing account
 *     description: |
 *       Authenticate with email and password.
 *       On success, a JWT accessToken is returned for subsequent authenticated requests.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "john@example.com"
 *               password:
 *                 type: string
 *                 format: password
 *                 example: "securepass123"
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *                     accessToken:
 *                       type: string
 *                       description: JWT access token for authentication
 *       401:
 *         description: Invalid email or password
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               error:
 *                 message: "Invalid email or password"
 *                 code: "INVALID_CREDENTIALS"
 *       422:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       429:
 *         description: Too many authentication attempts
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RateLimitError'
 */
router.post("/login", catchAsync(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(422).json({
      success: false,
      error: { message: "Email and password are required", code: "VALIDATION_ERROR" },
    });
    return;
  }

  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (!user) {
    res.status(401).json({
      success: false,
      error: { message: "Invalid email or password", code: "INVALID_CREDENTIALS" },
    });
    return;
  }

  const isValidPassword = await bcrypt.compare(password, user.password);
  if (!isValidPassword) {
    res.status(401).json({
      success: false,
      error: { message: "Invalid email or password", code: "INVALID_CREDENTIALS" },
    });
    return;
  }

  const accessToken = signToken({ id: user.id, name: user.name, email: user.email, role: user.role });

  res.json({
    success: true,
    data: {
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
      accessToken,
    },
  });
}));

/**
 * @swagger
 * /api/v1/auth/logout:
 *   post:
 *     tags: [Auth]
 *     summary: Sign out the current user
 *     description: |
 *       Logout is a no-op on the server since JWT is stateless.
 *       The client should remove the token from localStorage.
 *     responses:
 *       200:
 *         description: Successfully logged out
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                       example: "Logged out successfully"
 *       429:
 *         description: Too many authentication attempts
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RateLimitError'
 */
router.post("/logout", (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: { message: "Logged out successfully" },
  });
});

/**
 * @swagger
 * /api/v1/auth/me:
 *   get:
 *     tags: [Auth]
 *     summary: Get current user profile
 *     description: |
 *       Retrieve the authenticated user's profile from the JWT token.
 *       Requires a valid Bearer token in the Authorization header.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *       401:
 *         description: Not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       429:
 *         description: Too many requests
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RateLimitError'
 */
router.get("/me", requireAuth, catchAsync(async (req: Request, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: (req as any).user.id },
    select: { id: true, name: true, email: true, role: true },
  });

  if (!user) {
    res.status(401).json({
      success: false,
      error: { message: "User not found", code: "UNAUTHORIZED" },
    });
    return;
  }

  res.json({
    success: true,
    data: { user },
  });
}));

/**
 * @swagger
 * /api/v1/auth/me:
 *   put:
 *     tags: [Auth]
 *     summary: Update user profile
 *     description: |
 *       Update the authenticated user's name. A fresh JWT accessToken is returned
 *       with the updated payload. Email changes are not allowed.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Jane Doe"
 *                 description: Updated name (min 2 characters)
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *                     accessToken:
 *                       type: string
 *                       description: Fresh JWT access token with updated user data
 *       401:
 *         description: Not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       422:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       429:
 *         description: Too many requests
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RateLimitError'
 */
router.put("/me", requireAuth, catchAsync(async (req: Request, res: Response) => {
  const { name } = req.body;

  if (!name || typeof name !== "string" || name.trim().length < 2) {
    res.status(422).json({
      success: false,
      error: { message: "Name must be at least 2 characters", code: "VALIDATION_ERROR" },
    });
    return;
  }

  const updated = await prisma.user.update({
    where: { id: (req as any).user.id },
    data: { name: name.trim() },
  });

  const accessToken = signToken({ id: updated.id, name: updated.name, email: updated.email, role: updated.role });

  res.json({
    success: true,
    data: {
      user: { id: updated.id, name: updated.name, email: updated.email, role: updated.role },
      accessToken,
    },
  });
}));

export default router;
