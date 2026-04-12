import { Router } from "express";
import { z } from "zod";
import rateLimit from "express-rate-limit";
import { validate } from "../middleware/validate.js";
import { chatbotService } from "../services/chatbot.service.js";
import { catchAsync } from "../utils/catch-async.js";

const router = Router();

// Stricter rate limit for chatbot to prevent abuse of AI API calls
const chatbotLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  limit: 10, // 10 requests per minute per IP
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      message: "Too many chatbot requests, please try again in a minute",
      code: "RATE_LIMIT_EXCEEDED",
    },
  },
});

const chatSchema = z.object({
  message: z.string().min(1, "Message cannot be empty"),
  history: z
    .array(
      z.object({
        role: z.string(),
        content: z.string(),
      }),
    )
    .optional()
    .default([]),
});

/**
 * @swagger
 * /api/v1/chatbot/chat:
 *   post:
 *     tags: [Chatbot]
 *     summary: Send a message to the AI chatbot
 *     description: |
 *       Send a message to the Planora AI assistant powered by Groq (Llama 3.3 70B).
 *       Supports conversation history for contextual responses.
 *       Returns a fallback message if the API key is not configured.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [message]
 *             properties:
 *               message:
 *                 type: string
 *                 example: "How do I create an event?"
 *               history:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     role:
 *                       type: string
 *                       enum: [user, assistant]
 *                     content:
 *                       type: string
 *     responses:
 *       200:
 *         description: Chatbot response
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
 *                     reply:
 *                       type: string
 *       422:
 *         description: Invalid message
 */
router.post("/chat", chatbotLimiter, validate(chatSchema), catchAsync(async (req, res) => {
  const { message, history } = req.body;
  const reply = await chatbotService.chat(message, history);
  res.json({ success: true, data: { reply } });
}));

export default router;
