# Planora — Backend

REST API for **Planora**, a full-stack event management platform where users can create, discover, join, and manage events with role-based access, Stripe payments, and an invitation system.
---

---
## Admin Credentials

```
Email    : admin@planora.com
Password : admin123
```
---

## Features

- **JWT Authentication** — Register, login, and stateless token-based sessions (7-day expiry)
- **Event CRUD** — Create, read, update, and delete events with search, filter, sort, and pagination
- **Smart Participation System**
  - Public Free → instant join
  - Public Paid → Stripe checkout → pending approval
  - Private Free → request to join → pending approval
  - Private Paid → Stripe checkout → pending approval
- **Stripe Payment Integration** — Checkout sessions, webhook handling, idempotent processing
- **Invitation System** — Host can invite users by email, with Pay & Accept flow for paid events
- **Review & Rating System** — Approved participants can rate (1–5) and review events
- **Role-Based Access Control** — Admin and User roles with middleware enforcement
- **Admin Panel API** — Monitor events/users, delete accounts, set featured events
- **Rate Limiting** — 20 req/15min on auth routes, 100 req/15min on general API
- **Input Validation** — Zod schemas with detailed error messages
- **Email Notifications** — Nodemailer integration for registration and invitation updates
- **Swagger API Documentation** — Auto-generated interactive docs at `/api/docs`

---

## Tech Stack

| Layer          | Technology                          |
| -------------- | ----------------------------------- |
| Runtime        | Node.js / Bun                       |
| Framework      | Express.js 5                        |
| ORM            | Prisma 7 + Neon Serverless Adapter  |
| Database       | PostgreSQL (Neon)                   |
| Authentication | JSON Web Tokens (jsonwebtoken)      |
| Passwords      | bcryptjs (12 salt rounds)           |
| Payments       | Stripe SDK                          |
| Validation     | Zod 4                               |
| Email          | Nodemailer                          |
| Security       | Helmet, CORS, express-rate-limit    |
| Docs           | Swagger (swagger-jsdoc + swagger-ui)|
| Deployment     | Render                              |

---

## Project Structure

```
src/
├── config/          # Swagger configuration
├── lib/             # Prisma client, JWT helpers, Stripe client
├── middleware/       # Auth, validation, rate-limit, error handler
├── routes/          # Express route definitions
├── schemas/         # Zod validation schemas
├── services/        # Business logic (events, registrations, reviews, etc.)
└── index.ts         # Application entry point
prisma/
├── schema.prisma    # Database schema
├── seed.ts          # Admin user seeder
└── migrations/      # Database migrations
```

---

## API Endpoints

### Auth
| Method | Endpoint                      | Description              |
| ------ | ----------------------------- | ------------------------ |
| POST   | `/api/v1/auth/register`       | Create account           |
| POST   | `/api/v1/auth/login`          | Sign in                  |
| POST   | `/api/v1/auth/logout`         | Logout                   |
| GET    | `/api/v1/auth/me`             | Get current user profile |
| PUT    | `/api/v1/auth/me`             | Update profile name      |
| GET    | `/api/v1/auth/notifications`  | Get notification prefs   |
| PUT    | `/api/v1/auth/notifications`  | Update notification prefs|

### Events
| Method | Endpoint                      | Description              |
| ------ | ----------------------------- | ------------------------ |
| POST   | `/api/v1/events`              | Create event             |
| GET    | `/api/v1/events`              | List events (search/filter/paginate) |
| GET    | `/api/v1/events/featured`     | Get featured event       |
| GET    | `/api/v1/events/my`           | My organized events      |
| GET    | `/api/v1/events/:id`          | Event details            |
| PUT    | `/api/v1/events/:id`          | Update event             |
| DELETE | `/api/v1/events/:id`          | Delete event             |

### Registrations
| Method | Endpoint                                        | Description            |
| ------ | ----------------------------------------------- | ---------------------- |
| POST   | `/api/v1/events/:eventId/registrations`         | Join / request to join |
| GET    | `/api/v1/events/:eventId/registrations`         | List registrations (host) |
| PATCH  | `/api/v1/events/:eventId/registrations/:regId`  | Approve/reject/ban     |
| GET    | `/api/v1/registrations/my`                      | My registrations       |

### Invitations
| Method | Endpoint                                        | Description            |
| ------ | ----------------------------------------------- | ---------------------- |
| POST   | `/api/v1/events/:eventId/invitations`           | Invite user by email   |
| GET    | `/api/v1/events/:eventId/invitations`           | List invitations (host)|
| GET    | `/api/v1/invitations/my`                        | My received invitations|
| POST   | `/api/v1/invitations/:invitationId/respond`     | Accept / decline       |

### Reviews
| Method | Endpoint                                | Description            |
| ------ | --------------------------------------- | ---------------------- |
| POST   | `/api/v1/events/:eventId/reviews`       | Write a review         |
| GET    | `/api/v1/events/:eventId/reviews`       | List reviews           |
| GET    | `/api/v1/reviews/my`                    | My reviews             |
| PUT    | `/api/v1/reviews/:reviewId`             | Edit review            |
| DELETE | `/api/v1/reviews/:reviewId`             | Delete review          |

### Admin
| Method | Endpoint                                | Description              |
| ------ | --------------------------------------- | ------------------------ |
| GET    | `/api/v1/admin/events`                  | List all events          |
| DELETE | `/api/v1/admin/events/:id`              | Delete any event         |
| PATCH  | `/api/v1/admin/events/:id/featured`     | Set featured event       |
| DELETE | `/api/v1/admin/events/:id/featured`     | Remove featured status   |
| GET    | `/api/v1/admin/users`                   | List all users           |
| DELETE | `/api/v1/admin/users/:id`               | Delete user account      |

### Webhooks
| Method | Endpoint                  | Description              |
| ------ | ------------------------- | ------------------------ |
| POST   | `/api/webhooks/stripe`    | Stripe payment webhook   |

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) 18+ or [Bun](https://bun.sh/) 1.0+
- [PostgreSQL](https://www.postgresql.org/) database (or [Neon](https://neon.tech/) account)
- [Stripe](https://stripe.com/) account for payment processing

### Installation

```bash
# Clone the repository
git clone https://github.com/FARDIN98/planora-backend.git
cd planora-backend

# Install dependencies
bun install
```

### Environment Variables

Create a `.env` file in the root directory:

```env
DATABASE_URL=""
FRONTEND_URL=""
PORT=
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
```

### Database Setup

```bash
# Run migrations
bunx prisma migrate deploy

# Seed admin user
bunx prisma db seed
```

### Run Development Server

```bash
bun run dev
```

The server starts at `http://localhost:5001`. API docs available at `http://localhost:5001/api/docs`.

---
## Deployment

Deployed on **Render** as a web service. The `start` script uses `node --import tsx` for Node.js runtime compatibility:

```bash
bun run start
```
