import { Router } from "express";

const router = Router();

/**
 * @swagger
 * /api/v1/health:
 *   get:
 *     tags: [Health]
 *     summary: Check server health
 *     description: |
 *       Returns the current server status and timestamp.
 *       Use this endpoint to verify the API is running and reachable.
 *       No authentication required.
 *     responses:
 *       200:
 *         description: Server is healthy
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
 *                     status:
 *                       type: string
 *                       example: "ok"
 *                     version:
 *                       type: string
 *                       example: "1.0.0"
 *                     timestamp:
 *                       type: string
 *                       format: date-time
 */
router.get("/", (_req, res) => {
  res.json({
    success: true,
    data: {
      status: "ok",
      version: "1.0.0",
      timestamp: new Date().toISOString(),
    },
  });
});

export default router;
