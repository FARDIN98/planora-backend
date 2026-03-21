import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { validate, validateQuery } from "../middleware/validate.js";
import { createReviewSchema, updateReviewSchema } from "../schemas/review.schema.js";
import { paginationSchema } from "../schemas/common.schema.js";
import { reviewService } from "../services/review.service.js";
import { catchAsync } from "../utils/catch-async.js";

// --- Event-scoped router (mounted at /api/v1/events/:eventId/reviews) ---

const router = Router({ mergeParams: true });

/**
 * @swagger
 * /api/v1/events/{eventId}/reviews:
 *   post:
 *     tags: [Reviews]
 *     summary: Create a review for an event
 *     description: |
 *       Submit a review with a rating (1-5) and comment (10-500 chars) for an event.
 *       Only APPROVED participants can review. Organizers cannot review their own events.
 *       Each user can only submit one review per event.
 *     security:
 *       - bearerAuth: []
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
 *             required: [rating, comment]
 *             properties:
 *               rating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *                 example: 4
 *               comment:
 *                 type: string
 *                 minLength: 10
 *                 maxLength: 500
 *                 example: "Great event! Really enjoyed the sessions and networking."
 *     responses:
 *       201:
 *         description: Review created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Review'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Not eligible (not approved participant or self-review)
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
 *         description: Already reviewed this event
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       422:
 *         description: Validation failed
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
router.post("/", requireAuth, validate(createReviewSchema), catchAsync(async (req, res) => {
  const review = await reviewService.create(
    req.params.eventId,
    (req as any).user.id,
    req.body,
  );
  res.status(201).json({ success: true, data: review });
}));

/**
 * @swagger
 * /api/v1/events/{eventId}/reviews:
 *   get:
 *     tags: [Reviews]
 *     summary: List reviews for an event
 *     description: |
 *       Returns a paginated list of reviews for an event, including reviewer info.
 *       No authentication required (public endpoint). Returns 404 if event does not exist.
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
 *         description: Paginated list of reviews
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
 *                     reviews:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Review'
 *                     total:
 *                       type: integer
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *       404:
 *         description: Event not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get("/", validateQuery(paginationSchema), catchAsync(async (req, res) => {
  const { page, limit } = (req as any).validatedQuery;
  const result = await reviewService.listByEvent(
    req.params.eventId,
    page,
    limit,
  );
  res.json({ success: true, data: result });
}));

export default router;

// --- User-scoped review routes (mounted at /api/v1/reviews) ---

const userReviewRouter = Router();

/**
 * @swagger
 * /api/v1/reviews/my:
 *   get:
 *     tags: [Reviews]
 *     summary: Get my reviews
 *     description: |
 *       Returns a paginated list of reviews submitted by the authenticated user,
 *       including event details (id, title, date).
 *     security:
 *       - bearerAuth: []
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
 *         description: User's reviews with event details
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
 *                     reviews:
 *                       type: array
 *                       items:
 *                         allOf:
 *                           - $ref: '#/components/schemas/Review'
 *                           - type: object
 *                             properties:
 *                               event:
 *                                 type: object
 *                                 properties:
 *                                   id:
 *                                     type: string
 *                                   title:
 *                                     type: string
 *                                   date:
 *                                     type: string
 *                                     format: date-time
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
userReviewRouter.get("/my", requireAuth, validateQuery(paginationSchema), catchAsync(async (req, res) => {
  const userId = (req as any).user.id;
  const { page, limit } = (req as any).validatedQuery;
  const result = await reviewService.getMyReviews(userId, page, limit);
  res.json({ success: true, data: result });
}));

/**
 * @swagger
 * /api/v1/reviews/{reviewId}:
 *   put:
 *     tags: [Reviews]
 *     summary: Update a review
 *     description: |
 *       Update rating and/or comment of a review. Only the review author can edit.
 *       At least one field (rating or comment) must be provided.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: reviewId
 *         required: true
 *         schema:
 *           type: string
 *         description: Review ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               rating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *                 example: 5
 *               comment:
 *                 type: string
 *                 minLength: 10
 *                 maxLength: 500
 *                 example: "Updated: Even better than I initially thought!"
 *     responses:
 *       200:
 *         description: Review updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Review'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Not the review author
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Review not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       422:
 *         description: Validation failed
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
userReviewRouter.put("/:reviewId", requireAuth, validate(updateReviewSchema), catchAsync(async (req, res) => {
  const review = await reviewService.update(
    req.params.reviewId,
    (req as any).user.id,
    req.body,
  );
  res.json({ success: true, data: review });
}));

/**
 * @swagger
 * /api/v1/reviews/{reviewId}:
 *   delete:
 *     tags: [Reviews]
 *     summary: Delete a review
 *     description: |
 *       Hard delete a review from the database. Only the review author can delete.
 *       After deletion, event average rating and review count recalculate on next fetch.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: reviewId
 *         required: true
 *         schema:
 *           type: string
 *         description: Review ID
 *     responses:
 *       200:
 *         description: Review deleted successfully
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
 *                       example: "Review deleted successfully"
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Not the review author
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Review not found
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
userReviewRouter.delete("/:reviewId", requireAuth, catchAsync(async (req, res) => {
  const result = await reviewService.remove(
    req.params.reviewId,
    (req as any).user.id,
  );
  res.json({ success: true, data: result });
}));

export { userReviewRouter };
