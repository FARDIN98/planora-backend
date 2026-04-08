import { prisma } from "../lib/prisma.js";
import type { CreateBlogPostInput, UpdateBlogPostInput } from "../schemas/blog.schema.js";

function stripHtmlTags(html: string): string {
  return html.replace(/<[^>]*>/g, "").trim();
}

function generateExcerpt(content: string, maxLength = 200): string {
  const text = stripHtmlTags(content);
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength).trimEnd() + "...";
}

const authorSelect = {
  id: true,
  name: true,
  email: true,
};

async function createBlogPost(authorId: string, data: CreateBlogPostInput) {
  const excerpt = generateExcerpt(data.content);

  const post = await prisma.blogPost.create({
    data: {
      title: data.title,
      content: data.content,
      coverImage: data.coverImage,
      tags: data.tags || "",
      excerpt,
      authorId,
    },
    include: {
      author: { select: authorSelect },
    },
  });

  return post;
}

async function getBlogPosts(page = 1, limit = 12, authorId?: string) {
  const where: any = { published: true };
  if (authorId) {
    where.authorId = authorId;
    delete where.published; // Author can see their own unpublished posts
  }

  const [posts, total] = await Promise.all([
    prisma.blogPost.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        author: { select: authorSelect },
      },
    }),
    prisma.blogPost.count({ where }),
  ]);

  return {
    posts,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
}

async function getBlogPostById(id: string) {
  const post = await prisma.blogPost.findUnique({
    where: { id },
    include: {
      author: { select: authorSelect },
    },
  });

  if (!post) {
    throw { status: 404, message: "Blog post not found", code: "NOT_FOUND" };
  }

  return post;
}

async function updateBlogPost(id: string, authorId: string, data: UpdateBlogPostInput) {
  const post = await prisma.blogPost.findUnique({ where: { id } });

  if (!post) {
    throw { status: 404, message: "Blog post not found", code: "NOT_FOUND" };
  }

  if (post.authorId !== authorId) {
    throw { status: 403, message: "You are not the author of this post", code: "FORBIDDEN" };
  }

  const updateData: any = { ...data };
  if (data.content) {
    updateData.excerpt = generateExcerpt(data.content);
  }

  const updated = await prisma.blogPost.update({
    where: { id },
    data: updateData,
    include: {
      author: { select: authorSelect },
    },
  });

  return updated;
}

async function deleteBlogPost(id: string, authorId: string, isAdmin: boolean) {
  const post = await prisma.blogPost.findUnique({ where: { id } });

  if (!post) {
    throw { status: 404, message: "Blog post not found", code: "NOT_FOUND" };
  }

  if (!isAdmin && post.authorId !== authorId) {
    throw { status: 403, message: "You are not authorized to delete this post", code: "FORBIDDEN" };
  }

  await prisma.blogPost.delete({ where: { id } });

  return { message: "Blog post deleted successfully" };
}

async function getAllBlogPosts(page = 1, limit = 12) {
  const [posts, total] = await Promise.all([
    prisma.blogPost.findMany({
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        author: { select: authorSelect },
      },
    }),
    prisma.blogPost.count(),
  ]);

  return {
    posts,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
}

export const blogService = {
  createBlogPost,
  getBlogPosts,
  getBlogPostById,
  updateBlogPost,
  deleteBlogPost,
  getAllBlogPosts,
};
