import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { validate, validateQuery } from "../middleware/validate.js";
import { createInvitationSchema, respondInvitationSchema } from "../schemas/invitation.schema.js";
import { paginationSchema } from "../schemas/common.schema.js";
import { invitationService } from "../services/invitation.service.js";
import { catchAsync } from "../utils/catch-async.js";

const router = Router({ mergeParams: true });

/**
 * @swagger
 * /api/v1/events/{eventId}/invitations:
 *   post:
 *     tags: [Invitations]
 *     summary: Invite a user to an event
 *     description: |
 *       Host invites a user to their event. Only the event organizer can send invitations.
 *       - Cannot invite a user who is already registered (409)
 *       - Cannot invite a user who already has a pending invitation (409)
 *       - Re-inviting after a decline is allowed (old invitation deleted, new one created)
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
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [receiverId]
 *             properties:
 *               receiverId:
 *                 type: string
 *                 description: User ID of the person to invite
 *     responses:
 *       201:
 *         description: Invitation created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Invitation'
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
 *       409:
 *         description: User already registered or already invited
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
router.post("/", requireAuth, validate(createInvitationSchema), catchAsync(async (req, res) => {
  const eventId = req.params.eventId;
  const userId = (req as any).user.id;

  const invitation = await invitationService.create(eventId, userId, req.body.receiverId);
  res.status(201).json({ success: true, data: invitation });
}));

/**
 * @swagger
 * /api/v1/events/{eventId}/invitations:
 *   get:
 *     tags: [Invitations]
 *     summary: List invitations for an event
 *     description: |
 *       Returns a paginated list of invitations for an event.
 *       Only the event organizer (host) can view invitations.
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
 *         description: Paginated list of invitations
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
 *                     invitations:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Invitation'
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
 *       429:
 *         description: Too many requests
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RateLimitError'
 */
router.get("/", requireAuth, validateQuery(paginationSchema), catchAsync(async (req, res) => {
  const eventId = req.params.eventId;
  const userId = (req as any).user.id;
  const { page, limit } = (req as any).validatedQuery;

  const result = await invitationService.listByEvent(eventId, userId, page, limit);
  res.json({ success: true, data: result });
}));

export default router;

// --- User-facing invitation routes (mounted at /api/v1/invitations) ---

const userInvitationRouter = Router();

/**
 * @swagger
 * /api/v1/invitations/my:
 *   get:
 *     tags: [Invitations]
 *     summary: Get my invitations
 *     description: |
 *       Returns a paginated list of the authenticated user's received invitations,
 *       including event details (with type for Pay & Accept button) and sender info.
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
 *         description: User's invitations with event details
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
 *                     invitations:
 *                       type: array
 *                       items:
 *                         allOf:
 *                           - $ref: '#/components/schemas/Invitation'
 *                           - type: object
 *                             properties:
 *                               event:
 *                                 $ref: '#/components/schemas/Event'
 *                               sender:
 *                                 type: object
 *                                 properties:
 *                                   id:
 *                                     type: string
 *                                   name:
 *                                     type: string
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
 *       429:
 *         description: Too many requests
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RateLimitError'
 */
userInvitationRouter.get("/my", requireAuth, validateQuery(paginationSchema), catchAsync(async (req, res) => {
  const userId = (req as any).user.id;
  const { page, limit } = (req as any).validatedQuery;

  const result = await invitationService.getMyInvitations(userId, page, limit);
  res.json({ success: true, data: result });
}));

/**
 * @swagger
 * /api/v1/invitations/{invitationId}/respond:
 *   post:
 *     tags: [Invitations]
 *     summary: Accept or decline an invitation
 *     description: |
 *       Respond to a pending invitation. Only the invitee can respond.
 *       - **Decline**: Sets invitation status to DECLINED
 *       - **Accept (free event)**: Sets ACCEPTED status and creates APPROVED registration
 *       - **Accept (paid event)**: Returns Stripe Checkout URL for "Pay & Accept" flow.
 *         After payment, the webhook sets ACCEPTED and creates APPROVED registration.
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: invitationId
 *         required: true
 *         schema:
 *           type: string
 *         description: Invitation ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [action]
 *             properties:
 *               action:
 *                 type: string
 *                 enum: [accept, decline]
 *               successUrl:
 *                 type: string
 *                 format: uri
 *                 description: Redirect URL after successful payment (paid events only)
 *               cancelUrl:
 *                 type: string
 *                 format: uri
 *                 description: Redirect URL if payment is cancelled (paid events only)
 *     responses:
 *       200:
 *         description: Invitation response processed
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
 *                       description: Free event accept or decline
 *                       properties:
 *                         invitation:
 *                           $ref: '#/components/schemas/Invitation'
 *                         registration:
 *                           $ref: '#/components/schemas/Registration'
 *                         requiresPayment:
 *                           type: boolean
 *                           example: false
 *                     - type: object
 *                       description: Paid event accept -- Stripe Checkout
 *                       properties:
 *                         checkoutUrl:
 *                           type: string
 *                           example: "https://checkout.stripe.com/..."
 *                         requiresPayment:
 *                           type: boolean
 *                           example: true
 *       400:
 *         description: Invalid invitation state
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
 *         description: Not the invitee
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Invitation not found
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
userInvitationRouter.post("/:invitationId/respond", requireAuth, validate(respondInvitationSchema), catchAsync(async (req, res) => {
  const userId = (req as any).user.id;
  const { invitationId } = req.params;

  const result = await invitationService.respond(
    invitationId,
    userId,
    req.body.action,
    req.body.successUrl,
    req.body.cancelUrl,
  );
  res.json({ success: true, data: result });
}));

export { userInvitationRouter };
