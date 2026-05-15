# Production Hardening Plan — Oneasy Agents

> Status: NOT STARTED — Awaiting user approval + prerequisites
> Estimated total: ~8 hours
> Reference: `vibecodechecklist.md` (50-point audit, scored ~15/50)

---

## Prerequisites (Need from User)

| # | Item | Status |
|---|------|--------|
| 1 | Company/entity name (for legal pages footer, terms) | Pending |
| 2 | Contact email and/or phone (for legal pages, privacy policy) | Pending |
| 3 | Refund policy stance (no refunds / 7-day / 24-hour / conditional) | Pending |
| 4 | OG image 1200x630 (or permission to auto-generate one) | Pending |
| 5 | Sentry account + DSN key (or skip Phase 8 monitoring) | Pending |

---

## Phase 1: Legal Pages (1.5 hrs)

### Why
Zero legal pages exist. Required for any payment-accepting app (RBI/PCI compliance for Razorpay, app store policies, user trust).

### Tasks

#### 1.1 Create Privacy Policy page
- **File**: `src/app/privacy/page.tsx`
- **Content covers**:
  - What data we collect (phone number, financial data for networth, partnership details, salary info)
  - How we use it (document generation only, no selling)
  - Third-party services (Supabase for storage, Razorpay for payments, MSG91 for OTP, Google Gemini AI for document generation)
  - Data retention policy (how long we keep documents)
  - User rights (delete account = delete all data)
  - Cookie usage (Supabase auth cookies only, no tracking cookies)
  - Contact information for data requests
- **Style**: Match landing page aesthetic (DM Serif Display headings, Inter body)
- **Route**: `/privacy`

#### 1.2 Create Terms of Service page
- **File**: `src/app/terms/page.tsx`
- **Content covers**:
  - Service description (AI-powered legal/financial document generation)
  - Disclaimer: Documents are AI-generated, NOT legal advice. Users must verify with professionals.
  - Payment terms (₹199 per document, non-refundable unless stated in refund policy)
  - User responsibilities (accurate data input, legal use only)
  - Intellectual property (generated documents belong to user, platform IP belongs to company)
  - Account termination rights
  - Limitation of liability
  - Governing law (India)
- **Route**: `/terms`

#### 1.3 Create Refund Policy page
- **File**: `src/app/refund/page.tsx`
- **Content covers**:
  - Refund eligibility criteria
  - Process for requesting refunds (email contact)
  - Timeline for refund processing
  - Non-refundable scenarios
  - Razorpay-specific refund flow
- **Route**: `/refund`

#### 1.4 Update footer links
- **File**: `src/app/page.tsx` (landing page footer)
- **Change**: Replace `href="#"` placeholders with `/privacy`, `/terms`, `/refund`
- **Also add**: Footer links to dashboard layout if not present

#### 1.5 Create shared legal page layout (optional)
- **File**: `src/app/(legal)/layout.tsx`
- Shared layout with back-to-home nav, consistent styling, last-updated date

---

## Phase 2: SEO & Metadata (1 hr)

### Why
Currently only has basic `title` and `description` in root layout. No OG tags, no sitemap, no robots.txt, no structured data. Zero social sharing presence.

### Tasks

#### 2.1 Root metadata enhancement
- **File**: `src/app/layout.tsx`
- **Add**:
  ```ts
  export const metadata: Metadata = {
    metadataBase: new URL('https://www.getnetworthcertificate.com'),
    title: {
      default: 'Oneasy Agents — AI Document Generation',
      template: '%s | Oneasy Agents',
    },
    description: 'Generate net worth certificates, partnership deeds, LLP agreements, and offer letters instantly with AI.',
    openGraph: {
      type: 'website',
      locale: 'en_IN',
      url: 'https://www.getnetworthcertificate.com',
      siteName: 'Oneasy Agents',
      title: 'Oneasy Agents — AI Document Generation',
      description: 'Generate net worth certificates, partnership deeds, LLP agreements, and offer letters instantly with AI.',
      images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'Oneasy Agents' }],
    },
    twitter: {
      card: 'summary_large_image',
      title: 'Oneasy Agents — AI Document Generation',
      description: 'Generate net worth certificates, partnership deeds, LLP agreements, and offer letters instantly with AI.',
      images: ['/og-image.png'],
    },
    robots: {
      index: true,
      follow: true,
    },
  }
  ```

#### 2.2 Per-agent page metadata
- Add `metadata` exports to each agent's page:
  - `src/app/networth/page.tsx` — "Net Worth Certificate Generator"
  - `src/app/partnership/page.tsx` — "Partnership Deed Generator"
  - `src/app/llp/page.tsx` — "LLP Agreement Generator"
  - `src/app/offer-letter/page.tsx` — "Offer Letter Generator"

#### 2.3 Sitemap
- **File**: `src/app/sitemap.ts`
- **URLs**: `/`, `/login`, `/privacy`, `/terms`, `/refund`, `/networth`, `/partnership`, `/llp`, `/offer-letter`
- Dynamic `lastModified` from build time

#### 2.4 Robots.txt
- **File**: `src/app/robots.ts`
- Allow all public pages, disallow `/dashboard`, `/api/*`, `/networth/history`, etc.

#### 2.5 Favicon
- Verify favicon exists in `public/` or `src/app/`
- Add `manifest.json` / `site.webmanifest` if missing
- Add Apple touch icon

#### 2.6 JSON-LD Structured Data
- **File**: `src/app/page.tsx` (landing page)
- Add `Organization` + `WebApplication` schema
- Embed as `<script type="application/ld+json">`

#### 2.7 OG Image
- Place `og-image.png` (1200x630) in `public/`
- If user doesn't provide one, generate a simple branded image using canvas or a design tool

---

## Phase 3: Security Hardening (1 hr)

### Why
Auth cookies lack proper flags, no CORS headers, APP_URL still points to localhost in .env.local, potential XSS vectors in HTML rendering.

### Tasks

#### 3.1 Fix APP_URL
- **File**: `.env.local` (local) + Vercel env vars
- **Change**: `APP_URL=http://localhost:3010` → `APP_URL=https://www.getnetworthcertificate.com`
- This affects Razorpay callback URLs and any absolute URL generation

#### 3.2 Security headers via next.config.ts
- **File**: `next.config.ts`
- **Add `headers()` config**:
  ```ts
  async headers() {
    return [{
      source: '/(.*)',
      headers: [
        { key: 'X-Frame-Options', value: 'DENY' },
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        { key: 'X-XSS-Protection', value: '1; mode=block' },
        { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
      ],
    }]
  }
  ```

#### 3.3 Content Security Policy (CSP)
- Add CSP header allowing:
  - `script-src 'self' https://checkout.razorpay.com` (for Razorpay)
  - `connect-src 'self' https://*.supabase.co https://api.razorpay.com`
  - `frame-src https://api.razorpay.com` (Razorpay checkout iframe)
  - `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com`
  - `font-src https://fonts.gstatic.com`
  - `img-src 'self' data: blob:`

#### 3.4 CORS on API routes
- **File**: Create `src/lib/cors.ts` helper
- Apply to all `/api/*` routes
- Allow only `https://www.getnetworthcertificate.com` and `https://oneasy-agents.vercel.app`
- Dev mode: also allow `http://localhost:3010`

#### 3.5 XSS audit
- **Already done**: DOMPurify added to `Step3Review.tsx` and `print/page.tsx`
- **Verify**: Grep for any remaining `dangerouslySetInnerHTML` without sanitization
- **Check**: All user inputs that flow into Gemini prompts (prompt injection risk)

#### 3.6 Rate limiting audit
- **Verify**: Rate limiter is active on payment endpoints
- **Add**: Rate limit to OTP send endpoint (prevent SMS bombing)
- **Add**: Rate limit to AI generation endpoints (prevent cost abuse)

---

## Phase 4: Database Hardening (1.5 hrs)

### Why
No soft deletes (data loss risk), missing indexes on frequently queried columns, no database backup strategy.

### Tasks

#### 4.1 Soft deletes migration
- **File**: `supabase/migrations/008_soft_deletes.sql`
- **Add `deleted_at TIMESTAMPTZ DEFAULT NULL`** to:
  - `networth_certificates`
  - `partnership_deeds`
  - `llp_agreements`
  - `offerletter_letters`
  - `salary_employees` / `salary_payslips`
- **Add index** on `deleted_at` for each table
- **Update RLS policies**: Add `WHERE deleted_at IS NULL` to all SELECT policies

#### 4.2 Missing indexes migration
- **File**: `supabase/migrations/009_indexes.sql`
- **Add indexes**:
  ```sql
  -- Payments lookups
  CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
  CREATE INDEX IF NOT EXISTS idx_payments_document_id ON payments(document_id);
  CREATE INDEX IF NOT EXISTS idx_payments_agent_document ON payments(agent, document_id);
  CREATE INDEX IF NOT EXISTS idx_payments_razorpay_order ON payments(razorpay_order_id);

  -- Networth
  CREATE INDEX IF NOT EXISTS idx_networth_user_id ON networth_certificates(user_id);
  CREATE INDEX IF NOT EXISTS idx_networth_created ON networth_certificates(created_at DESC);

  -- Partnership
  CREATE INDEX IF NOT EXISTS idx_partnership_user_id ON partnership_deeds(user_id);

  -- LLP
  CREATE INDEX IF NOT EXISTS idx_llp_user_id ON llp_agreements(user_id);

  -- Offer Letter
  CREATE INDEX IF NOT EXISTS idx_offerletter_user_id ON offerletter_letters(user_id);

  -- Salary
  CREATE INDEX IF NOT EXISTS idx_salary_employees_user ON salary_employees(user_id);
  CREATE INDEX IF NOT EXISTS idx_salary_payslips_employee ON salary_payslips(employee_id);
  ```

#### 4.3 Update application delete code
- **Files**: All delete handlers across agents
- **Change**: `DELETE FROM` → `UPDATE ... SET deleted_at = NOW()`
- **Change**: All SELECT queries → add `AND deleted_at IS NULL`
- Use a shared helper: `softDelete(table, id, userId)`

#### 4.4 Database backup strategy
- Document manual backup via Supabase dashboard (Settings > Database > Backups)
- For Pro plan: automated daily backups are included
- Add note in README about backup procedures

---

## Phase 5: Cost Controls (30 min)

### Why
Gemini API calls with no token limits = unbounded cost. No per-user daily limits = single user can rack up massive bills.

### Tasks

#### 5.1 Add max_tokens to all Gemini calls
- **Files**:
  - `src/app/api/llp/chat/route.ts`
  - `src/app/api/networth/generate/route.ts` (or equivalent)
  - `src/app/api/partnership/generate/route.ts`
  - `src/app/api/offer-letter/generate/route.ts`
- **Add**: `maxOutputTokens: 8192` (or appropriate per-agent limit)
- LLP chat responses: `maxOutputTokens: 4096` (conversational, shorter)
- Document generation: `maxOutputTokens: 8192` (full documents)

#### 5.2 Daily AI usage limits per user
- **File**: `src/lib/ai-usage-limiter.ts`
- **Logic**:
  - Track AI calls per user per day in Redis (Upstash)
  - Key pattern: `ai_usage:{userId}:{YYYY-MM-DD}`
  - TTL: 86400 seconds (auto-expire)
  - Default limit: 20 generations per user per day
  - Return 429 with friendly message when exceeded
- **Apply to**: All AI generation endpoints

#### 5.3 Gemini error handling
- Ensure all Gemini calls have try/catch
- Return user-friendly error messages (not raw API errors)
- Log errors server-side for debugging

---

## Phase 6: Account Management (1.5 hrs)

### Why
No way for users to delete their account. Required by data protection laws and good UX.

### Tasks

#### 6.1 Delete Account API
- **File**: `src/app/api/account/delete/route.ts`
- **Logic**:
  1. `requireAuth()` to get user ID
  2. Soft-delete all user's documents across all agent tables
  3. Delete all files from storage buckets for this user
  4. Delete payment records (or anonymize)
  5. Delete Supabase auth user via admin API
  6. Return success
- **Safety**: Require confirmation (e.g., user must type "DELETE" or re-enter phone)

#### 6.2 Account Settings page
- **File**: `src/app/dashboard/settings/page.tsx`
- **UI**:
  - Phone number (read-only, masked: `****5266`)
  - Account created date
  - Usage stats (documents generated per agent)
  - Danger zone: Delete Account button
  - Delete confirmation modal with warning text

#### 6.3 Add Settings link to Dashboard
- **File**: `src/app/dashboard/DashboardClient.tsx`
- Add gear icon / "Settings" link in dashboard header or sidebar

---

## Phase 7: Maintenance Mode (30 min)

### Why
Need ability to show "under maintenance" page without redeploying. Critical for database migrations or emergency fixes.

### Tasks

#### 7.1 Maintenance page
- **File**: `src/app/maintenance/page.tsx`
- Static page with:
  - Company logo
  - "We're performing scheduled maintenance"
  - "We'll be back shortly"
  - Estimated return time (optional)
  - Contact email

#### 7.2 Middleware check
- **File**: `src/middleware.ts`
- **Add at top**:
  ```ts
  if (process.env.MAINTENANCE_MODE === 'true') {
    if (!request.nextUrl.pathname.startsWith('/maintenance')) {
      return NextResponse.rewrite(new URL('/maintenance', request.url))
    }
  }
  ```
- **Env var**: `MAINTENANCE_MODE=false` (default)
- To enable: Set `MAINTENANCE_MODE=true` in Vercel env vars → instant activation on next request

#### 7.3 Exclude from maintenance
- API health check endpoint (for uptime monitoring)
- The maintenance page itself

---

## Phase 8: Monitoring & Analytics (30 min)

### Why
Zero visibility into errors, performance, or usage in production. Flying blind.

### Tasks

#### 8.1 Sentry setup (if DSN provided)
- `npm install @sentry/nextjs`
- **Files**:
  - `sentry.client.config.ts`
  - `sentry.server.config.ts`
  - `sentry.edge.config.ts`
  - `next.config.ts` — wrap with `withSentryConfig()`
- Configure: environment, traces sample rate (0.1 for prod), replays sample rate
- Add `SENTRY_DSN` to env vars

#### 8.2 Sentry skip (if no DSN)
- Add `src/lib/error-reporting.ts` with a no-op wrapper
- Can be swapped for Sentry later
- At minimum, ensure all API routes have try/catch with `console.error`

#### 8.3 Vercel Analytics
- `npm install @vercel/analytics`
- **File**: `src/app/layout.tsx`
- **Add**: `<Analytics />` component
- Free tier: 2,500 events/month

#### 8.4 Vercel Speed Insights
- `npm install @vercel/speed-insights`
- **File**: `src/app/layout.tsx`
- **Add**: `<SpeedInsights />` component

#### 8.5 UptimeRobot (external)
- Set up free monitor at uptimerobot.com
- Monitor: `https://www.getnetworthcertificate.com`
- Check interval: 5 minutes
- Alert via email

#### 8.6 Health check endpoint
- **File**: `src/app/api/health/route.ts`
- Returns `{ status: 'ok', timestamp, version }` — 200 OK
- Checks Supabase connectivity
- Used by UptimeRobot and maintenance mode exclusion

---

## Implementation Order (Recommended)

| Priority | Phase | Effort | Dependency |
|----------|-------|--------|------------|
| 1 | Phase 3: Security | 1 hr | None |
| 2 | Phase 1: Legal Pages | 1.5 hrs | Need company name, contact, refund policy |
| 3 | Phase 2: SEO | 1 hr | Need OG image |
| 4 | Phase 5: Cost Controls | 30 min | None |
| 5 | Phase 4: Database | 1.5 hrs | None |
| 6 | Phase 7: Maintenance Mode | 30 min | None |
| 7 | Phase 6: Account Mgmt | 1.5 hrs | Phase 4 (soft deletes) |
| 8 | Phase 8: Monitoring | 30 min | Sentry DSN (optional) |

**Phase 3 (Security) can start immediately** — no prerequisites needed.
**Phase 5 (Cost Controls) can also start immediately.**

---

## Post-Hardening Checklist

After all phases complete, re-run the 50-point audit from `vibecodechecklist.md`:
- [ ] Target score: 40+/50 (up from ~15/50)
- [ ] All Razorpay test keys replaced with production keys
- [ ] APP_URL updated in Vercel env vars
- [ ] Domain SSL verified
- [ ] Smoke test all 4 payment flows
- [ ] Smoke test OTP login
- [ ] Verify all legal page links work
- [ ] Check OG tags with https://www.opengraph.xyz/
- [ ] Submit sitemap to Google Search Console
- [ ] Verify robots.txt at /robots.txt
