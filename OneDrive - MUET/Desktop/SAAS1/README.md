# SEO Audit Pro - SaaS SEO Platform

A complete SaaS platform for generating branded SEO audit reports in under 90 seconds. Perfect for agencies, freelancers, and marketing professionals.

## 🚀 Features

- **60-Second Audits**: Complete SEO analysis including technical, on-page, performance, and security checks
- **White-Label Branding**: Custom logo, colors, and domain
- **Beautiful PDF Reports**: Professionally designed, client-ready reports
- **Client Portal**: Give clients their own dashboard
- **Embeddable Widget**: Capture leads from your website
- **Team Collaboration**: Invite team members with role-based access
- **API Access**: Integrate audits into your workflows
- **Multi-Tenant Support**: Agency-level organization management

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         NGINX                                    │
│                    (Reverse Proxy)                               │
└───────────────┬──────────────────────────────────────┬──────────┘
                │                                      │
        ┌───────▼───────┐                    ┌────────▼────────┐
        │   Frontend    │                    │    Backend      │
        │  (Next.js)    │◄──────────────────►│   (Express)     │
        │   Port 3000   │                    │   Port 4000     │
        └───────────────┘                    └────────┬────────┘
                                                      │
                ┌─────────────────────────────────────┼─────────────────┐
                │                                     │                 │
        ┌───────▼───────┐    ┌───────────────┐    ┌──▼────┐    ┌──────▼──────┐
        │  SEO Engine   │    │  PDF Engine   │    │ Redis │    │  PostgreSQL │
        │  (FastAPI)    │    │  (Puppeteer)  │    │       │    │             │
        │   Port 8000   │    │   Port 5000   │    │ 6379  │    │    5432     │
        └───────────────┘    └───────────────┘    └───────┘    └─────────────┘
```

## 📁 Project Structure

```
SAAS1/
├── backend/                 # Express.js API server
│   ├── src/
│   │   ├── config/         # Database & Redis config
│   │   ├── middleware/     # Auth, rate limiting, error handling
│   │   ├── routes/         # API routes
│   │   ├── services/       # Business logic
│   │   ├── queues/         # BullMQ workers
│   │   └── utils/          # Helpers & utilities
│   └── prisma/             # Database schema & migrations
│
├── frontend/               # Next.js 15 application
│   └── src/
│       ├── app/           # App router pages
│       ├── components/    # Reusable components
│       └── lib/           # API client & utilities
│
├── seo-engine/            # Python SEO analysis microservice
│   └── src/
│       ├── analyzers/     # SEO analysis modules
│       └── crawler/       # Web crawler
│
├── pdf-engine/            # PDF generation service
│   └── src/
│       └── templates/     # Handlebars templates
│
├── widget/                # Embeddable JavaScript widget
│
├── deployment/            # Docker & deployment configs
│   ├── docker/           # Dockerfiles
│   ├── nginx/            # Nginx config
│   └── docker-compose.yml
│
└── .github/workflows/     # CI/CD pipelines
```

## 🛠️ Tech Stack

### Backend
- **Runtime**: Node.js 20 + TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL with Prisma ORM
- **Cache/Queue**: Redis + BullMQ
- **Auth**: JWT + Google OAuth
- **Email**: Resend
- **Payments**: Stripe

### Frontend
- **Framework**: Next.js 15 (App Router)
- **Styling**: TailwindCSS
- **State**: React Query
- **Charts**: Chart.js
- **Forms**: React Hook Form + Zod

### Services
- **SEO Engine**: Python + FastAPI
- **PDF Engine**: Node.js + Puppeteer
- **Storage**: AWS S3

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- Python 3.11+
- PostgreSQL 16+
- Redis 7+
- Docker (optional)

### Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/seo-audit-pro.git
   cd seo-audit-pro
   ```

2. **Setup environment variables**
   ```bash
   cp deployment/.env.example .env
   # Edit .env with your configuration
   ```

3. **Start databases with Docker**
   ```bash
   docker-compose up postgres redis -d
   ```

4. **Setup Backend**
   ```bash
   cd backend
   npm install
   npx prisma generate
   npx prisma db push
   npm run dev
   ```

5. **Setup Frontend**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

6. **Setup SEO Engine**
   ```bash
   cd seo-engine
   python -m venv venv
   source venv/bin/activate  # or `venv\Scripts\activate` on Windows
   pip install -r requirements.txt
   uvicorn src.main:app --reload --port 8000
   ```

7. **Setup PDF Engine**
   ```bash
   cd pdf-engine
   npm install
   npm run dev
   ```

### Docker Deployment

```bash
cd deployment
docker-compose up -d
```

## 🔐 Environment Variables

See `deployment/.env.example` for all required variables. Key ones include:

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `REDIS_URL` | Redis connection string |
| `JWT_SECRET` | Secret for JWT signing |
| `STRIPE_SECRET_KEY` | Stripe API key |
| `RESEND_API_KEY` | Resend email API key |
| `PAGESPEED_API_KEY` | Google PageSpeed API key |
| `OPENAI_API_KEY` | OpenAI API key (for AI summaries) |

## 📊 API Endpoints

### Authentication
- `POST /api/auth/signup` - Register new user
- `POST /api/auth/login` - Login
- `POST /api/auth/verify-email` - Verify email
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password

### Audits
- `POST /api/audits` - Create new audit
- `GET /api/audits` - List audits
- `GET /api/audits/:id` - Get audit details
- `DELETE /api/audits/:id` - Delete audit

### Clients
- `POST /api/clients` - Create client
- `GET /api/clients` - List clients
- `POST /api/clients/:id/portal` - Enable portal access

### Billing
- `GET /api/billing/plans` - Get available plans
- `POST /api/billing/checkout` - Create checkout session
- `POST /api/billing/portal` - Create customer portal

## 🧪 Testing

```bash
# Backend tests
cd backend && npm test

# Frontend tests
cd frontend && npm test

# SEO Engine tests
cd seo-engine && pytest
```

## 🚢 Deployment

### Staging
Automatically deploys on push to `develop` branch.

### Production
Automatically deploys on push to `main` branch or version tags.

Supports blue-green deployment with automatic rollback.

## 📄 License

MIT License - see LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request
