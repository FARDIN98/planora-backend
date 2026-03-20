import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { validate, validateQuery } from "../middleware/validate.js";
import { createEventSchema, updateEventSchema } from "../schemas/event.schema.js";
import { searchSchema } from "../schemas/common.schema.js";
import { eventService } from "../services/event.service.js";

const router = Router();

/**
 * @swagger
 * /api/v1/events:
 *   post:
 *     tags: [Events]
 *     summary: Create a new event
 *     description: |
 *       Create a new event. Requires authentication.
 *       The authenticated user becomes the event organizer.
 *       For paid events, the fee must be greater than 0.
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, description, date, time, venue]
 *             properties:
 *               title:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 200
 *                 example: "Tech Conference 2026"
 *               description:
 *                 type: string
 *                 minLength: 10
 *                 maxLength: 2000
 *                 example: "A comprehensive technology conference covering AI, cloud, and more."
 *               date:
 *                 type: string
 *                 format: date-time
 *                 example: "2026-06-15T09:00:00Z"
 *               time:
 *                 type: string
 *                 pattern: "^\\d{2}:\\d{2}$"
 *                 example: "09:00"
 *               venue:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 200
 *                 example: "Convention Center, Dhaka"
 *               visibility:
 *                 type: string
 *                 enum: [PUBLIC, PRIVATE]
 *                 default: PUBLIC
 *               type:
 *                 type: string
 *                 enum: [FREE, PAID]
 *                 default: FREE
 *               fee:
 *                 type: number
 *                 minimum: 0
 *                 default: 0
 *               category:
 *                 type: string
 *                 maxLength: 50
 *                 default: General
 *     responses:
 *       201:
 *         description: Event created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Event'
 *       401:
 *         description: Unauthorized
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
 */
router.post("/", requireAuth, validate(createEventSchema), async (req, res) => {
  try {
    const event = await eventService.create(req.body, (req as any).user.id);
    res.status(201).json({ success: true, data: event });
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
 * /api/v1/events:
 *   get:
 *     tags: [Events]
 *     summary: List events with search, filter, and pagination
 *     description: |
 *       Returns a paginated list of events. Supports search by title or organizer name,
 *       filtering by visibility, type, and category, and sorting by date, createdAt, or title.
 *       No authentication required.
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
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by event title or organizer name
 *       - in: query
 *         name: visibility
 *         schema:
 *           type: string
 *           enum: [PUBLIC, PRIVATE]
 *         description: Filter by event visibility
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [FREE, PAID]
 *         description: Filter by event type
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by category
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [date, createdAt, title]
 *           default: date
 *         description: Sort field
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: asc
 *         description: Sort direction
 *     responses:
 *       200:
 *         description: Events list with pagination metadata
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/EventListResponse'
 */
router.get("/", validateQuery(searchSchema), async (req, res) => {
  try {
    const result = await eventService.list((req as any).validatedQuery);
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
 * /api/v1/events/{id}:
 *   get:
 *     tags: [Events]
 *     summary: Get event details
 *     description: |
 *       Returns a single event with organizer info, average rating, and review count.
 *       No authentication required.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Event ID
 *     responses:
 *       200:
 *         description: Event details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   allOf:
 *                     - $ref: '#/components/schemas/Event'
 *                     - type: object
 *                       properties:
 *                         averageRating:
 *                           type: number
 *                           example: 4.5
 *                         reviewCount:
 *                           type: integer
 *                           example: 12
 *       404:
 *         description: Event not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get("/:id", async (req, res) => {
  try {
    const event = await eventService.getById(req.params.id);
    res.json({ success: true, data: event });
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
 * /api/v1/events/{id}:
 *   put:
 *     tags: [Events]
 *     summary: Update an event
 *     description: |
 *       Update an event. Only the event organizer can update their own event.
 *       All fields are optional (PATCH-style update via PUT).
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
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
 *             properties:
 *               title:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 200
 *               description:
 *                 type: string
 *                 minLength: 10
 *                 maxLength: 2000
 *               date:
 *                 type: string
 *                 format: date-time
 *               time:
 *                 type: string
 *                 pattern: "^\\d{2}:\\d{2}$"
 *               venue:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 200
 *               visibility:
 *                 type: string
 *                 enum: [PUBLIC, PRIVATE]
 *               type:
 *                 type: string
 *                 enum: [FREE, PAID]
 *               fee:
 *                 type: number
 *                 minimum: 0
 *               category:
 *                 type: string
 *                 maxLength: 50
 *     responses:
 *       200:
 *         description: Event updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Event'
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
router.put("/:id", requireAuth, validate(updateEventSchema), async (req, res) => {
  try {
    const event = await eventService.update(
      req.params.id,
      req.body,
      (req as any).user.id,
    );
    res.json({ success: true, data: event });
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
 * /api/v1/events/{id}:
 *   delete:
 *     tags: [Events]
 *     summary: Delete an event
 *     description: |
 *       Delete an event. Only the event organizer can delete their own event.
 *       Cascade deletes associated registrations, reviews, and invitations.
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Event ID
 *     responses:
 *       200:
 *         description: Event deleted successfully
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
 *                       example: "Event deleted successfully"
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
router.delete("/:id", requireAuth, async (req, res) => {
  try {
    const result = await eventService.remove(
      req.params.id,
      (req as any).user.id,
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

export default router;
