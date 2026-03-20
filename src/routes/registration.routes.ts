import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { validate, validateQuery } from "../middleware/validate.js";
import { updateRegistrationSchema } from "../schemas/registration.schema.js";
import { paginationSchema } from "../schemas/common.schema.js";
import { registrationService } from "../services/registration.service.js";

const router = Router({ mergeParams: true });

/**
 * @swagger
 * /api/v1/events/{eventId}/registrations:
 *   post:
 *     tags: [Registrations]
 *     summary: Register for an event
 *     description: |
 *       Register the authenticated user for an event. Behavior depends on event type:
 *       - **Public + Free**: Instantly approved
 *       - **Public + Paid**: Returns Stripe Checkout URL, approved after payment
 *       - **Private + Free**: Pending host approval
 *       - **Private + Paid**: Returns Stripe Checkout URL, pending host approval after payment
 *
 *       Users cannot register for their own events. Duplicate registrations return 409.
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: string
 *         description: Event ID
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               successUrl:
 *                 type: string
 *                 description: URL to redirect after successful payment
 *               cancelUrl:
 *                 type: string
 *                 description: URL to redirect if payment is cancelled
 *     responses:
 *       201:
 *         description: Registration created or checkout URL returned
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   oneOf:
 *                     - type: object
 *                       properties:
 *                         registration:
 *                           $ref: '#/components/schemas/Registration'
 *                         requiresPayment:
 *                           type: boolean
 *                           example: false
 *                     - type: object
 *                       properties:
 *                         checkoutUrl:
 *                           type: string
 *                           example: "https://checkout.stripe.com/..."
 *                         requiresPayment:
 *                           type: boolean
 *                           example: true
 *       400:
 *         description: Self-registration attempt
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Event not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       409:
 *         description: Already registered
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post("/", requireAuth, async (req, res) => {
  try {
    const eventId = req.params.eventId;
    const userId = (req as any).user.id;
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
    const successUrl =
      req.body.successUrl ||
      `${frontendUrl}/events/${eventId}?payment=success`;
    const cancelUrl =
      req.body.cancelUrl ||
      `${frontendUrl}/events/${eventId}?payment=cancelled`;

    const result = await registrationService.register(
      eventId,
      userId,
      successUrl,
      cancelUrl,
    );
    res.status(201).json({ success: true, data: result });
  } catch (error: any) {
    const status = error.status || 500;
    res.status(status).json({
      success: false,
      error: {
        message: error.message || "Internal server error",
        code: error.code || "INTERNAL_ERROR",
      },
    });
  }
});

/**
 * @swagger
 * /api/v1/events/{eventId}/registrations:
 *   get:
 *     tags: [Registrations]
 *     summary: List registrations for an event
 *     description: |
 *       Returns a paginated list of registrations for an event.
 *       Only the event organizer (host) can view registrations.
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: string
 *         description: Event ID
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           default: 10
 *         description: Items per page
 *     responses:
 *       200:
 *         description: Paginated list of registrations
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
 *                     registrations:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Registration'
 *                     total:
 *                       type: integer
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Not the event organizer
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Event not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get("/", requireAuth, validateQuery(paginationSchema), async (req, res) => {
  try {
    const eventId = req.params.eventId;
    const userId = (req as any).user.id;
    const { page, limit } = (req as any).validatedQuery;

    const result = await registrationService.listByEvent(
      eventId,
      userId,
      page,
      limit,
    );
    res.json({ success: true, data: result });
  } catch (error: any) {
    const status = error.status || 500;
    res.status(status).json({
      success: false,
      error: {
        message: error.message || "Internal server error",
        code: error.code || "INTERNAL_ERROR",
      },
    });
  }
});

/**
 * @swagger
 * /api/v1/events/{eventId}/registrations/{registrationId}:
 *   patch:
 *     tags: [Registrations]
 *     summary: Update registration status (approve/reject/ban)
 *     description: |
 *       Update the status of a registration. Only the event organizer can perform this action.
 *       Valid status transitions: APPROVED, REJECTED, BANNED.
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: string
 *         description: Event ID
 *       - in: path
 *         name: registrationId
 *         required: true
 *         schema:
 *           type: string
 *         description: Registration ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [APPROVED, REJECTED, BANNED]
 *     responses:
 *       200:
 *         description: Registration status updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Registration'
 *       400:
 *         description: Invalid status transition (e.g., already banned)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Not the event organizer
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Registration not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.patch("/:registrationId", requireAuth, validate(updateRegistrationSchema), async (req, res) => {
  try {
    const { eventId, registrationId } = req.params;
    const userId = (req as any).user.id;

    const registration = await registrationService.updateStatus(
      eventId,
      registrationId,
      req.body.status,
      userId,
    );
    res.json({ success: true, data: registration });
  } catch (error: any) {
    const status = error.status || 500;
    res.status(status).json({
      success: false,
      error: {
        message: error.message || "Internal server error",
        code: error.code || "INTERNAL_ERROR",
      },
    });
  }
});

export default router;

// --- User-facing registration routes (mounted at /api/v1/registrations) ---

const userRegistrationRouter = Router();

/**
 * @swagger
 * /api/v1/registrations/my:
 *   get:
 *     tags: [Registrations]
 *     summary: Get my registrations
 *     description: |
 *       Returns a paginated list of the authenticated user's event registrations,
 *       including event details and organizer info.
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           default: 10
 *         description: Items per page
 *     responses:
 *       200:
 *         description: User's registrations with event details
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
 *                     registrations:
 *                       type: array
 *                       items:
 *                         allOf:
 *                           - $ref: '#/components/schemas/Registration'
 *                           - type: object
 *                             properties:
 *                               event:
 *                                 $ref: '#/components/schemas/Event'
 *                     total:
 *                       type: integer
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
userRegistrationRouter.get("/my", requireAuth, validateQuery(paginationSchema), async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const { page, limit } = (req as any).validatedQuery;

    const result = await registrationService.getMyRegistrations(
      userId,
      page,
      limit,
    );
    res.json({ success: true, data: result });
  } catch (error: any) {
    const status = error.status || 500;
    res.status(status).json({
      success: false,
      error: {
        message: error.message || "Internal server error",
        code: error.code || "INTERNAL_ERROR",
      },
    });
  }
});

export { userRegistrationRouter };
