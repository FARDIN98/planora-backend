import express from "express";
import cors from "cors";
import swaggerUi from "swagger-ui-express";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./lib/auth.js";
import { swaggerSpec, swaggerCssOverride } from "./config/swagger.js";
import healthRoutes from "./routes/health.routes.js";
import v1AuthRoutes from "./routes/v1.auth.routes.js";
import eventRoutes from "./routes/event.routes.js";
import registrationRoutes, { userRegistrationRouter } from "./routes/registration.routes.js";
import { stripeWebhookHandler } from "./routes/webhook.routes.js";

const app = express();
const PORT = process.env.PORT || 5001;
const BASE_URL = process.env.BETTER_AUTH_URL || `http://localhost:${PORT}`;

// Trust proxy -- CRITICAL for Render (reverse proxy, HTTPS termination)
app.set("trust proxy", 1);

// CORS configuration -- must come before all route handlers
app.use(cors({
  origin: [
    process.env.FRONTEND_URL || "http://localhost:3000",
    "http://localhost:3000",
  ],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
}));

// Swagger API documentation -- always light mode
app.use(
  "/api/docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    customCss: swaggerCssOverride,
    customSiteTitle: "Planora API Documentation",
    swaggerOptions: {
      persistAuthorization: true,
    },
  }),
);

// Better Auth handler -- MUST come BEFORE express.json()
// Better Auth parses its own request bodies; express.json() would consume the stream
app.all("/api/auth/{*splat}", toNodeHandler(auth));

// Stripe webhook -- MUST come BEFORE express.json() (needs raw body for signature verification)
app.post("/api/webhooks/stripe", express.raw({ type: "application/json" }), stripeWebhookHandler);

// Body parsing for all OTHER routes (after auth handler and webhook)
app.use(express.json());

// --- API v1 Routes ---
app.use("/api/v1/health", healthRoutes);
app.use("/api/v1/auth", v1AuthRoutes);
app.use("/api/v1/events", eventRoutes);
app.use("/api/v1/events/:eventId/registrations", registrationRoutes);
app.use("/api/v1/registrations", userRegistrationRouter);

// Legacy health check (keep for backward compatibility with Render health checks)
app.get("/api/health", (_req, res) => {
  res.json({ success: true, data: { status: "ok", timestamp: new Date().toISOString() } });
});

// Start server
app.listen(PORT, () => {
  console.log("\n┌─────────────────────────────────────────────┐");
  console.log("│           Planora Backend Server             │");
  console.log("├─────────────────────────────────────────────┤");
  console.log(`│  Server:   ${BASE_URL}`);
  console.log(`│  Health:   ${BASE_URL}/api/v1/health`);
  console.log(`│  Swagger:  ${BASE_URL}/api/docs`);
  console.log("├─────────────────────────────────────────────┤");
  console.log(`│  Env:      ${process.env.NODE_ENV || "development"}`);
  console.log(`│  Port:     ${PORT}`);
  console.log("└─────────────────────────────────────────────┘\n");
});

export default app;
