# OnEasy Agents

> AI-powered platform for instant Indian business document generation.

---

## What It Is

**OnEasy Agents** is a web app where business owners and professionals in India can generate official business documents in under 5 minutes — without hiring a chartered accountant or lawyer.

Users log in with their phone number, pick a document type, fill a guided form (with an AI assistant helping along the way), pay a small fee, and instantly download a ready-to-use PDF.

Think of it as a **"Canva for business paperwork"** — except instead of designing things, the AI drafts legally formatted documents for you.

---

## Who It's For

Small business owners, founders, partners, employers, and freelancers in India who need:

- A **net worth certificate** for a tender, visa, or loan application
- A **partnership deed** when starting a business with co-founders
- An **LLP agreement** when registering a Limited Liability Partnership
- An **offer letter** for new hires
- A **salary slip** with proper Indian tax calculations (HRA, PF, ESI, TDS)

These documents normally cost **2,000 to 10,000 rupees** from a CA and take **3 to 7 days**.
OnEasy delivers them in **5 minutes for a few hundred rupees**.

---

## The 5 Document Generators ("Agents")

| # | Agent | What It Does |
|---|-------|--------------|
| 1 | **Net Worth Certificate** | Calculates assets minus liabilities and generates a CA-style certificate |
| 2 | **Partnership Deed** | Drafts a full partnership agreement with all legal clauses |
| 3 | **LLP Agreement** | Generates an MCA-compliant Limited Liability Partnership agreement |
| 4 | **Offer Letter** | Creates professional employment offer letters for HR teams |
| 5 | **Salary Calculator** | Computes salary breakups and generates payslips |

Each agent has the same layout: an **AI chat assistant** on one side and a **form** on the other. The AI guides the user through unfamiliar fields, and on submit, the server generates a downloadable PDF.

---

## How a User Uses It

1. Lands on the marketing site
2. Logs in with phone number (OTP via SMS)
3. Picks an agent from the dashboard
4. Fills out the form (AI assistant helps when stuck)
5. Pays via UPI, card, or net banking
6. Downloads the generated PDF
7. Returns anytime to view document history

---

## Tech Stack

### Frontend

| Tool | Purpose |
|------|---------|
| **Next.js 15** | React framework powering pages and API routes |
| **TypeScript** | Type-safe JavaScript for fewer bugs |
| **Tailwind CSS** | Utility-first styling |
| **Lucide Icons** | Icon set used throughout the UI |

### Backend & Database

| Tool | Purpose |
|------|---------|
| **Supabase** | Authentication, Postgres database, and file storage in one |
| **PostgreSQL** | Underlying SQL database (managed by Supabase) |
| **Row-Level Security (RLS)** | Ensures each user can only access their own data |

### AI

| Tool | Purpose |
|------|---------|
| **Google Gemini** | Powers the chat assistants and AI-generated document content |

### Payments and Communication

| Tool | Purpose |
|------|---------|
| **Razorpay** | Payment gateway (UPI, cards, net banking) |
| **MSG91** | Sends OTP SMS for phone-based login |

### Infrastructure

| Tool | Purpose |
|------|---------|
| **Vercel** | Hosts the website with auto-deploys from GitHub |
| **GitHub** | Source code and version control |
| **Upstash Redis** | Rate limiting to prevent AI abuse and runaway costs |
| **Custom domain** | `getnetworthcertificate.com` |

### PDF Generation

Server-side PDF rendering with proper Indian formatting:
- Times New Roman for legal documents
- Calibri for offer letters
- A4 page size with regulated margins
- Custom signatures, stamps, and headers

---

## Project Architecture

It is a **monorepo** — one Next.js project containing all 5 agents under separate routes.

```
oneasy-agents/
├── /                  → Marketing landing page
├── /login             → Phone OTP login
├── /dashboard         → User's home after login
├── /networth          → Net worth certificate generator
├── /partnership       → Partnership deed generator
├── /llp               → LLP agreement generator
├── /offer-letter      → Offer letter generator
└── /salary            → Salary calculator
```

Each agent was originally built as a standalone project, then merged into this single app while keeping each agent's original UI intact.

---

## Why It Stands Out

| Traditional Way | OnEasy Way |
|-----------------|------------|
| 3 to 7 days turnaround | 5 minutes |
| 2,000 to 10,000 rupees | Couple of hundred rupees |
| Office hours only | 24/7 self-service |
| Confusing legal jargon | AI explains every field |
| Manual back-and-forth with a CA | Fully automated |

---

## Production Hardening

The app includes production-grade infrastructure:

- **Security:** Content Security Policy, security headers, CORS protection, OTP rate limiting
- **Cost control:** Daily AI usage caps per user (prevents runaway Gemini costs)
- **Database:** Soft deletes, indexes, audit logs
- **SEO:** Full metadata, sitemap, robots.txt, OpenGraph images, JSON-LD structured data
- **Compliance:** All documents follow MCA, Income Tax, and GST standards

---

## Summary

**OnEasy Agents** is a SaaS product for Indian business document generation, built on modern web technology (Next.js, Supabase, Gemini AI), hosted on Vercel, with payments through Razorpay. It replaces the slow, expensive process of hiring professionals with a 5-minute self-service flow that produces the same quality output.

**Live at:** [getnetworthcertificate.com](https://www.getnetworthcertificate.com)
