import { prisma } from "../lib/prisma.js";

async function subscribe(email: string) {
  try {
    const subscription = await prisma.newsletterSubscription.create({
      data: { email },
    });
    return { message: "Successfully subscribed to newsletter", subscription };
  } catch (error: any) {
    // Handle unique constraint violation (already subscribed)
    if (error.code === "P2002") {
      return { message: "This email is already subscribed" };
    }
    throw error;
  }
}

async function getSubscribers(page = 1, limit = 20) {
  const [subscribers, total] = await Promise.all([
    prisma.newsletterSubscription.findMany({
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: "desc" },
    }),
    prisma.newsletterSubscription.count(),
  ]);

  return {
    subscribers,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
}

async function unsubscribe(email: string) {
  const result = await prisma.newsletterSubscription.deleteMany({
    where: { email },
  });

  if (result.count === 0) {
    return { message: "Email not found in subscriber list" };
  }

  return { message: "Successfully unsubscribed from newsletter" };
}

export const newsletterService = { subscribe, getSubscribers, unsubscribe };
