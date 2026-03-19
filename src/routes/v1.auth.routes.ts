import { Router } from "express";
import { fromNodeHeaders } from "better-auth/node";
import { auth } from "../lib/auth.js";
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
 *       On success, a session cookie is set automatically (autoSignIn is enabled).
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
 *                 description: Full name of the user
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
 *       200:
 *         description: Account created successfully. Session cookie is set.
 *         headers:
 *           Set-Cookie:
 *             description: Session cookie for authentication
 *             schema:
 *               type: string
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
 *                     session:
 *                       $ref: '#/components/schemas/Session'
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
 */
router.post("/register", async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      res.status(422).json({
        success: false,
        error: { message: "Name, email, and password are required", code: "VALIDATION_ERROR" },
      });
      return;
    }

    if (password.length < 8) {
      res.status(422).json({
        success: false,
        error: { message: "Password must be at least 8 characters", code: "VALIDATION_ERROR" },
      });
      return;
    }

    const result = await auth.api.signUpEmail({
      body: { name, email, password },
      headers: fromNodeHeaders(req.headers),
    });

    // Forward Set-Cookie headers from Better Auth
    const setCookieHeader = (result as any)?.headers?.get?.("set-cookie");
    if (setCookieHeader) {
      res.setHeader("set-cookie", setCookieHeader);
    }

    res.json({
      success: true,
      data: {
        user: result.user,
        session: result.session,
      },
    });
  } catch (error: any) {
    if (error?.message?.toLowerCase().includes("already") || error?.code === "USER_ALREADY_EXISTS") {
      res.status(409).json({
        success: false,
        error: { message: "An account with this email already exists", code: "USER_ALREADY_EXISTS" },
      });
      return;
    }
    res.status(500).json({
      success: false,
      error: { message: "Internal server error", code: "INTERNAL_ERROR" },
    });
  }
});

/**
 * @swagger
 * /api/v1/auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Sign in to an existing account
 *     description: |
 *       Authenticate with email and password.
 *       On success, a session cookie is set automatically.
 *       Use this cookie for subsequent authenticated requests.
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
 *         description: Login successful. Session cookie is set.
 *         headers:
 *           Set-Cookie:
 *             description: Session cookie for authentication
 *             schema:
 *               type: string
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
 *                     session:
 *                       $ref: '#/components/schemas/Session'
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
 */
router.post("/login", async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(422).json({
        success: false,
        error: { message: "Email and password are required", code: "VALIDATION_ERROR" },
      });
      return;
    }

    const result = await auth.api.signInEmail({
      body: { email, password },
      headers: fromNodeHeaders(req.headers),
    });

    const setCookieHeader = (result as any)?.headers?.get?.("set-cookie");
    if (setCookieHeader) {
      res.setHeader("set-cookie", setCookieHeader);
    }

    res.json({
      success: true,
      data: {
        user: result.user,
        session: result.session,
      },
    });
  } catch (error: any) {
    res.status(401).json({
      success: false,
      error: { message: "Invalid email or password", code: "INVALID_CREDENTIALS" },
    });
  }
});

/**
 * @swagger
 * /api/v1/auth/logout:
 *   post:
 *     tags: [Auth]
 *     summary: Sign out the current user
 *     description: |
 *       Invalidate the current session and clear the session cookie.
 *       Requires an active session (cookie-based authentication).
 *     security:
 *       - cookieAuth: []
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
 *       401:
 *         description: No active session
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post("/logout", async (req: Request, res: Response) => {
  try {
    await auth.api.signOut({
      headers: fromNodeHeaders(req.headers),
    });

    res.json({
      success: true,
      data: { message: "Logged out successfully" },
    });
  } catch {
    res.status(401).json({
      success: false,
      error: { message: "No active session", code: "UNAUTHORIZED" },
    });
  }
});

/**
 * @swagger
 * /api/v1/auth/session:
 *   get:
 *     tags: [Auth]
 *     summary: Get current session and user info
 *     description: |
 *       Retrieve the authenticated user's profile and session details.
 *       Requires a valid session cookie. Use this to check if a user is
 *       currently logged in and to fetch their profile data.
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Active session found
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
 *                     session:
 *                       $ref: '#/components/schemas/Session'
 *       401:
 *         description: No active session
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               error:
 *                 message: "Unauthorized"
 *                 code: "UNAUTHORIZED"
 */
router.get("/session", async (req: Request, res: Response) => {
  try {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });

    if (!session) {
      res.status(401).json({
        success: false,
        error: { message: "Unauthorized", code: "UNAUTHORIZED" },
      });
      return;
    }

    res.json({
      success: true,
      data: {
        user: session.user,
        session: session.session,
      },
    });
  } catch {
    res.status(401).json({
      success: false,
      error: { message: "Unauthorized", code: "UNAUTHORIZED" },
    });
  }
});

export default router;
