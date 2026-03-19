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
