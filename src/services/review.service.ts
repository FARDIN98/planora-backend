import { prisma } from "../lib/prisma.js";
import type { CreateReviewInput, UpdateReviewInput } from "../schemas/review.schema.js";

const userSelect = {
  id: true,
  name: true,
};

async function create(eventId: string, userId: string, data: CreateReviewInput) {
  // Fetch event
  const event = await prisma.event.findUnique({ where: { id: eventId } });

  if (!event) {
    throw { status: 404, message: "Event not found", code: "NOT_FOUND" };
  }

  // Self-review check: organizers cannot review their own events
  if (event.organizerId === userId) {
    throw {
      status: 403,
      message: "You cannot review an event you organized",
      code: "SELF_REVIEW",
    };
  }

  // Participation gate: only APPROVED participants can review
  const registration = await prisma.registration.findUnique({
    where: { userId_eventId: { userId, eventId } },
  });

  if (!registration || registration.status !== "APPROVED") {
    throw {
      status: 403,
      message: "You must be an approved participant to review this event",
      code: "NOT_ELIGIBLE",
    };
  }

  try {
    const review = await prisma.review.create({
      data: { ...data, userId, eventId },
      include: { user: { select: userSelect } },
    });

    return review;
  } catch (error: any) {
    // Handle P2002 unique constraint violation (one review per user per event)
    if (error.code === "P2002") {
      throw {
        status: 409,
        message: "You have already reviewed this event",
        code: "ALREADY_REVIEWED",
      };
    }
    throw error;
  }
}

async function listByEvent(eventId: string, page: number, limit: number) {
  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event) {
    throw { status: 404, message: "Event not found", code: "NOT_FOUND" };
  }

  const [reviews, total] = await Promise.all([
    prisma.review.findMany({
      where: { eventId },
      skip: (page - 1) * limit,
      take: limit,
      include: { user: { select: userSelect } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.review.count({ where: { eventId } }),
  ]);

  return {
    reviews,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

async function update(reviewId: string, userId: string, data: UpdateReviewInput) {
  const review = await prisma.review.findUnique({ where: { id: reviewId } });

  if (!review) {
    throw { status: 404, message: "Review not found", code: "NOT_FOUND" };
  }

  // Ownership check
  if (review.userId !== userId) {
    throw {
      status: 403,
      message: "You can only edit your own reviews",
      code: "FORBIDDEN",
    };
  }

  const updated = await prisma.review.update({
    where: { id: reviewId },
    data,
    include: { user: { select: userSelect } },
  });

  return updated;
}

async function remove(reviewId: string, userId: string) {
  const review = await prisma.review.findUnique({ where: { id: reviewId } });

  if (!review) {
    throw { status: 404, message: "Review not found", code: "NOT_FOUND" };
  }

  // Ownership check
  if (review.userId !== userId) {
    throw {
      status: 403,
      message: "You can only delete your own reviews",
      code: "FORBIDDEN",
    };
  }

  // Hard delete
  await prisma.review.delete({ where: { id: reviewId } });

  return { message: "Review deleted successfully" };
}

async function getMyReviews(userId: string, page: number, limit: number) {
  const [reviews, total] = await Promise.all([
    prisma.review.findMany({
      where: { userId },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        event: { select: { id: true, title: true, date: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.review.count({ where: { userId } }),
  ]);

  return {
    reviews,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

export const reviewService = { create, listByEvent, update, remove, getMyReviews };
