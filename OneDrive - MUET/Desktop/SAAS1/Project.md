🧠 Product Summary

A SaaS platform where users can enter a URL and receive a branded SEO audit PDF with actionable fixes within 90 seconds.
Optimized for:

Lead generation

Onboarding new clients

Agency white-label reporting

Automation via widgets & API

🎯 Target Users

SEO freelancers

Digital marketing agencies

Web development agencies

SaaS companies wanting lead-gen tools

SMBs doing internal SEO

💎 Unique Value Proposition

“Professional SEO audits in 60 seconds. Your branding. No technical skills required.”

No need for expensive tools (SEMrush, Ahrefs)

No need for SEO expertise

Fully automated

White-label for agencies

PDF + online shareable report

Embeddable audit widget for lead-gen

📄 Total Pages
Public Pages (6)

Landing Page

Pricing Page

Free Audit Input Page

Blog

Login

Signup

User Dashboard (9)

Dashboard

New Audit Page

Audit History

Audit Details

White-Label Branding

Team Management

Client Portal Setup

Billing

Account Settings

Client Portal (3)

Client Login

Client Dashboard

Client Audit Viewer

Admin Internal Panel (6)

Admin Dashboard

User Management

Audit Usage Analytics

SEO Rule Engine Manager

Logs & Monitoring

Billing Oversight

Widget Pages (2)

Audit Widget

Widget Settings

▶️ User Flows
1. Audit Generation Flow
User enters URL → System crawls site → SEO engine evaluates → AI summarizes → 
Brand template applied → PDF generated → Email sent → Stored in history

2. White-Label Flow
Upload logo → Set brand colors → Custom header/footer → Custom domain → 
Export branded PDFs + client portals

3. Widget Flow
Agency customizes → Embeds JS snippet → Visitors enter URL → Audit generated →
Lead is captured → Agency notified → Visitor receives branded report

🏗️ System Architecture
Tech Stack
Backend

Node.js + NestJS/Express

Python microservice (crawling + SEO rule engine)

PostgreSQL (primary DB)

Redis (caching + queues)

BullMQ (task queues)

AWS S3 (PDF + assets storage)

OpenAI/GPT for AI recommendations

Stripe Billing

Frontend

Next.js 15

React + TypeScript

TailwindCSS + shadcn/ui

React Query

Charts.js for analytics

Services

Audit Crawler Service

SEO Rule Engine

AI Summary Generator

PDF Renderer

Billing Service

Widget Service

Email Notification Service

🗄️ Database Schema
users
Field	Type	Notes
id	UUID	PK
name	text	
email	text	unique
role	enum(admin,agency,user)	
plan	text	free,pro,agency,enterprise
branding_id	UUID	FK
created_at	timestamp	
audits
Field	Type	Notes
id	UUID	PK
user_id	UUID	FK
client_id	UUID	FK
url	text	
score	int	0–100
status	enum(pending,processing,complete,failed)	
pdf_url	text	
json_report	jsonb	raw audit data
created_at	timestamp	
branding
Field	Type
id	UUID
logo_url	text
primary_color	text
secondary_color	text
template_id	text
📄 PDF Generation Engine
Pipeline

HTML template via Handlebars

Inject branded colors, logos

Insert audit results

Generate charts (score, issues)

Puppeteer converts HTML → PDF

Upload to S3

Email + dashboard delivery

Pages

Cover

Executive Summary

Score Breakdown

Technical SEO

On-Page SEO

Performance (Lighthouse)

Mobile UX

Indexability

Schema

Fix Recommendations

Competitor Comparison

Final Checklist

🔍 SEO Audit Engine
Checks Performed
Technical SEO

Canonical tags

Robots.txt rules

Sitemap

HTTP status codes

HTTPS validity

Redirect chains

Image alt checks

On-Page SEO

Title tags

Meta descriptions

H1–H6 hierarchy

Keyword density

Thin content detection

Performance (PageSpeed API)

LCP, CLS, FID

Image compression

Lazy loading

JS bundle size

Mobile UX

Touch targets

Responsive layout

Viewport meta

Security

TLS

Mixed content

Security headers

AI Layer

“Top 10 fixes prioritized”

“3-month SEO plan”

Executive summary for clients

🔌 Embeddable Widget
Example embed:
<script 
  src="https://saasdomain.com/widget.js"
  data-agency="AGENCY_ID"
></script>

Widget Features

URL input

Email capture

Branding

Auto-send PDF

Lead forwarding to CRM (Zapier / webhook)

💰 Billing & Monetization
Subscription Plans
Plan	Price	Limits
Free	$0	1 audit
Pro	$79/mo	Unlimited audits
Agency	$149/mo	Team + white-label + widget
Enterprise	Custom	SSO, 10k audits, SLAs
Payment System

Stripe Billing

Webhook-driven cancellations

Usage-based limits

Failed payment dunning

Invoice export

🔐 Security

HTTPS everywhere

JWT authentication

Rate limiting per IP

Tenant isolation

Role-based access (RBAC)

GDPR compliance

Encrypted PDF storage

Audit logs

SSO (Google Workspace / Azure)

🏢 Enterprise Features

Multi-tenancy

Per-client dashboards

White-label custom domains

SSO (SAML/OAuth)

SLA uptime

Priority queue for enterprise audits

Admin rule-engine editor

Audit logging for all actions

🧩 API Endpoints
Audits
POST /api/audits
GET /api/audits
GET /api/audits/:id
DELETE /api/audits/:id

Branding
POST /api/branding
GET /api/branding
PUT /api/branding

Clients
POST /api/clients
GET /api/clients

Widget
POST /api/widget/audit

🛣️ Roadmap
Phase 1 — MVP

URL input → PDF generator

Dashboard

Audit history

Basic branding

Stripe billing

Phase 2 — Agency Features

Client portal

Team management

Advanced rules

Host widget

Phase 3 — Enterprise

SSO

Multi-tenant isolation

Rule engine editor

SLA monitoring