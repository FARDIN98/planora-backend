import { prisma } from "../lib/prisma.js";
import { stripeService } from "./stripe.service.js";
import { emailService } from "./email.service.js";

async function register(
  eventId: string,
  userId: string,
  successUrl: string,
  cancelUrl: string,
) {
  const event = await prisma.event.findUnique({ where: { id: eventId } });

  if (!event) {
    throw { status: 404, message: "Event not found", code: "NOT_FOUND" };
  }

  // Self-registration check
  if (event.organizerId === userId) {
    throw {
      status: 400,
      message: "You cannot register for your own event",
      code: "SELF_REGISTRATION",
    };
  }

  // Check existing registration
  const existing = await prisma.registration.findUnique({
    where: { userId_eventId: { userId, eventId } },
  });

  if (existing && existing.status !== "REJECTED") {
    throw {
      status: 409,
      message: "You are already registered for this event",
      code: "ALREADY_REGISTERED",
    };
  }

  // Decision matrix: visibility x type
  const isFree = event.type === "FREE";
  const isPublic = event.visibility === "PUBLIC";

  try {
    if (isFree && isPublic) {
      // PUBLIC + FREE -> instant APPROVED
      const registration = await prisma.registration.upsert({
        where: { userId_eventId: { userId, eventId } },
        create: { userId, eventId, status: "APPROVED" },
        update: { status: "APPROVED" },
      });

      // Fire-and-forget confirmation email
      const registrant = await prisma.user.findUnique({
        where: { id: userId },
        select: { name: true, email: true },
      });
      if (registrant) {
        emailService.notifyAutoApproved({
          recipientId: userId,
          recipientEmail: registrant.email,
          recipientName: registrant.name,
          eventTitle: event.title,
          eventId,
        });
      }

      return { registration, requiresPayment: false };
    }

    if (isFree && !isPublic) {
      // PRIVATE + FREE -> PENDING for host approval
      const registration = await prisma.registration.upsert({
        where: { userId_eventId: { userId, eventId } },
        create: { userId, eventId, status: "PENDING" },
        update: { status: "PENDING" },
      });
      return { registration, requiresPayment: false };
    }

    // PAID events (both PUBLIC and PRIVATE) -> Stripe Checkout
    const checkout = await stripeService.createCheckoutSession({
      eventId,
      userId,
      eventTitle: event.title,
      fee: event.fee,
      flow: "registration",
      successUrl,
      cancelUrl,
    });

    return { checkoutUrl: checkout.url, requiresPayment: true };
  } catch (error: any) {
    // Handle P2002 unique constraint violation (race condition)
    if (error.code === "P2002") {
      throw {
        status: 409,
        message: "You are already registered for this event",
        code: "ALREADY_REGISTERED",
      };
    }
    throw error;
  }
}

async function updateStatus(
  eventId: string,
  registrationId: string,
  status: string,
  hostId: string,
) {
  const event = await prisma.event.findUnique({ where: { id: eventId } });

  if (!event) {
    throw { status: 404, message: "Event not found", code: "NOT_FOUND" };
  }

  if (event.organizerId !== hostId) {
    throw {
      status: 403,
      message: "You are not the organizer of this event",
      code: "FORBIDDEN",
    };
  }

  const registration = await prisma.registration.findUnique({
    where: { id: registrationId },
  });

  if (!registration || registration.eventId !== eventId) {
    throw { status: 404, message: "Registration not found", code: "NOT_FOUND" };
  }

  if (status === "BANNED" && registration.status === "BANNED") {
    throw {
      status: 400,
      message: "This participant is already banned",
      code: "ALREADY_BANNED",
    };
  }

  const updated = await prisma.registration.update({
    where: { id: registrationId },
    data: { status: status as any },
    include: {
      user: { select: { id: true, name: true, email: true } },
    },
  });

  // Fire-and-forget status notification
  emailService.notifyRegistrationStatusChanged({
    recipientId: updated.user.id,
    recipientEmail: updated.user.email,
    recipientName: updated.user.name,
    eventTitle: event.title,
    eventId,
    newStatus: status,
  });

  return updated;
}

async function listByEvent(
  eventId: string,
  hostId: string,
  page: number,
  limit: number,
) {
  const event = await prisma.event.findUnique({ where: { id: eventId } });

  if (!event) {
    throw { status: 404, message: "Event not found", code: "NOT_FOUND" };
  }

  if (event.organizerId !== hostId) {
    throw {
      status: 403,
      message: "You are not the organizer of this event",
      code: "FORBIDDEN",
    };
  }

  const [registrations, total] = await Promise.all([
    prisma.registration.findMany({
      where: { eventId },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.registration.count({ where: { eventId } }),
  ]);

  return {
    registrations,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

async function getMyRegistrations(userId: string, page: number, limit: number) {
  const [registrations, total] = await Promise.all([
    prisma.registration.findMany({
      where: { userId },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        event: {
          include: {
            organizer: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.registration.count({ where: { userId } }),
  ]);

  return {
    registrations,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

export const registrationService = {
  register,
  updateStatus,
  listByEvent,
  getMyRegistrations,
};
