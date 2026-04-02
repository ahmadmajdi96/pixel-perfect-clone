

## Quality Management System (QMS) — Phase 1 Build Plan

### Overview
Build the foundational QMS platform with 4 core modules: Quality Dashboard, CAPA Management, Supplier Quality, and Customer Complaints. Full backend with Supabase (Lovable Cloud) for auth, database, and RLS.

---

### 1. Foundation & Auth Setup
- **Lovable Cloud backend** with Supabase database, auth, and RLS
- **User roles system** — `user_roles` table with enum roles: `qa_manager`, `food_safety_manager`, `quality_technician`, `food_technologist`, `supplier_quality_manager`, `plant_manager`, `system_admin`
- **Login page** with email/password auth
- **Profile creation** on signup with role assignment
- **App shell** — sidebar navigation with role-based menu visibility, top bar with user info and notifications badge

---

### 2. Database Schema (Core Tables)
- `profiles` — user profiles with name, department
- `user_roles` — role assignments per user
- `capas` — CAPA records with 7-stage status, severity, source type, owner, SLA deadline
- `capa_actions` — corrective/preventive action tasks linked to CAPAs
- `capa_timeline` — audit trail entries per CAPA
- `suppliers` — supplier directory with approval status, categories, contact info
- `supplier_scorecards` — periodic performance scores per supplier
- `supplier_coas` — certificates of analysis per supplier/ingredient
- `complaints` — customer complaints with severity, type, batch, CAPA link
- `complaint_investigations` — investigation records per complaint
- RLS policies on all tables scoped by user role

---

### 3. Quality Dashboard (`/dashboard`)
- **Role-adaptive layout** — widgets shown/hidden based on user role
- **Open CAPA summary widget** — count by severity (Critical/High/Medium/Low) with oldest-open age
- **Active quality holds strip** — lots currently on hold with reason and age
- **Complaint rate trend chart** — 30-day rolling CPMU trend with target line (using Recharts)
- **Audit countdown strip** — next 3 scheduled audits with days remaining
- **Calibration due alerts** — instruments due within 7 days
- **Quick action buttons** — Log Complaint, Create CAPA, Start Inspection

---

### 4. CAPA Management (`/capa`)
- **CAPA list table** — sortable/filterable with ID, source, severity badge, status, owner, SLA deadline, days open
- **Status pipeline view** — Kanban-style board showing CAPAs across 7 stages (Initiation → RCA → Action Assignment → Preventive → Verification → Effectiveness Check → Closure)
- **CAPA trend chart** — monthly open/close rate and average days-to-close
- **Create CAPA form** — with source type selector, severity, product/line, description
- **CAPA detail page** (`/capa/:id`):
  - Header with status badge, SLA countdown, owner
  - Source event context panel
  - RCA workspace with 5-Why template
  - Corrective action task list with assignment and completion tracking
  - Preventive action task list
  - Verification panel (QA Manager sign-off)
  - Effectiveness check panel (30/60/90-day)
  - Full timeline audit trail (append-only log)
  - Stage advancement buttons with validation gates

---

### 5. Supplier Quality Management (`/suppliers`)
- **Supplier directory table** — name, categories, approval status badge, scorecard rating, last audit date, next re-qualification due
- **Status filters** — Approved/Conditional/Suspended/Rejected
- **Supplier scorecard summary chart** — radar chart of aggregated performance
- **Add supplier form** — registration with qualification workflow trigger
- **Supplier detail page** (`/suppliers/:id`):
  - Header with approval status and key dates
  - Qualification checklist with evidence upload
  - Scorecard history table with trend indicators
  - COA/specification library (upload, version, filter by ingredient)
  - Linked nonconformances list
  - Approve/Suspend/Reject actions with reason and sign-off

---

### 6. Customer Complaints (`/complaints`)
- **Complaint list table** — ID, product, batch, date, type, severity badge, source, status, CAPA link
- **CPMU dashboard widget** — per-product rolling 30-day metric with threshold highlighting
- **Complaint type breakdown** — Pareto chart (foreign body, allergen, mislabeling, quality defect, etc.)
- **Log complaint form** — with auto-severity scoring based on type and product category
- **Complaint detail page** (`/complaints/:id`):
  - Header with severity badge, product, batch, source
  - Full complaint description with photo attachments
  - Investigation record form (probable cause, contributing factors, trend assessment)
  - Response to complainant panel with SLA tracking
  - CAPA link panel — auto-generated CAPA when CPMU threshold exceeded
  - Regulatory escalation flag for food safety risks

---

### 7. Design & UX
- **Dark professional theme** suited for industrial/manufacturing environments
- **Severity color coding** — Critical (red), High (orange), Medium (amber), Low (blue)
- **Status badges** throughout — consistent pill-style badges for all workflow states
- **Responsive layout** — desktop-first with sidebar, functional on tablet
- **Toast notifications** for actions (CAPA created, supplier status changed, etc.)

