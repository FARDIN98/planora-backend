import { prisma } from "../lib/prisma.js";

async function getPlatformStats() {
  const [totalEvents, totalUsers, totalRegistrations, totalReviews] =
    await Promise.all([
      prisma.event.count(),
      prisma.user.count(),
      prisma.registration.count(),
      prisma.review.count(),
    ]);

  return { totalEvents, totalUsers, totalRegistrations, totalReviews };
}

async function getHomepageData() {
  const now = new Date();

  const [
    featuredEvents,
    upcomingEvents,
    paidEvents,
    categoryCounts,
    platformStats,
    topOrganizers,
    testimonials,
  ] = await Promise.all([
    // Featured events (isFeatured, limit 4)
    prisma.event.findMany({
      where: { isFeatured: true, visibility: "PUBLIC" },
      take: 4,
      orderBy: { date: "asc" },
      include: {
        organizer: { select: { id: true, name: true } },
        _count: { select: { registrations: true } },
      },
    }),

    // Next 4 upcoming public events
    prisma.event.findMany({
      where: { visibility: "PUBLIC", date: { gte: now } },
      take: 4,
      orderBy: { date: "asc" },
      include: {
        organizer: { select: { id: true, name: true } },
        _count: { select: { registrations: true } },
      },
    }),

    // Next 4 paid events
    prisma.event.findMany({
      where: { type: "PAID", visibility: "PUBLIC", date: { gte: now } },
      take: 4,
      orderBy: { date: "asc" },
      include: {
        organizer: { select: { id: true, name: true } },
        _count: { select: { registrations: true } },
      },
    }),

    // Category counts using groupBy
    prisma.event.groupBy({
      by: ["visibility", "type"],
      _count: { id: true },
    }),

    // Platform stats
    Promise.all([
      prisma.event.count(),
      prisma.user.count(),
      prisma.registration.count(),
      prisma.review.count(),
    ]).then(([totalEvents, totalUsers, totalRegistrations, totalReviews]) => ({
      totalEvents,
      totalUsers,
      totalRegistrations,
      totalReviews,
    })),

    // Top 4 organizers by event count
    prisma.event
      .groupBy({
        by: ["organizerId"],
        _count: { id: true },
        orderBy: { _count: { id: "desc" } },
        take: 4,
      })
      .then(async (groups) => {
        const organizerIds = groups.map((g) => g.organizerId);
        const users = await prisma.user.findMany({
          where: { id: { in: organizerIds } },
          select: { id: true, name: true, email: true },
        });
        return groups.map((g) => ({
          ...users.find((u) => u.id === g.organizerId),
          eventCount: g._count.id,
        }));
      }),

    // Top 8 testimonials (reviews by rating desc)
    prisma.review.findMany({
      take: 8,
      orderBy: { rating: "desc" },
      include: {
        user: { select: { id: true, name: true } },
        event: { select: { id: true, title: true } },
      },
    }),
  ]);

  // Transform category counts into a structured object
  const categoryCountMap: Record<string, number> = {};
  for (const group of categoryCounts) {
    const key = `${group.visibility}_${group.type}`;
    categoryCountMap[key] = group._count.id;
  }

  return {
    featuredEvents,
    upcomingEvents,
    paidEvents,
    categoryCounts: {
      PUBLIC_FREE: categoryCountMap["PUBLIC_FREE"] || 0,
      PUBLIC_PAID: categoryCountMap["PUBLIC_PAID"] || 0,
      PRIVATE_FREE: categoryCountMap["PRIVATE_FREE"] || 0,
      PRIVATE_PAID: categoryCountMap["PRIVATE_PAID"] || 0,
    },
    platformStats,
    topOrganizers,
    testimonials,
  };
}

async function getAdminChartData() {
  const [
    eventsRaw,
    registrationsRaw,
    eventTypeDistribution,
    usersRaw,
  ] = await Promise.all([
    // Events created over time
    prisma.event.findMany({
      select: { createdAt: true },
      orderBy: { createdAt: "asc" },
    }),

    // Revenue overview (registrations with amountPaid)
    prisma.registration.findMany({
      where: { amountPaid: { not: null } },
      select: { createdAt: true, amountPaid: true },
      orderBy: { createdAt: "asc" },
    }),

    // Event type distribution
    prisma.event.groupBy({
      by: ["visibility", "type"],
      _count: { id: true },
    }),

    // User registrations over time
    prisma.user.findMany({
      select: { createdAt: true },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  // Group events by month
  const eventsOverTime = groupByMonth(eventsRaw.map((e) => e.createdAt));

  // Group revenue by month
  const revenueByMonth: Record<string, number> = {};
  for (const reg of registrationsRaw) {
    const month = formatMonth(reg.createdAt);
    revenueByMonth[month] = (revenueByMonth[month] || 0) + (reg.amountPaid || 0);
  }
  const revenueOverview = Object.entries(revenueByMonth).map(([month, revenue]) => ({
    month,
    revenue,
  }));

  // User registrations by month
  const userRegistrations = groupByMonth(usersRaw.map((u) => u.createdAt));

  return {
    eventsOverTime,
    revenueOverview,
    eventTypeDistribution: eventTypeDistribution.map((g) => ({
      name: `${g.visibility}_${g.type}`,
      count: g._count.id,
    })),
    userRegistrations,
  };
}

async function getAdminOverview() {
  const now = new Date();

  const [totalEvents, totalUsers, totalRevenueResult, activeEvents] =
    await Promise.all([
      prisma.event.count(),
      prisma.user.count(),
      prisma.registration.aggregate({ _sum: { amountPaid: true } }),
      prisma.event.count({ where: { date: { gte: now } } }),
    ]);

  return {
    totalEvents,
    totalUsers,
    totalRevenue: totalRevenueResult._sum.amountPaid || 0,
    activeEvents,
  };
}

async function getUserDashboardStats(userId: string) {
  const now = new Date();

  const [myEventsCount, upcomingEventsCount, pendingInvitationsCount, reviewsWrittenCount] =
    await Promise.all([
      prisma.event.count({ where: { organizerId: userId } }),
      prisma.registration.count({
        where: {
          userId,
          status: "APPROVED",
          event: { date: { gte: now } },
        },
      }),
      prisma.invitation.count({
        where: { receiverId: userId, status: "PENDING" },
      }),
      prisma.review.count({ where: { userId } }),
    ]);

  return {
    myEventsCount,
    upcomingEventsCount,
    pendingInvitationsCount,
    reviewsWrittenCount,
  };
}

// Helper: format date as "YYYY-MM"
function formatMonth(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

// Helper: group dates by month and return array of { month, count }
function groupByMonth(dates: Date[]): { month: string; count: number }[] {
  const counts: Record<string, number> = {};
  for (const date of dates) {
    const month = formatMonth(date);
    counts[month] = (counts[month] || 0) + 1;
  }
  return Object.entries(counts).map(([month, count]) => ({ month, count }));
}

export const statsService = {
  getPlatformStats,
  getHomepageData,
  getAdminChartData,
  getAdminOverview,
  getUserDashboardStats,
};
