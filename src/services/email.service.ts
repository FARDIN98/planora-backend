import { resend } from "../lib/mailer.js";
import { prisma } from "../lib/prisma.js";

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";

function isEmailConfigured(): boolean {
  return !!process.env.RESEND_API_KEY;
}

async function sendMail(to: string, subject: string, html: string): Promise<void> {
  if (!isEmailConfigured()) return;

  try {
    await resend.emails.send({
      from: "Planora <onboarding@resend.dev>",
      to,
      subject,
      html,
    });
  } catch (error) {
    console.error(`[Email] Failed to send to ${to}:`, error);
  }
}

const BTN = 'display:inline-block;background:#dc4a3a;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:600;';

function wrapHtml(body: string): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:32px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;max-width:100%;">
        <tr><td style="background:#dc4a3a;padding:24px;text-align:center;">
          <h1 style="margin:0;color:#fff;font-size:24px;font-weight:700;">Planora</h1>
        </td></tr>
        <tr><td style="padding:32px;">${body}</td></tr>
        <tr><td style="padding:16px 32px 24px;color:#71717a;font-size:13px;text-align:center;border-top:1px solid #e4e4e7;">
          You received this because of your notification settings on Planora.
          <br><a href="${FRONTEND_URL}/dashboard/settings" style="color:#dc4a3a;">Manage preferences</a>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// ─── Invitation Received ─────────────────────────────

async function notifyInvitationReceived(params: {
  recipientId: string;
  recipientEmail: string;
  recipientName: string;
  eventTitle: string;
  senderName: string;
}) {
  const user = await prisma.user.findUnique({
    where: { id: params.recipientId },
    select: { notifyInvitations: true },
  });
  if (!user?.notifyInvitations) return;

  const subject = `You've been invited to "${params.eventTitle}"`;
  const html = wrapHtml(`
    <h2 style="margin:0 0 16px;">Hi ${params.recipientName},</h2>
    <p style="color:#3f3f46;line-height:1.6;">
      <strong>${params.senderName}</strong> has invited you to <strong>${params.eventTitle}</strong>.
    </p>
    <p style="margin:24px 0;">
      <a href="${FRONTEND_URL}/dashboard/invitations" style="${BTN}">View Invitation</a>
    </p>
  `);

  sendMail(params.recipientEmail, subject, html);
}

// ─── Auto-Approved (PUBLIC + FREE) ──────────────────

async function notifyAutoApproved(params: {
  recipientId: string;
  recipientEmail: string;
  recipientName: string;
  eventTitle: string;
  eventId: string;
}) {
  const user = await prisma.user.findUnique({
    where: { id: params.recipientId },
    select: { notifyApprovals: true },
  });
  if (!user?.notifyApprovals) return;

  const subject = `You're registered for "${params.eventTitle}"`;
  const html = wrapHtml(`
    <h2 style="margin:0 0 16px;">Hi ${params.recipientName},</h2>
    <p style="color:#3f3f46;line-height:1.6;">
      You've been successfully registered for <strong>${params.eventTitle}</strong>.
    </p>
    <p style="margin:24px 0;">
      <a href="${FRONTEND_URL}/events/${params.eventId}" style="${BTN}">View Event</a>
    </p>
  `);

  sendMail(params.recipientEmail, subject, html);
}

// ─── Registration Status Changed ────────────────────

const statusMessages: Record<string, { subject: (t: string) => string; body: string }> = {
  APPROVED: {
    subject: (t) => `You're approved for "${t}"`,
    body: "Your registration has been approved! You're all set.",
  },
  REJECTED: {
    subject: (t) => `Registration update for "${t}"`,
    body: "Unfortunately, your registration has been rejected.",
  },
  BANNED: {
    subject: (t) => `Registration update for "${t}"`,
    body: "You have been banned from this event.",
  },
};

async function notifyRegistrationStatusChanged(params: {
  recipientId: string;
  recipientEmail: string;
  recipientName: string;
  eventTitle: string;
  eventId: string;
  newStatus: string;
}) {
  const user = await prisma.user.findUnique({
    where: { id: params.recipientId },
    select: { notifyApprovals: true },
  });
  if (!user?.notifyApprovals) return;

  const msg = statusMessages[params.newStatus];
  if (!msg) return;

  const subject = msg.subject(params.eventTitle);
  const html = wrapHtml(`
    <h2 style="margin:0 0 16px;">Hi ${params.recipientName},</h2>
    <p style="color:#3f3f46;line-height:1.6;">${msg.body}</p>
    <p style="color:#71717a;font-size:14px;">Event: <strong>${params.eventTitle}</strong></p>
    <p style="margin:24px 0;">
      <a href="${FRONTEND_URL}/events/${params.eventId}" style="${BTN}">View Event</a>
    </p>
  `);

  sendMail(params.recipientEmail, subject, html);
}

// ─── New Review Received ────────────────────────────

async function notifyNewReview(params: {
  organizerId: string;
  organizerEmail: string;
  organizerName: string;
  eventTitle: string;
  reviewerName: string;
  rating: number;
  eventId: string;
}) {
  const user = await prisma.user.findUnique({
    where: { id: params.organizerId },
    select: { notifyReviews: true },
  });
  if (!user?.notifyReviews) return;

  const stars = "\u2605".repeat(params.rating) + "\u2606".repeat(5 - params.rating);
  const subject = `New review on "${params.eventTitle}"`;
  const html = wrapHtml(`
    <h2 style="margin:0 0 16px;">Hi ${params.organizerName},</h2>
    <p style="color:#3f3f46;line-height:1.6;">
      <strong>${params.reviewerName}</strong> left a review on <strong>${params.eventTitle}</strong>.
    </p>
    <p style="font-size:24px;margin:16px 0;">${stars}</p>
    <p style="margin:24px 0;">
      <a href="${FRONTEND_URL}/events/${params.eventId}" style="${BTN}">View Event</a>
    </p>
  `);

  sendMail(params.organizerEmail, subject, html);
}

export const emailService = {
  notifyInvitationReceived,
  notifyAutoApproved,
  notifyRegistrationStatusChanged,
  notifyNewReview,
};
