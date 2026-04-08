import { Router } from "express";
import { OAuth2Client } from "google-auth-library";
import { prisma } from "../lib/prisma.js";
import { signToken } from "../lib/jwt.js";
import { catchAsync } from "../utils/catch-async.js";

const router = Router();

/**
 * @swagger
 * /api/v1/auth/google:
 *   post:
 *     tags: [Auth]
 *     summary: Authenticate with Google OAuth
 *     description: |
 *       Verify a Google ID token and return a JWT access token.
 *       If the user doesn't exist, a new account is created.
 *       If the user exists by email but has no googleId, the accounts are linked.
 *       Returns 503 if GOOGLE_CLIENT_ID is not configured.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [idToken]
 *             properties:
 *               idToken:
 *                 type: string
 *                 description: Google ID token from client-side sign-in
 *     responses:
 *       200:
 *         description: Authentication successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *                     accessToken:
 *                       type: string
 *       400:
 *         description: Invalid or missing ID token
 *       503:
 *         description: Google OAuth not configured
 */
router.post("/google", catchAsync(async (req, res) => {
  const clientId = process.env.GOOGLE_CLIENT_ID;

  if (!clientId) {
    res.status(503).json({
      success: false,
      error: { message: "Google OAuth is not configured", code: "SERVICE_UNAVAILABLE" },
    });
    return;
  }

  const { idToken } = req.body;

  if (!idToken || typeof idToken !== "string") {
    res.status(400).json({
      success: false,
      error: { message: "ID token is required", code: "VALIDATION_ERROR" },
    });
    return;
  }

  const client = new OAuth2Client(clientId);

  let payload;
  try {
    const ticket = await client.verifyIdToken({
      idToken,
      audience: clientId,
    });
    payload = ticket.getPayload();
  } catch {
    res.status(401).json({
      success: false,
      error: { message: "Invalid Google ID token", code: "INVALID_TOKEN" },
    });
    return;
  }

  if (!payload || !payload.email || !payload.sub) {
    res.status(401).json({
      success: false,
      error: { message: "Invalid token payload", code: "INVALID_TOKEN" },
    });
    return;
  }

  const { email, name, sub: googleId } = payload;

  // Find user by googleId or email
  let user = await prisma.user.findFirst({
    where: {
      OR: [{ googleId }, { email }],
    },
  });

  if (!user) {
    // Create new user
    user = await prisma.user.create({
      data: {
        name: name || "Google User",
        email,
        password: "", // Empty password for OAuth users
        googleId,
      },
    });
  } else if (!user.googleId) {
    // Link Google account to existing email user
    user = await prisma.user.update({
      where: { id: user.id },
      data: { googleId },
    });
  }

  const accessToken = signToken({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  });

  res.json({
    success: true,
    data: {
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
      accessToken,
    },
  });
}));

export default router;
