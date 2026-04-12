import { Router } from "express";
import { z } from "zod";
import { requireAdmin } from "../middleware/auth.js";
import { validate, validateQuery } from "../middleware/validate.js";
import { paginationSchema } from "../schemas/common.schema.js";
import { newsletterService } from "../services/newsletter.service.js";
import { catchAsync } from "../utils/catch-async.js";

const router = Router();

const subscribeSchema = z.object({
  email: z.string().email("Please provide a valid email address"),
});

const unsubscribeSchema = z.object({
  email: z.string().email("Please provide a valid email address"),
});

/**
 * @swagger
 * /api/v1/newsletter/subscribe:
 *   post:
 *     tags: [Newsletter]
 *     summary: Subscribe to the newsletter
 *     description: Add an email to the newsletter subscription list. Duplicate emails are handled gracefully.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "subscriber@example.com"
 *     responses:
 *       201:
 *         description: Successfully subscribed
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
 *                     message:
 *                       type: string
 *       422:
 *         description: Invalid email
 */
router.post("/subscribe", validate(subscribeSchema), catchAsync(async (req, res) => {
  const result = await newsletterService.subscribe(req.body.email);
  res.status(201).json({ success: true, data: result });
}));

/**
 * @swagger
 * /api/v1/newsletter/subscribers:
 *   get:
 *     tags: [Newsletter]
 *     summary: List newsletter subscribers (admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: Subscriber list with pagination
 *       403:
 *         description: Forbidden (not admin)
 */
router.get("/subscribers", requireAdmin, validateQuery(paginationSchema), catchAsync(async (req, res) => {
  const { page, limit } = (req as any).validatedQuery;
  const result = await newsletterService.getSubscribers(page, limit);
  res.json({ success: true, data: result });
}));

/**
 * @swagger
 * /api/v1/newsletter/unsubscribe:
 *   delete:
 *     tags: [Newsletter]
 *     summary: Unsubscribe from the newsletter
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: Successfully unsubscribed
 *       422:
 *         description: Invalid email
 */
router.delete("/unsubscribe", validate(unsubscribeSchema), catchAsync(async (req, res) => {
  const result = await newsletterService.unsubscribe(req.body.email);
  res.json({ success: true, data: result });
}));

export default router;
