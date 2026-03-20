import { stripeService } from "../services/stripe.service.js";
import type { Request, Response } from "express";

/**
 * @swagger
 * /api/webhooks/stripe:
 *   post:
 *     tags: [Webhooks]
 *     summary: Stripe webhook endpoint
 *     description: |
 *       Receives Stripe webhook events for payment processing.
 *       Verifies the webhook signature before processing.
 *       Handles `checkout.session.completed` events to confirm payments
 *       for event registrations and invitations.
 *
 *       **Note:** This endpoint requires a raw request body (not JSON-parsed)
 *       and the `stripe-signature` header for verification.
 *     parameters:
 *       - in: header
 *         name: stripe-signature
 *         required: true
 *         schema:
 *           type: string
 *         description: Stripe webhook signature for event verification
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             description: Raw Stripe webhook event payload
 *     responses:
 *       200:
 *         description: Webhook processed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 received:
 *                   type: boolean
 *                   example: true
 *       400:
 *         description: Missing or invalid webhook signature
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                     code:
 *                       type: string
 *                       example: MISSING_SIGNATURE
 */
export async function stripeWebhookHandler(req: Request, res: Response) {
  const sig = req.headers["stripe-signature"];

  if (!sig) {
    res.status(400).json({
      success: false,
      error: {
        message: "Missing webhook signature",
        code: "MISSING_SIGNATURE",
      },
    });
    return;
  }

  try {
    const result = await stripeService.handleWebhookEvent(
      req.body,
      sig as string,
    );
    res.json(result);
  } catch (error: any) {
    const status = error.status || 500;
    res.status(status).json({
      success: false,
      error: {
        message: error.message,
        code: error.code || "WEBHOOK_ERROR",
      },
    });
  }
}
