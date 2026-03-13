# Stone Bridge Buyers

A full-stack real estate web platform featuring a public-facing marketing site and a private admin dashboard for managing leads, SMS automation campaigns, and site analytics.

---

## Live Sites

| Site | URL |
|------|-----|
| Marketing Site | [stonebridgebuyers.com](https://stonebridgebuyers.com) |
| Admin Dashboard | [pro.stonebridgebuyers.com](https://pro.stonebridgebuyers.com) |

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 19, Vite 7, React Router 7 |
| Styling | Styled Components 6, Bootstrap 5, Framer Motion |
| Backend | Supabase (PostgreSQL, Auth, Realtime, Edge Functions) |
| Edge Runtime | Deno 2 |
| SMS | Twilio |
| Analytics | Umami Analytics, Vercel Speed Insights |
| Icons | Lucide React |

---

## Features

### Marketing Site
- Animated landing page with offer form lead capture
- Location-based service pages (filterable by state)
- Trust signals, process breakdown, and comparison sections
- Help Corner chat widget for visitor inquiries
- Contact / quote submission form
- Auto-generated sitemap + robots.txt

### Admin Dashboard
Secured behind Supabase Auth — requires login.

- **Leads Management** — View, create, edit, and filter leads by status (`New`, `Contacted`, `Engaged`, `Interested`, `Do Not Contact`). Full activity history per lead.
- **DealMachine Import** — Bulk-import leads directly from DealMachine exports.
- **SMS Automation** — Visual flow builder for multi-step SMS campaigns with merge field personalization, enrollment management, and STOP/HELP compliance footers.
- **Manual SMS** — Send one-off messages to any lead from the dashboard.
- **Forms** — View all quote form and help widget submissions.
- **Analytics** — Umami-powered traffic dashboard with 7d / 30d / 90d presets and timezone selection.
- **Real-time KPI Cards** — Live stats for leads, inbound messages, and SMS subscriptions.

---

## Project Structure

```
stone-bridge-buyers-web/
├── src/
│   ├── auth/              # Supabase auth context, hooks, protected route wrapper
│   ├── components/        # Shared UI components (Header, Footer, Banner, etc.)
│   ├── pages/
│   │   ├── Admin/         # Dashboard, Leads, SMS flows, Analytics, Forms
│   │   ├── Home.jsx
│   │   ├── About.jsx
│   │   ├── Contact.jsx
│   │   ├── Location.jsx
│   │   └── Legal.jsx
│   ├── hooks/             # usePageMeta
│   ├── lib/               # Supabase client, DealMachine import logic
│   └── styles/            # Global styles
├── supabase/
│   └── functions/         # Deno edge functions
│       ├── twilio-inbound/     # Inbound SMS webhook
│       ├── sms-worker/         # Cron job — processes outbox queue
│       ├── send-sms/           # Send a single SMS
│       ├── send-manual-sms/    # Admin-triggered SMS
│       ├── site-analytics/     # Fetch Umami metrics
│       ├── upsert-leads/       # Create or update leads
│       └── parse-address/      # Address parsing utility
└── public/
    ├── images/
    ├── robots.txt
    └── sitemap.xml
```

---

## Getting Started

### Prerequisites

- Node.js ≥ 18
- [Supabase CLI](https://supabase.com/docs/guides/cli)

### Install

```bash
npm install
```

### Environment Variables

Create a `.env` file in the project root:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_CRON_SECRET=your_cron_secret
VITE_UMAMI_WEBSITE_ID=your_umami_website_id
```

### Development

```bash
# Start the Vite dev server
npm run dev

# Start Supabase local stack (DB + Edge Functions)
supabase start
```

The app runs at `http://localhost:5173` by default. Edge Functions are available at `http://localhost:54321/functions`.

### Production Build

```bash
npm run build
```

Outputs to `dist/`. The build automatically generates an updated `sitemap.xml` via `scripts/generate-sitemap.mjs`.

### Other Scripts

```bash
npm run preview   # Preview the production build locally
npm run lint      # Run ESLint
```

---

## SMS Automation

SMS flows are database-driven and powered by Twilio + Supabase Edge Functions.

- **Flows** are defined in `sms_flows` with individual steps in `sms_flow_steps`
- **Enrollments** tracked per lead in `lead_flow_enrollments`
- **Outbox** — the `sms_outbox` table queues messages; `sms-worker` is a cron job that processes and sends them
- **Personalization** — merge fields: `{first_name}`, `{last_name}`, `{address}`, `{city}`, `{state}`
- **Compliance** — every message includes a STOP/HELP footer; consent status tracked per lead

---

## Database Schema (Overview)

| Table | Purpose |
|-------|---------|
| `leads` | Core lead records — contact info, status, consent flags |
| `lead_notes` | Activity log entries per lead |
| `lead_flow_enrollments` | SMS flow membership per lead |
| `sms_flows` | SMS campaign definitions |
| `sms_flow_steps` | Individual messages within a flow |
| `sms_outbox` | Queued outbound messages |
| `quote_form_submissions` | Public offer form submissions |
| `help_agent_submissions` | Help widget chat submissions |

---

## Deployment

- **Frontend** — Deploy `dist/` to any static host (Vercel recommended for Speed Insights integration)
- **Edge Functions** — Deploy via `supabase functions deploy`
- **SMS Cron** — Configure `sms-worker` as a Supabase cron job or external scheduler

---

## License

Private — all rights reserved.
