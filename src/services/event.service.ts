import { prisma } from "../lib/prisma.js";
import type { CreateEventInput, UpdateEventInput } from "../schemas/event.schema.js";
import type { SearchInput } from "../schemas/common.schema.js";

const organizerSelect = {
  id: true,
  name: true,
  email: true,
  image: true,
};

async function create(data: CreateEventInput, organizerId: string) {
  const { date, ...rest } = data;
  const parsedDate = new Date(date);

  const event = await prisma.event.create({
    data: {
      ...rest,
      date: parsedDate,
      organizerId,
    },
    include: {
      organizer: { select: organizerSelect },
    },
  });

  return event;
}

async function list(query: SearchInput) {
  const { page, limit, search, visibility, type, category, sortBy, sortOrder } =
    query;

  const where: any = {};
  const andConditions: any[] = [];

  if (search) {
    andConditions.push({
      OR: [
        { title: { contains: search, mode: "insensitive" } },
        { organizer: { name: { contains: search, mode: "insensitive" } } },
      ],
    });
  }

  // Default to PUBLIC — PRIVATE events are hidden from public listings
  andConditions.push({ visibility: visibility || "PUBLIC" });

  if (type) {
    andConditions.push({ type });
  }

  if (category) {
    andConditions.push({ category });
  }

  if (andConditions.length > 0) {
    where.AND = andConditions;
  }

  const [events, total] = await Promise.all([
    prisma.event.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
      include: {
        organizer: { select: organizerSelect },
        _count: { select: { registrations: true } },
      },
    }),
    prisma.event.count({ where }),
  ]);

  return {
    events,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

async function getById(eventId: string, userId?: string) {
  const [event, reviewStats] = await Promise.all([
    prisma.event.findUnique({
      where: { id: eventId },
      include: {
        organizer: { select: organizerSelect },
      },
    }),
    prisma.review.aggregate({
      where: { eventId },
      _avg: { rating: true },
      _count: { rating: true },
    }),
  ]);

  if (!event) {
    throw { status: 404, message: "Event not found", code: "NOT_FOUND" };
  }

  // PRIVATE events: only visible to organizer, registrants, and invitees
  if (event.visibility === "PRIVATE" && event.organizerId !== userId) {
    const hasAccess = userId
      ? await prisma.registration.findUnique({
          where: { userId_eventId: { userId, eventId } },
        }) ||
        await prisma.invitation.findUnique({
          where: { receiverId_eventId: { receiverId: userId, eventId } },
        })
      : null;

    if (!hasAccess) {
      throw { status: 404, message: "Event not found", code: "NOT_FOUND" };
    }
  }

  return {
    ...event,
    averageRating: reviewStats._avg.rating ?? 0,
    reviewCount: reviewStats._count.rating,
  };
}

async function update(
  eventId: string,
  data: UpdateEventInput,
  userId: string,
) {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
  });

  if (!event) {
    throw { status: 404, message: "Event not found", code: "NOT_FOUND" };
  }

  if (event.organizerId !== userId) {
    throw {
      status: 403,
      message: "You are not the organizer of this event",
      code: "FORBIDDEN",
    };
  }

  // Validate PAID+fee consistency on merged state (schema only checks provided fields)
  const mergedType = data.type ?? event.type;
  const mergedFee = data.fee ?? event.fee;
  if (mergedType === "PAID" && mergedFee <= 0) {
    throw {
      status: 422,
      message: "Paid events must have a fee greater than 0",
      code: "VALIDATION_ERROR",
    };
  }

  const updated = await prisma.event.update({
    where: { id: eventId },
    data: {
      ...data,
      ...(data.date && { date: new Date(data.date) }),
    },
    include: {
      organizer: { select: organizerSelect },
    },
  });

  return updated;
}

async function remove(eventId: string, userId: string) {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
  });

  if (!event) {
    throw { status: 404, message: "Event not found", code: "NOT_FOUND" };
  }

  if (event.organizerId !== userId) {
    throw {
      status: 403,
      message: "You are not the organizer of this event",
      code: "FORBIDDEN",
    };
  }

  await prisma.event.delete({ where: { id: eventId } });

  return { message: "Event deleted successfully" };
}

export const eventService = { create, list, getById, update, remove };
