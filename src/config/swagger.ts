import swaggerJSDoc from "swagger-jsdoc";

const PORT = process.env.PORT || 5001;
const BASE_URL = process.env.BETTER_AUTH_URL || `http://localhost:${PORT}`;

const swaggerDefinition: swaggerJSDoc.OAS3Definition = {
  openapi: "3.0.3",
  info: {
    title: "Planora API",
    version: "1.0.0",
    description:
      "RESTful API for Planora — an event management platform. Create, discover, and manage events with authentication, reviews, invitations, and admin controls.",
    contact: {
      name: "Planora Team",
      email: "support@planora.com",
    },
    license: {
      name: "MIT",
    },
  },
  servers: [
    {
      url: BASE_URL,
      description:
        process.env.NODE_ENV === "production"
          ? "Production server"
          : "Local development server",
    },
  ],
  tags: [
    {
      name: "Health",
      description: "Server health and status checks",
    },
    {
      name: "Auth",
      description: "Authentication — register, login, logout, and session management",
    },
    {
      name: "Events",
      description: "Event management — create, list, update, delete events",
    },
    {
      name: "Registrations",
      description: "Event participation — join events, manage registrations",
    },
    {
      name: "Reviews",
      description: "Reviews and ratings -- rate events, write/edit/delete reviews",
    },
    {
      name: "Invitations",
      description: "Invitation management -- invite users, accept/decline invitations",
    },
    {
      name: "Admin",
      description: "Admin-only operations -- manage events and users",
    },
    {
      name: "Webhooks",
      description: "Stripe webhook endpoint for payment confirmation",
    },
  ],
  components: {
    securitySchemes: {
      cookieAuth: {
        type: "apiKey",
        in: "cookie",
        name: "better-auth.session_token",
        description: "Session cookie set automatically after login",
      },
    },
    schemas: {
      ErrorResponse: {
        type: "object",
        properties: {
          success: { type: "boolean", example: false },
          error: {
            type: "object",
            properties: {
              message: { type: "string", example: "Unauthorized" },
              code: { type: "string", example: "UNAUTHORIZED" },
            },
          },
        },
      },
      User: {
        type: "object",
        properties: {
          id: { type: "string", example: "abc123xyz" },
          name: { type: "string", example: "John Doe" },
          email: { type: "string", format: "email", example: "john@example.com" },
          role: { type: "string", enum: ["user", "admin"], example: "user" },
          image: { type: "string", nullable: true },
          emailVerified: { type: "boolean", example: false },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      Session: {
        type: "object",
        properties: {
          id: { type: "string" },
          userId: { type: "string" },
          expiresAt: { type: "string", format: "date-time" },
          token: { type: "string" },
        },
      },
      Event: {
        type: "object",
        properties: {
          id: { type: "string", example: "clxyz123abc" },
          title: { type: "string", example: "Tech Conference 2026" },
          description: { type: "string", example: "A comprehensive technology conference." },
          date: { type: "string", format: "date-time" },
          time: { type: "string", example: "09:00" },
          venue: { type: "string", example: "Convention Center, Dhaka" },
          visibility: { type: "string", enum: ["PUBLIC", "PRIVATE"], example: "PUBLIC" },
          type: { type: "string", enum: ["FREE", "PAID"], example: "FREE" },
          fee: { type: "number", example: 0 },
          imageUrl: { type: "string", nullable: true },
          isFeatured: { type: "boolean", example: false },
          category: { type: "string", example: "General" },
          organizerId: { type: "string" },
          organizer: {
            type: "object",
            properties: {
              id: { type: "string" },
              name: { type: "string" },
              email: { type: "string", format: "email" },
              image: { type: "string", nullable: true },
            },
          },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      EventListResponse: {
        type: "object",
        properties: {
          events: {
            type: "array",
            items: { $ref: "#/components/schemas/Event" },
          },
          total: { type: "integer", example: 25 },
          page: { type: "integer", example: 1 },
          limit: { type: "integer", example: 10 },
          totalPages: { type: "integer", example: 3 },
        },
      },
      PaginationMeta: {
        type: "object",
        properties: {
          total: { type: "integer", description: "Total number of items" },
          page: { type: "integer", description: "Current page number" },
          limit: { type: "integer", description: "Items per page" },
          totalPages: { type: "integer", description: "Total number of pages" },
        },
      },
      Review: {
        type: "object",
        properties: {
          id: { type: "string", example: "clxyz789ghi" },
          rating: { type: "integer", minimum: 1, maximum: 5, example: 4 },
          comment: { type: "string", example: "Great event! Really enjoyed the sessions." },
          userId: { type: "string" },
          eventId: { type: "string" },
          user: {
            type: "object",
            properties: {
              id: { type: "string" },
              name: { type: "string" },
              image: { type: "string", nullable: true },
            },
          },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      Registration: {
        type: "object",
        properties: {
          id: { type: "string", example: "clxyz456def" },
          status: {
            type: "string",
            enum: ["PENDING", "APPROVED", "REJECTED", "BANNED"],
            example: "APPROVED",
          },
          userId: { type: "string" },
          eventId: { type: "string" },
          stripeSessionId: { type: "string", nullable: true },
          amountPaid: { type: "number", nullable: true, example: 25.0 },
          user: {
            type: "object",
            properties: {
              id: { type: "string" },
              name: { type: "string" },
              email: { type: "string", format: "email" },
            },
          },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      RateLimitError: {
        type: "object",
        properties: {
          success: { type: "boolean", example: false },
          error: {
            type: "object",
            properties: {
              message: {
                type: "string",
                example: "Too many requests, please try again later",
              },
              code: { type: "string", example: "RATE_LIMIT_EXCEEDED" },
            },
          },
        },
      },
      Invitation: {
        type: "object",
        properties: {
          id: { type: "string", example: "clxyz789inv" },
          status: {
            type: "string",
            enum: ["PENDING", "ACCEPTED", "DECLINED"],
            example: "PENDING",
          },
          senderId: { type: "string" },
          receiverId: { type: "string" },
          eventId: { type: "string" },
          stripeSessionId: { type: "string", nullable: true },
          amountPaid: { type: "number", nullable: true },
          receiver: {
            type: "object",
            properties: {
              id: { type: "string" },
              name: { type: "string" },
              email: { type: "string", format: "email" },
            },
          },
          sender: {
            type: "object",
            properties: {
              id: { type: "string" },
              name: { type: "string" },
            },
          },
          event: {
            type: "object",
            properties: {
              id: { type: "string" },
              title: { type: "string" },
              type: { type: "string", enum: ["FREE", "PAID"] },
              fee: { type: "number" },
            },
          },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
    },
  },
};

const options: swaggerJSDoc.Options = {
  swaggerDefinition,
  apis: ["./src/routes/*.ts"],
};

export const swaggerSpec = swaggerJSDoc(options);

// Custom CSS to force light mode
export const swaggerCssOverride = `
  :root { color-scheme: light !important; }
  html, body, .swagger-ui {
    background-color: #ffffff !important;
    color: #3b4151 !important;
    color-scheme: light !important;
  }
  .swagger-ui .topbar { background-color: #e8590c !important; }
  .swagger-ui .topbar .download-url-wrapper .select-label select { border-color: #fff3 !important; }
  .swagger-ui .info .title { color: #1a1a1a !important; }
  .swagger-ui .info p, .swagger-ui .info li { color: #3b4151 !important; }
  .swagger-ui .opblock-tag { color: #3b4151 !important; border-bottom-color: #e0e0e0 !important; }
  .swagger-ui .opblock .opblock-summary-description { color: #3b4151 !important; }
  .swagger-ui .opblock .opblock-section-header { background: #f7f7f7 !important; }
  .swagger-ui .opblock .opblock-section-header h4 { color: #3b4151 !important; }
  .swagger-ui .model-title { color: #3b4151 !important; }
  .swagger-ui table thead tr td, .swagger-ui table thead tr th { color: #3b4151 !important; }
  .swagger-ui .parameter__name { color: #3b4151 !important; }
  .swagger-ui .parameter__type { color: #666 !important; }
  .swagger-ui .response-col_status { color: #3b4151 !important; }
  .swagger-ui .response-col_description { color: #3b4151 !important; }
  .swagger-ui .btn { color: #3b4151 !important; }
  .swagger-ui select { color: #3b4151 !important; }
  @media (prefers-color-scheme: dark) {
    html, body, .swagger-ui { background-color: #ffffff !important; color: #3b4151 !important; }
  }
`;
