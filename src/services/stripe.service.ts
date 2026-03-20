import { stripe } from "../lib/stripe.js";
import { prisma } from "../lib/prisma.js";

interface CreateCheckoutParams {
  eventId: string;
  userId: string;
  eventTitle: string;
  fee: number;
  flow: "registration" | "invitation";
  successUrl: string;
  cancelUrl: string;
}

async function createCheckoutSession(params: CreateCheckoutParams) {
  const session = await stripe.checkout.sessions.create({
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: `Event: ${params.eventTitle}`,
          },
          unit_amount: Math.round(params.fee * 100),
        },
        quantity: 1,
      },
    ],
    mode: "payment",
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
    metadata: {
      userId: params.userId,
      eventId: params.eventId,
      flow: params.flow,
    },
  });

  return { url: session.url, sessionId: session.id };
}

async function handleRegistrationPayment(
  userId: string,
  eventId: string,
  sessionId: string,
  amountTotal: number | null,
) {
  const event = await prisma.event.findUnique({ where: { id: eventId } });

  if (!event) {
    console.warn(`[Stripe Webhook] Event not found: ${eventId}`);
    return;
  }

  // Idempotency: skip if registration with this sessionId already exists
  const existing = await prisma.registration.findFirst({
    where: { stripeSessionId: sessionId },
  });
  if (existing) {
    console.log(`[Stripe Webhook] Registration already processed for session: ${sessionId}`);
    return;
  }

  // Public paid events -> APPROVED immediately, Private paid events -> PENDING for host approval
  const status = event.visibility === "PUBLIC" ? "APPROVED" : "PENDING";

  await prisma.registration.upsert({
    where: { userId_eventId: { userId, eventId } },
    create: {
      userId,
      eventId,
      status,
      stripeSessionId: sessionId,
      amountPaid: (amountTotal || 0) / 100,
    },
    update: {
      status,
      stripeSessionId: sessionId,
      amountPaid: (amountTotal || 0) / 100,
    },
  });
}

async function handleInvitationPayment(
  userId: string,
  eventId: string,
  sessionId: string,
  amountTotal: number | null,
) {
  const invitation = await prisma.invitation.findFirst({
    where: { receiverId: userId, eventId },
  });

  if (!invitation) {
    console.warn(`[Stripe Webhook] Invitation not found for user ${userId}, event ${eventId}`);
    return;
  }

  // Update invitation status
  await prisma.invitation.update({
    where: { id: invitation.id },
    data: {
      status: "ACCEPTED",
      stripeSessionId: sessionId,
      amountPaid: (amountTotal || 0) / 100,
    },
  });

  // Invitation paid events skip host approval -- APPROVED directly
  await prisma.registration.upsert({
    where: { userId_eventId: { userId, eventId } },
    create: {
      userId,
      eventId,
      status: "APPROVED",
      stripeSessionId: sessionId,
      amountPaid: (amountTotal || 0) / 100,
    },
    update: {
      status: "APPROVED",
      stripeSessionId: sessionId,
      amountPaid: (amountTotal || 0) / 100,
    },
  });
}

async function handleWebhookEvent(rawBody: Buffer, signature: string) {
  let event;
  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!,
    );
  } catch (err) {
    throw { status: 400, message: "Invalid webhook signature", code: "INVALID_SIGNATURE" };
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as any;
    const metadata = session.metadata;
    const { userId, eventId, flow } = metadata;

    if (flow === "registration") {
      await handleRegistrationPayment(userId, eventId, session.id, session.amount_total);
    } else if (flow === "invitation") {
      await handleInvitationPayment(userId, eventId, session.id, session.amount_total);
    }
  }

  return { received: true };
}

export const stripeService = { createCheckoutSession, handleWebhookEvent };
