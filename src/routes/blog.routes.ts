import { Router } from "express";
import { requireAuth, requireAdmin } from "../middleware/auth.js";
import { validate, validateQuery } from "../middleware/validate.js";
import { createBlogPostSchema, updateBlogPostSchema } from "../schemas/blog.schema.js";
import { paginationSchema } from "../schemas/common.schema.js";
import { blogService } from "../services/blog.service.js";
import { catchAsync } from "../utils/catch-async.js";

const router = Router();

/**
 * @swagger
 * /api/v1/blog:
 *   get:
 *     tags: [Blog]
 *     summary: List published blog posts
 *     description: Returns a paginated list of published blog posts, ordered by newest first.
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           default: 12
 *     responses:
 *       200:
 *         description: Blog posts list
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
 *                     posts:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/BlogPost'
 *                     total:
 *                       type: integer
 *                     page:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 */
router.get("/", validateQuery(paginationSchema), catchAsync(async (req, res) => {
  const { page, limit } = (req as any).validatedQuery;
  const result = await blogService.getBlogPosts(page, limit);
  res.json({ success: true, data: result });
}));

/**
 * @swagger
 * /api/v1/blog/{id}:
 *   get:
 *     tags: [Blog]
 *     summary: Get a single blog post
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Blog post details
 *       404:
 *         description: Blog post not found
 */
router.get("/:id", catchAsync(async (req, res) => {
  const post = await blogService.getBlogPostById(req.params.id);
  res.json({ success: true, data: post });
}));

/**
 * @swagger
 * /api/v1/blog:
 *   post:
 *     tags: [Blog]
 *     summary: Create a new blog post
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, content, coverImage]
 *             properties:
 *               title:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 200
 *               content:
 *                 type: string
 *                 minLength: 10
 *                 description: Rich text HTML content
 *               coverImage:
 *                 type: string
 *                 format: uri
 *               tags:
 *                 type: string
 *                 description: Comma-separated tags
 *     responses:
 *       201:
 *         description: Blog post created
 *       401:
 *         description: Unauthorized
 *       422:
 *         description: Validation error
 */
router.post("/", requireAuth, validate(createBlogPostSchema), catchAsync(async (req, res) => {
  const post = await blogService.createBlogPost((req as any).user.id, req.body);
  res.status(201).json({ success: true, data: post });
}));

/**
 * @swagger
 * /api/v1/blog/{id}:
 *   put:
 *     tags: [Blog]
 *     summary: Update a blog post
 *     description: Only the author can update their own post.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               content:
 *                 type: string
 *               coverImage:
 *                 type: string
 *                 format: uri
 *               tags:
 *                 type: string
 *     responses:
 *       200:
 *         description: Blog post updated
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Not the author
 *       404:
 *         description: Blog post not found
 */
router.put("/:id", requireAuth, validate(updateBlogPostSchema), catchAsync(async (req, res) => {
  const post = await blogService.updateBlogPost(req.params.id, (req as any).user.id, req.body);
  res.json({ success: true, data: post });
}));

/**
 * @swagger
 * /api/v1/blog/{id}:
 *   delete:
 *     tags: [Blog]
 *     summary: Delete a blog post
 *     description: Author can delete own post. Admin can delete any post.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Blog post deleted
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Not authorized
 *       404:
 *         description: Blog post not found
 */
router.delete("/:id", requireAuth, catchAsync(async (req, res) => {
  const result = await blogService.deleteBlogPost(
    req.params.id,
    (req as any).user.id,
    (req as any).user.role === "admin",
  );
  res.json({ success: true, data: result });
}));

// --- Admin Blog Routes ---

const adminBlogRouter = Router();

/**
 * @swagger
 * /api/v1/admin/blog:
 *   get:
 *     tags: [Admin]
 *     summary: List all blog posts (admin moderation)
 *     description: Returns all blog posts including unpublished, for admin moderation.
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
 *           default: 12
 *     responses:
 *       200:
 *         description: All blog posts
 *       403:
 *         description: Forbidden (not admin)
 */
adminBlogRouter.get("/", requireAdmin, validateQuery(paginationSchema), catchAsync(async (req, res) => {
  const { page, limit } = (req as any).validatedQuery;
  const result = await blogService.getAllBlogPosts(page, limit);
  res.json({ success: true, data: result });
}));

/**
 * @swagger
 * /api/v1/admin/blog/{id}:
 *   delete:
 *     tags: [Admin]
 *     summary: Delete any blog post (admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Blog post deleted
 *       403:
 *         description: Forbidden (not admin)
 *       404:
 *         description: Blog post not found
 */
adminBlogRouter.delete("/:id", requireAdmin, catchAsync(async (req, res) => {
  const result = await blogService.deleteBlogPost(req.params.id, "", true);
  res.json({ success: true, data: result });
}));

export { adminBlogRouter };
export default router;
