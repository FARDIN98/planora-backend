import { Router } from "express";
import { requireAuth, optionalAuth, requireAdmin } from "../middleware/auth.js";
import { statsService } from "../services/stats.service.js";
import { catchAsync } from "../utils/catch-async.js";

const router = Router();

/**
 * @swagger
 * /api/v1/stats/platform:
 *   get:
 *     tags: [Stats]
 *     summary: Get platform statistics
 *     description: Returns total counts for events, users, registrations, and reviews. Public endpoint.
 *     responses:
 *       200:
 *         description: Platform statistics
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
 *                     totalEvents:
 *                       type: integer
 *                     totalUsers:
 *                       type: integer
 *                     totalRegistrations:
 *                       type: integer
 *                     totalReviews:
 *                       type: integer
 */
router.get("/platform", optionalAuth, catchAsync(async (_req, res) => {
  const stats = await statsService.getPlatformStats();
  res.json({ success: true, data: stats });
}));

/**
 * @swagger
 * /api/v1/stats/homepage:
 *   get:
 *     tags: [Stats]
 *     summary: Get aggregated homepage data
 *     description: |
 *       Single endpoint returning all data needed for the homepage:
 *       featured events, upcoming events, paid events, category counts,
 *       platform stats, top organizers, and testimonials.
 *     responses:
 *       200:
 *         description: Homepage data
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
 *                     featuredEvents:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Event'
 *                     upcomingEvents:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Event'
 *                     paidEvents:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Event'
 *                     categoryCounts:
 *                       type: object
 *                       properties:
 *                         PUBLIC_FREE:
 *                           type: integer
 *                         PUBLIC_PAID:
 *                           type: integer
 *                         PRIVATE_FREE:
 *                           type: integer
 *                         PRIVATE_PAID:
 *                           type: integer
 *                     platformStats:
 *                       type: object
 *                     topOrganizers:
 *                       type: array
 *                     testimonials:
 *                       type: array
 */
router.get("/homepage", optionalAuth, catchAsync(async (_req, res) => {
  const data = await statsService.getHomepageData();
  res.json({ success: true, data });
}));

/**
 * @swagger
 * /api/v1/stats/admin/overview:
 *   get:
 *     tags: [Stats]
 *     summary: Get admin dashboard overview
 *     description: Returns total events, users, revenue, and active events count.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Admin overview data
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
 *                     totalEvents:
 *                       type: integer
 *                     totalUsers:
 *                       type: integer
 *                     totalRevenue:
 *                       type: number
 *                     activeEvents:
 *                       type: integer
 *       403:
 *         description: Forbidden (not admin)
 */
router.get("/admin/overview", requireAdmin, catchAsync(async (_req, res) => {
  const data = await statsService.getAdminOverview();
  res.json({ success: true, data });
}));

/**
 * @swagger
 * /api/v1/stats/admin/charts:
 *   get:
 *     tags: [Stats]
 *     summary: Get admin chart data
 *     description: |
 *       Returns data for admin dashboard charts: events over time,
 *       revenue overview, event type distribution, user registrations.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Chart data
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
 *                     eventsOverTime:
 *                       type: array
 *                     revenueOverview:
 *                       type: array
 *                     eventTypeDistribution:
 *                       type: array
 *                     userRegistrations:
 *                       type: array
 *       403:
 *         description: Forbidden (not admin)
 */
router.get("/admin/charts", requireAdmin, catchAsync(async (_req, res) => {
  const data = await statsService.getAdminChartData();
  res.json({ success: true, data });
}));

/**
 * @swagger
 * /api/v1/stats/user/dashboard:
 *   get:
 *     tags: [Stats]
 *     summary: Get user dashboard stats
 *     description: Returns counts for user's events, upcoming events, pending invitations, and reviews written.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User dashboard statistics
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
 *                     myEventsCount:
 *                       type: integer
 *                     upcomingEventsCount:
 *                       type: integer
 *                     pendingInvitationsCount:
 *                       type: integer
 *                     reviewsWrittenCount:
 *                       type: integer
 *       401:
 *         description: Unauthorized
 */
router.get("/user/dashboard", requireAuth, catchAsync(async (req, res) => {
  const data = await statsService.getUserDashboardStats((req as any).user.id);
  res.json({ success: true, data });
}));

export default router;
