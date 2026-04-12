import bcrypt from "bcryptjs";
import { prisma } from "../src/lib/prisma.js";

// ============================================================
// Comprehensive Seed Data for Planora
// Creates 12 users, 24 events, 30+ registrations, 15+ reviews,
// 6 blog posts, and 5 newsletter subscriptions
// ============================================================

async function main() {
  console.log("Clearing existing data...");

  // Delete in reverse dependency order (try-catch for tables that may not exist yet)
  const deleteOps = [
    prisma.newsletterSubscription.deleteMany(),
    prisma.blogPost.deleteMany(),
    prisma.review.deleteMany(),
    prisma.registration.deleteMany(),
    prisma.invitation.deleteMany(),
    prisma.event.deleteMany(),
    prisma.user.deleteMany(),
  ];

  for (const op of deleteOps) {
    try {
      await op;
    } catch (e: unknown) {
      // P2021 = table does not exist -- safe to skip during initial setup
      if (e instanceof Error && "code" in e && (e as { code: string }).code === "P2021") {
        continue;
      }
      throw e;
    }
  }

  console.log("All existing data cleared.");

  // ============================================================
  // 1. Create Users (12 total: 2 demo + 10 regular)
  // ============================================================
  console.log("Creating users...");

  const adminPassword = await bcrypt.hash("demo1234", 12);
  const demoPassword = await bcrypt.hash("demo1234", 12);
  const regularPassword = await bcrypt.hash("password123", 12);

  const admin = await prisma.user.create({
    data: {
      name: "Admin User",
      email: "admin@demo.com",
      password: adminPassword,
      role: "admin",
    },
  });

  const demoUser = await prisma.user.create({
    data: {
      name: "Demo User",
      email: "user@demo.com",
      password: demoPassword,
      role: "user",
    },
  });

  const sarah = await prisma.user.create({
    data: {
      name: "Sarah Chen",
      email: "sarah.chen@example.com",
      password: regularPassword,
      role: "user",
    },
  });

  const marcus = await prisma.user.create({
    data: {
      name: "Marcus Johnson",
      email: "marcus.johnson@example.com",
      password: regularPassword,
      role: "user",
    },
  });

  const aisha = await prisma.user.create({
    data: {
      name: "Aisha Rahman",
      email: "aisha.rahman@example.com",
      password: regularPassword,
      role: "user",
    },
  });

  const david = await prisma.user.create({
    data: {
      name: "David Kim",
      email: "david.kim@example.com",
      password: regularPassword,
      role: "user",
    },
  });

  const emma = await prisma.user.create({
    data: {
      name: "Emma Wilson",
      email: "emma.wilson@example.com",
      password: regularPassword,
      role: "user",
    },
  });

  const carlos = await prisma.user.create({
    data: {
      name: "Carlos Martinez",
      email: "carlos.martinez@example.com",
      password: regularPassword,
      role: "user",
    },
  });

  const priya = await prisma.user.create({
    data: {
      name: "Priya Patel",
      email: "priya.patel@example.com",
      password: regularPassword,
      role: "user",
    },
  });

  const james = await prisma.user.create({
    data: {
      name: "James O'Brien",
      email: "james.obrien@example.com",
      password: regularPassword,
      role: "user",
    },
  });

  const fatima = await prisma.user.create({
    data: {
      name: "Fatima Al-Rashidi",
      email: "fatima.alrashidi@example.com",
      password: regularPassword,
      role: "user",
    },
  });

  const yuki = await prisma.user.create({
    data: {
      name: "Yuki Tanaka",
      email: "yuki.tanaka@example.com",
      password: regularPassword,
      role: "user",
    },
  });

  const allUsers = [admin, demoUser, sarah, marcus, aisha, david, emma, carlos, priya, james, fatima, yuki];
  console.log(`Created ${allUsers.length} users.`);

  // ============================================================
  // 2. Create Events (24 total: 6 per visibility+type combo)
  // ============================================================
  console.log("Creating events...");

  const now = new Date();
  const futureDate = (daysFromNow: number) => {
    const d = new Date(now);
    d.setDate(d.getDate() + daysFromNow);
    return d;
  };
  const pastDate = (daysAgo: number) => {
    const d = new Date(now);
    d.setDate(d.getDate() - daysAgo);
    return d;
  };

  // --- 6 PUBLIC FREE events ---
  const publicFreeEvents = await Promise.all([
    prisma.event.create({
      data: {
        title: "Community Tech Meetup",
        description: "Join fellow developers and tech enthusiasts for an evening of knowledge sharing, networking, and lightning talks. Whether you are a beginner or a seasoned pro, there is something for everyone at our monthly community meetup.",
        date: futureDate(7),
        time: "6:30 PM",
        venue: "Downtown Innovation Hub",
        visibility: "PUBLIC",
        type: "FREE",
        fee: 0,
        imageUrl: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&h=450&fit=crop",
        isFeatured: true,
        category: "Technology",
        organizerId: sarah.id,
      },
    }),
    prisma.event.create({
      data: {
        title: "Morning Yoga in the Park",
        description: "Start your weekend right with a refreshing outdoor yoga session. All levels welcome. Bring your own mat and water bottle. Our certified instructor will guide you through a rejuvenating flow surrounded by nature.",
        date: futureDate(14),
        time: "8:00 AM",
        venue: "Riverside Park East Lawn",
        visibility: "PUBLIC",
        type: "FREE",
        fee: 0,
        imageUrl: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&h=450&fit=crop",
        isFeatured: false,
        category: "Sports",
        organizerId: emma.id,
      },
    }),
    prisma.event.create({
      data: {
        title: "Open Mic Night",
        description: "Share your talents at our monthly open mic night. Whether you sing, play an instrument, recite poetry, or perform comedy, the stage is yours. A supportive community awaits to cheer you on.",
        date: futureDate(21),
        time: "7:30 PM",
        venue: "The Blue Note Cafe",
        visibility: "PUBLIC",
        type: "FREE",
        fee: 0,
        imageUrl: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&h=450&fit=crop",
        isFeatured: false,
        category: "Music",
        organizerId: carlos.id,
      },
    }),
    prisma.event.create({
      data: {
        title: "Neighborhood Cleanup Drive",
        description: "Help us keep our community beautiful. Volunteers will work together to clean up local streets, parks, and waterways. Supplies provided. Refreshments served after the event.",
        date: futureDate(10),
        time: "9:00 AM",
        venue: "City Hall Meeting Point",
        visibility: "PUBLIC",
        type: "FREE",
        fee: 0,
        imageUrl: "https://images.unsplash.com/photo-1559027615-cd4628902d4a?w=800&h=450&fit=crop",
        isFeatured: false,
        category: "Community",
        organizerId: aisha.id,
      },
    }),
    prisma.event.create({
      data: {
        title: "Beginner Watercolor Workshop",
        description: "Discover the joy of watercolor painting in this hands-on workshop for beginners. Learn basic techniques including washes, wet-on-wet, and dry brush. All materials provided free of charge.",
        date: pastDate(15),
        time: "2:00 PM",
        venue: "Community Arts Center",
        visibility: "PUBLIC",
        type: "FREE",
        fee: 0,
        imageUrl: "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=800&h=450&fit=crop",
        isFeatured: false,
        category: "Art",
        organizerId: priya.id,
      },
    }),
    prisma.event.create({
      data: {
        title: "Startup Founders Breakfast",
        description: "Connect with fellow entrepreneurs over coffee and pastries. Share your startup journey, exchange ideas, and build valuable connections. Perfect for founders at any stage of their business.",
        date: pastDate(30),
        time: "8:30 AM",
        venue: "WeWork Co-working Space",
        visibility: "PUBLIC",
        type: "FREE",
        fee: 0,
        imageUrl: "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=800&h=450&fit=crop",
        isFeatured: false,
        category: "Business",
        organizerId: marcus.id,
      },
    }),
  ]);

  // --- 6 PUBLIC PAID events ---
  const publicPaidEvents = await Promise.all([
    prisma.event.create({
      data: {
        title: "Annual Tech Conference 2026",
        description: "The region's premier technology conference featuring keynote speakers, hands-on workshops, and networking sessions. Explore the latest trends in AI, cloud computing, and web development with industry leaders.",
        date: futureDate(45),
        time: "9:00 AM",
        venue: "Downtown Convention Center",
        visibility: "PUBLIC",
        type: "PAID",
        fee: 99,
        imageUrl: "https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=800&h=450&fit=crop",
        isFeatured: true,
        category: "Technology",
        organizerId: admin.id,
      },
    }),
    prisma.event.create({
      data: {
        title: "Summer Jazz Festival",
        description: "Three days of world-class jazz performances under the stars. Featuring Grammy-nominated artists, food vendors, and craft beverages. An unforgettable musical experience for jazz lovers of all ages.",
        date: futureDate(60),
        time: "5:00 PM",
        venue: "Riverside Park Amphitheater",
        visibility: "PUBLIC",
        type: "PAID",
        fee: 45,
        imageUrl: "https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=800&h=450&fit=crop",
        isFeatured: true,
        category: "Music",
        organizerId: carlos.id,
      },
    }),
    prisma.event.create({
      data: {
        title: "Business Leadership Summit",
        description: "Elevate your leadership skills with workshops led by Fortune 500 executives. Topics include strategic thinking, team management, and innovation leadership. Includes lunch and networking reception.",
        date: futureDate(30),
        time: "10:00 AM",
        venue: "Grand Ballroom Hotel Regency",
        visibility: "PUBLIC",
        type: "PAID",
        fee: 150,
        imageUrl: "https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=800&h=450&fit=crop",
        isFeatured: false,
        category: "Business",
        organizerId: james.id,
      },
    }),
    prisma.event.create({
      data: {
        title: "Charity Gala Dinner",
        description: "An elegant evening supporting local education initiatives. Enjoy a three-course dinner, live entertainment, and a silent auction. Every ticket directly funds scholarships for underprivileged students.",
        date: futureDate(50),
        time: "7:00 PM",
        venue: "The Grand Pavilion",
        visibility: "PUBLIC",
        type: "PAID",
        fee: 125,
        imageUrl: "https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?w=800&h=450&fit=crop",
        isFeatured: false,
        category: "Community",
        organizerId: fatima.id,
      },
    }),
    prisma.event.create({
      data: {
        title: "Marathon City Run 2026",
        description: "Challenge yourself in this annual city marathon through scenic downtown streets. Choose from 5K, 10K, or full marathon distances. Finisher medals, hydration stations, and post-race celebration included.",
        date: pastDate(10),
        time: "6:00 AM",
        venue: "Central Park Starting Line",
        visibility: "PUBLIC",
        type: "PAID",
        fee: 35,
        imageUrl: "https://images.unsplash.com/photo-1452626038306-9aae5e071dd3?w=800&h=450&fit=crop",
        isFeatured: false,
        category: "Sports",
        organizerId: david.id,
      },
    }),
    prisma.event.create({
      data: {
        title: "Contemporary Art Exhibition Opening",
        description: "Be among the first to experience this curated exhibition featuring works by emerging local artists. Includes a guided tour by the curator, wine reception, and meet-the-artists session.",
        date: pastDate(45),
        time: "6:30 PM",
        venue: "Metropolitan Art Gallery",
        visibility: "PUBLIC",
        type: "PAID",
        fee: 25,
        imageUrl: "https://images.unsplash.com/photo-1531243269054-5ebf6f34081e?w=800&h=450&fit=crop",
        isFeatured: false,
        category: "Art",
        organizerId: yuki.id,
      },
    }),
  ]);

  // --- 6 PRIVATE FREE events ---
  const privateFreeEvents = await Promise.all([
    prisma.event.create({
      data: {
        title: "Engineering Team Sprint Planning",
        description: "Bi-weekly sprint planning session for the engineering team. We will review the backlog, estimate stories, and assign tasks for the upcoming sprint. Remote team members can join via video call.",
        date: futureDate(3),
        time: "10:00 AM",
        venue: "Tech Hub Conference Room A",
        visibility: "PRIVATE",
        type: "FREE",
        fee: 0,
        imageUrl: "https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&h=450&fit=crop",
        isFeatured: false,
        category: "Technology",
        organizerId: demoUser.id,
      },
    }),
    prisma.event.create({
      data: {
        title: "Family Reunion Barbecue",
        description: "Annual family get-together at Uncle Joe's backyard. Bring a dish to share. Kids' activities planned, including games and a treasure hunt. Let us catch up and make new memories together.",
        date: futureDate(25),
        time: "12:00 PM",
        venue: "23 Maple Street Backyard",
        visibility: "PRIVATE",
        type: "FREE",
        fee: 0,
        imageUrl: "https://images.unsplash.com/photo-1529543544282-bb77bbd24567?w=800&h=450&fit=crop",
        isFeatured: false,
        category: "Community",
        organizerId: emma.id,
      },
    }),
    prisma.event.create({
      data: {
        title: "Book Club Monthly Discussion",
        description: "This month we are reading 'Project Hail Mary' by Andy Weir. Join us for a lively discussion over tea and snacks. New members welcome, but please read the book beforehand.",
        date: futureDate(18),
        time: "4:00 PM",
        venue: "Sarah's Living Room",
        visibility: "PRIVATE",
        type: "FREE",
        fee: 0,
        imageUrl: "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=800&h=450&fit=crop",
        isFeatured: false,
        category: "Art",
        organizerId: sarah.id,
      },
    }),
    prisma.event.create({
      data: {
        title: "Marketing Team Brainstorm",
        description: "Closed-door brainstorming session to develop our Q3 marketing strategy. We will review campaign performance, discuss new channels, and plan content themes for the quarter ahead.",
        date: futureDate(5),
        time: "2:00 PM",
        venue: "Office Suite 201",
        visibility: "PRIVATE",
        type: "FREE",
        fee: 0,
        imageUrl: "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=800&h=450&fit=crop",
        isFeatured: false,
        category: "Business",
        organizerId: marcus.id,
      },
    }),
    prisma.event.create({
      data: {
        title: "Private Basketball Pickup Game",
        description: "Weekly basketball game for our regular group. We need exactly 10 players for a proper 5v5 match. Gym is reserved from 6 to 8 PM. Bring indoor shoes and water.",
        date: pastDate(5),
        time: "6:00 PM",
        venue: "Westside Community Gym",
        visibility: "PRIVATE",
        type: "FREE",
        fee: 0,
        imageUrl: "https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800&h=450&fit=crop",
        isFeatured: false,
        category: "Sports",
        organizerId: david.id,
      },
    }),
    prisma.event.create({
      data: {
        title: "Acoustic Jam Session",
        description: "Informal jam session for our musician friends. Bring your acoustic instruments and favorite songs. We will rotate through genres and have fun making music together in a relaxed setting.",
        date: pastDate(20),
        time: "7:00 PM",
        venue: "Carlos' Studio",
        visibility: "PRIVATE",
        type: "FREE",
        fee: 0,
        imageUrl: "https://images.unsplash.com/photo-1511192336575-5a79af67a629?w=800&h=450&fit=crop",
        isFeatured: false,
        category: "Music",
        organizerId: carlos.id,
      },
    }),
  ]);

  // --- 6 PRIVATE PAID events ---
  const privatePaidEvents = await Promise.all([
    prisma.event.create({
      data: {
        title: "Advanced Machine Learning Workshop",
        description: "Intensive two-day workshop covering deep learning architectures, transfer learning, and model deployment. Taught by a senior ML engineer. Prior experience with Python and basic ML concepts required.",
        date: futureDate(35),
        time: "9:00 AM",
        venue: "AI Research Lab, Building C",
        visibility: "PRIVATE",
        type: "PAID",
        fee: 200,
        imageUrl: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=800&h=450&fit=crop",
        isFeatured: true,
        category: "Technology",
        organizerId: admin.id,
      },
    }),
    prisma.event.create({
      data: {
        title: "Executive Wine Tasting Evening",
        description: "An exclusive wine tasting event featuring selections from renowned vineyards. Our sommelier will guide you through flavor profiles and pairing suggestions. Limited to 20 guests for an intimate experience.",
        date: futureDate(40),
        time: "7:30 PM",
        venue: "The Cellar Lounge VIP Room",
        visibility: "PRIVATE",
        type: "PAID",
        fee: 85,
        imageUrl: "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=800&h=450&fit=crop",
        isFeatured: false,
        category: "Community",
        organizerId: fatima.id,
      },
    }),
    prisma.event.create({
      data: {
        title: "Private Photography Masterclass",
        description: "Learn advanced composition, lighting, and post-processing techniques from an award-winning photographer. Small group ensures personalized feedback. Bring your own DSLR or mirrorless camera.",
        date: futureDate(20),
        time: "10:00 AM",
        venue: "Studio 44 Photography Lab",
        visibility: "PRIVATE",
        type: "PAID",
        fee: 120,
        imageUrl: "https://images.unsplash.com/photo-1452587925148-ce544e77e70d?w=800&h=450&fit=crop",
        isFeatured: false,
        category: "Art",
        organizerId: yuki.id,
      },
    }),
    prisma.event.create({
      data: {
        title: "Venture Capital Pitch Practice",
        description: "Practice your startup pitch in front of experienced investors and get actionable feedback. Each participant gets 10 minutes to present followed by a 15-minute Q&A. Refine your deck before demo day.",
        date: futureDate(15),
        time: "3:00 PM",
        venue: "Innovation Center Board Room",
        visibility: "PRIVATE",
        type: "PAID",
        fee: 75,
        imageUrl: "https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=800&h=450&fit=crop",
        isFeatured: false,
        category: "Business",
        organizerId: james.id,
      },
    }),
    prisma.event.create({
      data: {
        title: "VIP Concert After-Party",
        description: "Exclusive backstage after-party following the main concert. Meet the artists, enjoy premium drinks, and dance to a DJ set. Limited VIP passes available for an unforgettable night.",
        date: pastDate(8),
        time: "10:00 PM",
        venue: "Skyline Rooftop Lounge",
        visibility: "PRIVATE",
        type: "PAID",
        fee: 150,
        imageUrl: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&h=450&fit=crop",
        isFeatured: false,
        category: "Music",
        organizerId: carlos.id,
      },
    }),
    prisma.event.create({
      data: {
        title: "Personal Training Boot Camp",
        description: "Four-week intensive fitness boot camp with personalized workout plans and nutrition guidance. Small group of 8 ensures individual attention from our certified personal trainer.",
        date: pastDate(40),
        time: "6:00 AM",
        venue: "Elite Fitness Center",
        visibility: "PRIVATE",
        type: "PAID",
        fee: 180,
        imageUrl: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&h=450&fit=crop",
        isFeatured: false,
        category: "Sports",
        organizerId: david.id,
      },
    }),
  ]);

  const allEvents = [...publicFreeEvents, ...publicPaidEvents, ...privateFreeEvents, ...privatePaidEvents];
  console.log(`Created ${allEvents.length} events.`);

  // ============================================================
  // 3. Create Registrations (35 total, spread across events)
  // ============================================================
  console.log("Creating registrations...");

  // Past events get APPROVED registrations (needed for reviews)
  // Future events get a mix of APPROVED and PENDING
  const pastPublicFreeEvents = publicFreeEvents.filter((e) => e.date < now);
  const pastPublicPaidEvents = publicPaidEvents.filter((e) => e.date < now);
  const pastPrivateFreeEvents = privateFreeEvents.filter((e) => e.date < now);
  const pastPrivatePaidEvents = privatePaidEvents.filter((e) => e.date < now);

  const registrationData: Array<{
    userId: string;
    eventId: string;
    status: "APPROVED" | "PENDING";
    amountPaid?: number;
  }> = [];

  // Past public free events - multiple approved registrations
  for (const event of pastPublicFreeEvents) {
    const attendees = [demoUser, marcus, aisha, david, priya].filter((u) => u.id !== event.organizerId);
    for (const user of attendees) {
      registrationData.push({ userId: user.id, eventId: event.id, status: "APPROVED" });
    }
  }

  // Past public paid events - approved registrations with payment
  for (const event of pastPublicPaidEvents) {
    const attendees = [demoUser, emma, carlos, james, yuki].filter((u) => u.id !== event.organizerId);
    for (const user of attendees) {
      registrationData.push({ userId: user.id, eventId: event.id, status: "APPROVED", amountPaid: event.fee });
    }
  }

  // Past private free events - approved registrations
  for (const event of pastPrivateFreeEvents) {
    const attendees = [sarah, marcus, fatima].filter((u) => u.id !== event.organizerId);
    for (const user of attendees) {
      registrationData.push({ userId: user.id, eventId: event.id, status: "APPROVED" });
    }
  }

  // Past private paid events - approved registrations with payment
  for (const event of pastPrivatePaidEvents) {
    const attendees = [demoUser, priya, emma].filter((u) => u.id !== event.organizerId);
    for (const user of attendees) {
      registrationData.push({ userId: user.id, eventId: event.id, status: "APPROVED", amountPaid: event.fee });
    }
  }

  // Future events - mix of approved and pending
  const futureEvents = allEvents.filter((e) => e.date >= now);
  for (const event of futureEvents.slice(0, 8)) {
    const attendees = [demoUser, sarah, marcus, aisha].filter((u) => u.id !== event.organizerId);
    for (const user of attendees.slice(0, 2)) {
      registrationData.push({
        userId: user.id,
        eventId: event.id,
        status: "APPROVED",
        amountPaid: event.fee > 0 ? event.fee : undefined,
      });
    }
    if (attendees.length > 2) {
      registrationData.push({ userId: attendees[2].id, eventId: event.id, status: "PENDING" });
    }
  }

  // Deduplicate by unique [userId, eventId] constraint
  const uniqueRegs = new Map<string, (typeof registrationData)[0]>();
  for (const reg of registrationData) {
    const key = `${reg.userId}-${reg.eventId}`;
    if (!uniqueRegs.has(key)) {
      uniqueRegs.set(key, reg);
    }
  }

  const registrations = [];
  for (const reg of uniqueRegs.values()) {
    const created = await prisma.registration.create({
      data: {
        userId: reg.userId,
        eventId: reg.eventId,
        status: reg.status,
        amountPaid: reg.amountPaid ?? null,
      },
    });
    registrations.push(created);
  }

  console.log(`Created ${registrations.length} registrations.`);

  // ============================================================
  // 4. Create Reviews (only for past events with APPROVED registrations)
  // ============================================================
  console.log("Creating reviews...");

  const reviewComments = [
    "Absolutely fantastic event! The organization was top-notch and I had a wonderful time.",
    "Great atmosphere and well-organized. Would definitely attend again next time.",
    "Really enjoyed the experience. The venue was perfect and everything ran smoothly.",
    "One of the best events I have been to this year. Highly recommend it to everyone.",
    "Good event overall, though the scheduling could have been a bit tighter.",
    "Wonderful experience from start to finish. The speakers were incredibly knowledgeable.",
    "Had an amazing time! Met so many interesting people and learned a lot.",
    "Well worth the time. The organizer did a phenomenal job putting this together.",
    "Exceeded my expectations. The quality of content was outstanding throughout.",
    "Decent event but the venue was a bit crowded. Content was still very good though.",
    "A truly memorable experience. I have already shared it with all my friends.",
    "Professional and well-executed. Looking forward to the next edition eagerly.",
    "The interactive sessions were the highlight for me. Engaging and informative.",
    "Solid event with great networking opportunities. Made valuable connections here.",
    "Loved the casual yet professional vibe. Perfect balance of fun and learning.",
    "Everything was well thought out, from the location to the refreshments served.",
    "A must-attend event for anyone in the community. Five stars all around.",
  ];

  const reviewData: Array<{ userId: string; eventId: string; rating: number; comment: string }> = [];
  let commentIndex = 0;

  // Get all approved registrations for past events
  const pastEventIds = new Set(
    allEvents.filter((e) => e.date < now).map((e) => e.id)
  );

  const approvedPastRegs = registrations.filter(
    (r) => r.status === "APPROVED" && pastEventIds.has(r.eventId)
  );

  for (const reg of approvedPastRegs) {
    // Weighted toward 4-5 stars for testimonials
    const weights = [3, 4, 4, 5, 5, 5];
    const rating = weights[Math.floor(Math.random() * weights.length)];
    reviewData.push({
      userId: reg.userId,
      eventId: reg.eventId,
      rating,
      comment: reviewComments[commentIndex % reviewComments.length],
    });
    commentIndex++;
  }

  const reviews = [];
  for (const review of reviewData) {
    const created = await prisma.review.create({
      data: {
        userId: review.userId,
        eventId: review.eventId,
        rating: review.rating,
        comment: review.comment,
      },
    });
    reviews.push(created);
  }

  console.log(`Created ${reviews.length} reviews.`);

  // ============================================================
  // 5. Create Blog Posts (6 posts)
  // ============================================================
  console.log("Creating blog posts...");

  const blogPosts = [
    {
      title: "Getting Started with Event Planning",
      content: `<h2>Your First Steps into Event Planning</h2>
<p>Event planning can seem overwhelming at first, but with the right approach and tools, anyone can organize a successful event. Whether you are planning a small community meetup or a large-scale conference, the fundamentals remain the same.</p>
<p>The key to successful event planning lies in <strong>starting early</strong> and <strong>staying organized</strong>. Create a timeline that works backward from your event date, ensuring every detail is accounted for well in advance.</p>
<h2>Essential Planning Checklist</h2>
<ul>
<li>Define your event goals and target audience clearly</li>
<li>Set a realistic budget and track all expenses diligently</li>
<li>Choose a venue that fits your needs and capacity requirements</li>
<li>Create a marketing plan to reach your intended audience effectively</li>
<li>Plan for contingencies and have backup solutions ready</li>
</ul>
<p>Remember, the best events are those where attendees feel <em>valued and engaged</em>. Focus on creating meaningful experiences rather than just filling seats, and your events will naturally attract repeat attendees.</p>`,
      coverImage: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&h=450&fit=crop",
      tags: "events,planning,beginner,guide",
      authorId: admin.id,
    },
    {
      title: "Top 10 Tips for Hosting a Memorable Event",
      content: `<h2>Make Your Event Unforgettable</h2>
<p>Hosting an event that people remember long after it ends requires attention to detail and a genuine focus on the attendee experience. Here are our top ten tried-and-tested tips for creating lasting impressions.</p>
<h2>The Tips That Matter Most</h2>
<p><strong>1. Know Your Audience.</strong> Tailor every aspect of your event to the people who will attend. Research their preferences, needs, and expectations before making major decisions.</p>
<p><strong>2. Create Interactive Elements.</strong> Passive audiences disengage quickly. Include Q&A sessions, workshops, polling, or networking activities to keep energy levels high throughout.</p>
<p><strong>3. Invest in Quality Catering.</strong> Never underestimate the power of good food. Even simple refreshments, when done well, can elevate the entire event experience significantly.</p>
<p><strong>4. Leverage Technology.</strong> Use event management platforms like Planora to streamline registrations, communications, and post-event feedback collection.</p>
<p><em>The remaining tips include perfecting your timing, choosing the right venue, training your volunteers, creating shareable moments, following up afterward, and gathering feedback for continuous improvement.</em></p>`,
      coverImage: "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=800&h=450&fit=crop",
      tags: "tips,hosting,events,best-practices",
      authorId: sarah.id,
    },
    {
      title: "How to Choose the Right Venue",
      content: `<h2>The Venue Makes the Event</h2>
<p>Your venue choice can make or break your event. The right space enhances the atmosphere, supports your activities, and makes logistics seamless. The wrong one creates headaches that no amount of planning can overcome.</p>
<h2>Key Factors to Consider</h2>
<p><strong>Location and Accessibility.</strong> Choose a venue that is easy to find and accessible by public transport. Consider parking availability and proximity to hotels for out-of-town guests.</p>
<p><strong>Capacity and Layout.</strong> Ensure the space comfortably fits your expected attendance with room for activities. An overcrowded venue creates discomfort, while an oversized one feels empty and impersonal.</p>
<p><strong>Technical Requirements.</strong> Check for adequate AV equipment, reliable Wi-Fi, and sufficient power outlets. Nothing derails a tech event faster than poor connectivity or equipment failures.</p>
<h2>Budget Considerations</h2>
<p>Venue costs typically represent 30-50% of your total event budget. When comparing prices, factor in <em>hidden costs</em> like security deposits, cleaning fees, overtime charges, and required vendor restrictions. Always negotiate and ask about package deals.</p>`,
      coverImage: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&h=450&fit=crop",
      tags: "venue,guide,planning,budget",
      authorId: admin.id,
    },
    {
      title: "The Future of Virtual Events",
      content: `<h2>Beyond the Screen: What Is Next</h2>
<p>Virtual events have evolved dramatically since their initial rise. What started as simple video calls has transformed into immersive digital experiences that rival in-person gatherings in engagement and impact.</p>
<p>The future lies in <strong>hybrid models</strong> that combine the best of both worlds. Attendees choose how they want to participate, and organizers reach audiences they never could with a single format.</p>
<h2>Emerging Technologies</h2>
<p>Artificial intelligence is revolutionizing how we plan and execute virtual events. From automated matchmaking for networking to real-time translation services, AI makes events more inclusive and personalized.</p>
<p><strong>Virtual reality meetups</strong> are becoming mainstream, offering spatial audio and avatar interactions that feel surprisingly natural. Early adopters report higher engagement rates compared to traditional video platforms.</p>
<h2>Practical Advice for Organizers</h2>
<ul>
<li>Invest in a reliable streaming platform with interactive features</li>
<li>Provide engaging content that works across time zones</li>
<li>Include breakout rooms for small-group discussions and networking</li>
<li>Record sessions for on-demand viewing by those who cannot attend live</li>
</ul>`,
      coverImage: "https://images.unsplash.com/photo-1591115765373-5f9cf1da241d?w=800&h=450&fit=crop",
      tags: "virtual,technology,future,hybrid",
      authorId: priya.id,
    },
    {
      title: "Event Marketing on a Budget",
      content: `<h2>Maximize Impact, Minimize Spend</h2>
<p>You do not need a massive marketing budget to fill your event. Smart, targeted marketing strategies can generate buzz and drive registrations without breaking the bank. It is all about working smarter, not spending more.</p>
<h2>Free and Low-Cost Strategies</h2>
<p><strong>Social Media.</strong> Create event pages on all major platforms. Share behind-the-scenes content, speaker spotlights, and attendee testimonials to build anticipation organically. Encourage sharing with hashtags.</p>
<p><strong>Email Marketing.</strong> Build a mailing list and send targeted invitations. Personalized emails have significantly higher conversion rates than generic blasts. Segment your audience for maximum relevance.</p>
<p><strong>Community Partnerships.</strong> Partner with local businesses, organizations, and influencers who share your target audience. Cross-promotion benefits everyone involved and amplifies reach exponentially.</p>
<h2>Measuring Your Results</h2>
<p>Track every marketing channel to understand what works for your specific audience. Use <em>UTM parameters</em>, unique discount codes, and registration surveys to attribute sign-ups to specific campaigns. Double down on what performs best.</p>`,
      coverImage: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=450&fit=crop",
      tags: "marketing,budget,social-media,strategy",
      authorId: marcus.id,
    },
    {
      title: "Building Community Through Local Meetups",
      content: `<h2>The Power of Local Connections</h2>
<p>In an increasingly digital world, local meetups offer something irreplaceable: genuine human connection. Building a thriving local community starts with consistent, welcoming events that bring people together around shared interests.</p>
<h2>Starting Your Own Meetup</h2>
<p><strong>Find your niche.</strong> The most successful meetups focus on a specific topic or interest. Whether it is frontend development, board games, or urban gardening, specificity attracts dedicated attendees who keep coming back.</p>
<p><strong>Consistency is key.</strong> Set a regular schedule, whether weekly, bi-weekly, or monthly, and stick to it. Regular attendees form the backbone of your community and help welcome newcomers warmly.</p>
<p><strong>Create a safe space.</strong> Establish clear codes of conduct and actively foster an <em>inclusive environment</em>. The best communities are those where everyone feels welcome regardless of their background or experience level.</p>
<h2>Growing Your Community</h2>
<ul>
<li>Start small and let growth happen organically over time</li>
<li>Encourage attendees to invite friends and colleagues</li>
<li>Rotate leadership roles to prevent organizer burnout</li>
<li>Use platforms like Planora to manage registrations and communication seamlessly</li>
</ul>
<p>Remember that community building is a marathon, not a sprint. The relationships formed at local meetups often become the most valuable professional and personal connections in people's lives.</p>`,
      coverImage: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=800&h=450&fit=crop",
      tags: "community,meetups,local,networking",
      authorId: emma.id,
    },
  ];

  function stripHtml(html: string): string {
    return html.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
  }

  for (const post of blogPosts) {
    const plainText = stripHtml(post.content);
    const excerpt = plainText.substring(0, 200) + (plainText.length > 200 ? "..." : "");
    await prisma.blogPost.create({
      data: {
        title: post.title,
        content: post.content,
        excerpt,
        coverImage: post.coverImage,
        tags: post.tags,
        published: true,
        authorId: post.authorId,
      },
    });
  }

  console.log(`Created ${blogPosts.length} blog posts.`);

  // ============================================================
  // 6. Create Newsletter Subscriptions (5 total)
  // ============================================================
  console.log("Creating newsletter subscriptions...");

  const newsletterEmails = [
    "user@demo.com",
    "sarah.chen@example.com",
    "marcus.johnson@example.com",
    "newsletter.fan@gmail.com",
    "events.lover@outlook.com",
  ];

  for (const email of newsletterEmails) {
    await prisma.newsletterSubscription.create({
      data: { email },
    });
  }

  console.log(`Created ${newsletterEmails.length} newsletter subscriptions.`);

  // ============================================================
  // Summary
  // ============================================================
  console.log("\n=== Seed Complete ===");
  console.log(`Users: ${allUsers.length}`);
  console.log(`Events: ${allEvents.length}`);
  console.log(`Registrations: ${registrations.length}`);
  console.log(`Reviews: ${reviews.length}`);
  console.log(`Blog Posts: ${blogPosts.length}`);
  console.log(`Newsletter Subscriptions: ${newsletterEmails.length}`);
  console.log("\nDemo accounts:");
  console.log("  admin@demo.com / demo1234 (role: admin)");
  console.log("  user@demo.com / demo1234 (role: user)");
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
