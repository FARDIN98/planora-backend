import { prisma } from "../lib/prisma.js";
import { stripeService } from "./stripe.service.js";
import { emailService } from "./email.service.js";

async function create(eventId: string, senderId: string, email: string) {
  const event = await prisma.event.findUnique({ where: { id: eventId } });

  if (!event) {
    throw { status: 404, message: "Event not found", code: "NOT_FOUND" };
  }

  if (event.organizerId !== senderId) {
    throw {
      status: 403,
      message: "You are not the organizer of this event",
      code: "FORBIDDEN",
    };
  }

  // Look up receiver by email
  const receiver = await prisma.user.findFirst({ where: { email } });
  if (!receiver) {
    throw { status: 404, message: "No user found with this email", code: "USER_NOT_FOUND" };
  }

  const receiverId = receiver.id;

  // Check if receiver is already registered
  const existingRegistration = await prisma.registration.findUnique({
    where: { userId_eventId: { userId: receiverId, eventId } },
  });

  if (existingRegistration && existingRegistration.status !== "REJECTED" && existingRegistration.status !== "BANNED") {
    throw {
      status: 409,
      message: "This user is already registered for this event",
      code: "ALREADY_REGISTERED",
    };
  }

  // Check if invitation already exists
  const existingInvitation = await prisma.invitation.findUnique({
    where: { receiverId_eventId: { receiverId, eventId } },
  });

  if (existingInvitation) {
    if (existingInvitation.status === "PENDING") {
      throw {
        status: 409,
        message: "This user has already been invited to this event",
        code: "ALREADY_INVITED",
      };
    }

    // If previously declined, delete old invitation to allow re-invite
    if (existingInvitation.status === "DECLINED") {
      await prisma.invitation.delete({ where: { id: existingInvitation.id } });
    }
  }

  const invitation = await prisma.invitation.create({
    data: { senderId, receiverId, eventId, status: "PENDING" },
    include: {
      sender: { select: { id: true, name: true } },
      receiver: { select: { id: true, name: true, email: true } },
      event: { select: { id: true, title: true, type: true, fee: true } },
    },
  });

  // Fire-and-forget email notification
  emailService.notifyInvitationReceived({
    recipientId: invitation.receiver.id,
    recipientEmail: invitation.receiver.email,
    recipientName: invitation.receiver.name,
    eventTitle: invitation.event.title,
    senderName: invitation.sender.name,
  });

  return invitation;
}

async function respond(
  invitationId: string,
  userId: string,
  action: "accept" | "decline",
  successUrl?: string,
  cancelUrl?: string,
) {
  const invitation = await prisma.invitation.findUnique({
    where: { id: invitationId },
    include: { event: true },
  });

  if (!invitation) {
    throw { status: 404, message: "Invitation not found", code: "NOT_FOUND" };
  }

  if (invitation.receiverId !== userId) {
    throw {
      status: 403,
      message: "You can only respond to your own invitations",
      code: "FORBIDDEN",
    };
  }

  if (invitation.status !== "PENDING") {
    throw {
      status: 400,
      message: "This invitation cannot be responded to in its current state",
      code: "INVALID_STATUS",
    };
  }

  if (action === "decline") {
    const updated = await prisma.invitation.update({
      where: { id: invitationId },
      data: { status: "DECLINED" },
      include: {
        event: { select: { id: true, title: true, type: true } },
      },
    });
    return { invitation: updated, requiresPayment: false };
  }

  // action === "accept"
  if (invitation.event.type === "PAID") {
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
    const checkout = await stripeService.createCheckoutSession({
      eventId: invitation.eventId,
      userId,
      eventTitle: invitation.event.title,
      fee: invitation.event.fee,
      flow: "invitation",
      successUrl: successUrl || `${frontendUrl}/dashboard/invitations?payment=success`,
      cancelUrl: cancelUrl || `${frontendUrl}/dashboard/invitations?payment=cancelled`,
    });

    return { checkoutUrl: checkout.url, requiresPayment: true };
  }

  // FREE event -- accept directly
  try {
    const [updated, registration] = await Promise.all([
      prisma.invitation.update({
        where: { id: invitationId },
        data: { status: "ACCEPTED" },
        include: {
          event: { select: { id: true, title: true, type: true } },
        },
      }),
      prisma.registration.create({
        data: {
          userId,
          eventId: invitation.eventId,
          status: "APPROVED",
        },
      }),
    ]);

    return { invitation: updated, registration, requiresPayment: false };
  } catch (error: any) {
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

async function getMyInvitations(userId: string, page: number, limit: number) {
  const [rawInvitations, total] = await Promise.all([
    prisma.invitation.findMany({
      where: { receiverId: userId },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        event: {
          include: {
            organizer: { select: { id: true, name: true } },
          },
        },
        sender: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.invitation.count({ where: { receiverId: userId } }),
  ]);

  // Attach registration status for each invitation's event
  const invitations = await Promise.all(
    rawInvitations.map(async (inv) => {
      const registration = await prisma.registration.findUnique({
        where: { userId_eventId: { userId, eventId: inv.eventId } },
        select: { status: true },
      });
      return { ...inv, registration };
    }),
  );

  return {
    invitations,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

async function listByEvent(eventId: string, hostId: string, page: number, limit: number) {
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

  const [invitations, total] = await Promise.all([
    prisma.invitation.findMany({
      where: { eventId },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        receiver: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.invitation.count({ where: { eventId } }),
  ]);

  return {
    invitations,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

export const invitationService = { create, respond, getMyInvitations, listByEvent };
