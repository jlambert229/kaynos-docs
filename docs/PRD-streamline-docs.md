# PRD: Streamline Kaynos Docs Site

**Author:** jlambert229
**Date:** 2026-04-10
**Status:** Draft

---

## Problem

The help center has grown to 40 pages across 9 sections. Content overlaps, navigation is cluttered, and the site doesn't reflect how the three core personas actually use it. A casual student (David) sees the same sprawling menu as an academy owner (Marco). The result: users can't find what they need quickly, and maintenance burden scales with every page added to a single 4,600-line HTML file.

## Goal

Reduce the docs site to the essential pages each persona needs, consolidate redundant content, and organize navigation around user workflows rather than feature categories.

---

## Personas

### Core app personas (from kaynos/docs/personas.md)

### Professor Marco — Academy Owner (Admin)
- 42, BJJ black belt, runs Safety Harbor Jiu-Jitsu (130 members, 3 coaches)
- Needs: quick uploads, timestamped notes, student watch tracking, member management
- Tech comfort: moderate (iPhone, wants 2-tap max)
- **Docs goal:** Set up the academy, invite coaches, understand admin tools

### Sofia — Dedicated Student (Student)
- 31, purple belt, trains 5-6x/week, competes
- Needs: mobile-first review, timestamp navigation, technique search, progress tracking
- Tech comfort: high
- **Docs goal:** Watch sessions, reply to notes, find techniques — fast

### David — Casual Practitioner (Student)
- 37, white belt (10 months), 2-3x/week, no competition
- Needs: simplicity (open app, watch, done), short clips, visible progress, no jargon
- Tech comfort: high but low patience — any friction = abandonment
- **Docs goal:** Figure out the basics, maybe troubleshoot once, never come back

### Developer (API integrator)
- Building on the Kaynos API
- **Docs goal:** Auth, endpoints, rate limits, schemas

### Docs-specific personas (non-app-users who visit the help center)

### Evaluating Prospect — Decision Maker
- Gym owner or program director comparing Kaynos to competitors before signing up
- Browses the help center to gauge feature depth, ease of use, and support quality
- Tech comfort: varies — judges the product by how professional the docs feel
- **Docs goal:** Understand what Kaynos does, how hard it is, what happens when things break. Looks at: getting started flow (is it simple?), feature pages (does it do what I need?), troubleshooting (is there real support?). A confusing help center signals a confusing product.
- **Key pages:** welcome, setup, uploading, creating-sessions, troubleshoot, faq, contact

### Parent/Guardian — Minor's Representative
- Parent of a student (likely minor) enrolled at an academy using Kaynos
- Concerned about what data is collected, how video of their child is stored, and what rights they have
- May land on the site via a link from the academy or a search for "Kaynos privacy"
- Tech comfort: moderate — not evaluating the product technically, looking for trust signals
- **Docs goal:** Find privacy policy, understand data handling, verify COPPA/FERPA compliance position. Needs clear, non-technical language.
- **Key pages:** privacy-on-this-site, faq (compliance section), storage (data residency)

### IT Admin / School Tech Coordinator
- Works at a school, athletic program, or multi-location gym that is evaluating or onboarding Kaynos
- Reviews the help center for integration capabilities, data residency, browser requirements, and security posture
- Different from Developer (less code, more policy and infrastructure)
- Tech comfort: high — reads CSP headers, checks SECURITY.md, wants to know about SSO and data export
- **Docs goal:** Assess whether Kaynos meets organizational security and compliance requirements. Looks for: supported browsers, data storage locations, API auth model, export capabilities, vulnerability disclosure policy.
- **Key pages:** developer-api, storage, faq, privacy-on-this-site, SECURITY.md (on GitHub)

### Security Researcher
- Lands on the GitHub repo or docs site looking for vulnerability disclosure info
- May be doing authorized testing, bug bounty, or general reconnaissance
- **Docs goal:** Find SECURITY.md, understand reporting channel, check scope and safe harbor terms
- **Key pages:** SECURITY.md (docs/SECURITY.md on GitHub), developer-api (to understand API surface)

---

## Current State (40 pages)

| Section | Pages | Issues |
|---------|-------|--------|
| Root | welcome, whats-new, release-notes, feature-requests | `whats-new` and `release-notes` overlap; `feature-requests` is local-only poll |
| Getting Started (7) | setup, inviting-members, first-upload, roles, glossary, quick-tips, onboarding-timeline | `quick-tips` and `onboarding-timeline` are low-traffic filler |
| Video (7) | uploading, playback, player-shortcuts, formats, upload-checklist, speed-calculator, storage | `upload-checklist` and `speed-calculator` are niche tools |
| Sessions & Classes (6) | session-vs-class, creating-sessions, creating-classes, notes, tags, progress | `session-vs-class` should be folded into creating-sessions |
| Account Mgmt (3) | managing-members, profile, notifications | Fine |
| Developers (1) | developer-api | Fine |
| Troubleshooting (9) | troubleshoot, error-lookup, browser-check, upload-issues, playback-issues, login-issues, email-issues, performance, mobile | Heavy overlap: `uploading` + `upload-issues` cover similar ground |
| FAQ (2) | faq, contact | Fine |
| Legal (1) | privacy-on-this-site | Fine |

---

## Proposed Structure (25 pages)

Cut from 40 to 25 pages by consolidating redundant content and removing low-value pages.

### Navigation

```
Home
Getting Started
  Account setup
  Inviting members
  Your first upload
  Roles & permissions
  Glossary
Video
  Uploading & troubleshooting    (merge: uploading + upload-issues + upload-checklist)
  Playback & troubleshooting     (merge: playback + playback-issues + player-shortcuts)
  Supported formats              (merge: formats + speed-calculator)
  Storage & limits
Sessions & Classes
  Sessions                       (merge: session-vs-class + creating-sessions)
  Classes                        (creating-classes)
  Notes & tags                   (merge: notes + tags)
  Progress tracking
Account
  Member management
  Profile & notifications        (merge: profile + notifications)
Troubleshooting
  Troubleshooting wizard         (keep wizard, remove standalone error-lookup + browser-check)
  Login issues
  Email & notification issues
  Performance & mobile           (merge: performance + mobile)
Developer API
FAQ & Contact
Release Notes                    (merge: whats-new + release-notes; remove feature-requests)
Legal
  Privacy on this site
```

### What's removed (15 pages)

| Removed | Disposition |
|---------|-------------|
| `whats-new` | Merged into `release-notes` |
| `feature-requests` | Removed — local-only poll with no backend. Link to email instead |
| `quick-tips` | Content folded into relevant Getting Started pages |
| `onboarding-timeline` | Content folded into `setup` |
| `upload-checklist` | Folded into `uploading` as a collapsible section |
| `speed-calculator` | Folded into `formats` as an inline tool |
| `player-shortcuts` | Folded into `playback` as a collapsible section |
| `session-vs-class` | Opening paragraph of `sessions` page |
| `tags` | Merged into `notes` |
| `notifications` | Merged into `profile` |
| `upload-issues` | Merged into `uploading` (troubleshooting tab/section) |
| `playback-issues` | Merged into `playback` (troubleshooting tab/section) |
| `error-lookup` | Wizard handles this; remove standalone page |
| `browser-check` | Embed in troubleshooting wizard |
| `mobile` | Merged into `performance` |

### What's added (0 new pages)

No new pages. Consolidation only.

---

## Per-Persona Impact

### Marco (Admin)
**Before:** 7 Getting Started pages + 3 Account pages = 10 pages to wade through
**After:** 5 Getting Started pages + 1 Account page = 6 pages. `inviting-members` and `roles` are immediately visible. Admin-specific content (member management) is one click away.

**Updated checklist:**
1. Log in to the app → `setup`
2. Set a new password → `profile`
3. Invite your coaches → `inviting-members`
4. Upload your first video → `first-upload`
5. Understand user roles → `roles`

No changes needed — his checklist already points to surviving pages.

### Sofia (Student — power user)
**Before:** Must navigate Video (7 pages) + Sessions (6 pages) to find notes/playback info
**After:** Video (4 pages) + Sessions (4 pages). `playback` now includes shortcuts and troubleshooting inline — one page covers her entire video workflow. `notes` includes tags.

**Updated checklist:**
1. Log in → `setup`
2. Set password → `profile`
3. Watch a session → `playback`
4. Leave a note → `notes`
5. Try mobile → `performance` (now includes mobile tips)

### David (Student — casual)
**Before:** Lands on welcome page with 9-section sidebar. Overwhelmed.
**After:** 7 sections, fewer items each. The pages he'd actually visit (`setup`, `playback`, `troubleshoot`) are all still present. The pages he'd never visit (`speed-calculator`, `player-shortcuts`, `onboarding-timeline`) are gone or folded in.

**Updated checklist:** Same as Sofia but he'll realistically only complete steps 1-3.

### Developer
**Before/After:** No change. Single `developer-api` page stays. API content was already redacted for security (KAY-176).

---

## Implementation Approach

### Phase 1: Content consolidation (no structural changes)
- Merge content from removed pages into their target pages within the PAGES object
- Update NAV array to reflect new structure
- Update sitemap.xml
- Update internal cross-links
- Preserve URL fragments: add redirects so old `#upload-issues` auto-navigates to `#uploading`

### Phase 2: Checklist & wizard updates
- Update CHECKLIST_ITEMS to point to renamed/merged pages
- Update WIZARD result nodes to point to consolidated pages
- Remove dead page entries

### Phase 3: Cleanup
- Remove orphaned CSS (e.g., feedback widget styles already dead from KAY-198)
- Remove ES_TRANSLATIONS entries for removed pages (only `welcome` and `roles` had them — both survive)
- Update feed.xml if any referenced pages were removed
- Run Playwright tests against consolidated structure

### Phase 4: Redirect map
Add a JS redirect map so bookmarks and shared links to removed pages still work:

```javascript
const REDIRECTS = {
  'whats-new': 'release-notes',
  'feature-requests': 'release-notes',
  'quick-tips': 'setup',
  'onboarding-timeline': 'setup',
  'upload-checklist': 'uploading',
  'speed-calculator': 'formats',
  'player-shortcuts': 'playback',
  'session-vs-class': 'creating-sessions',
  'tags': 'notes',
  'notifications': 'profile',
  'upload-issues': 'uploading',
  'playback-issues': 'playback',
  'error-lookup': 'troubleshoot',
  'browser-check': 'troubleshoot',
  'mobile': 'performance',
};
```

---

## Success Metrics

| Metric | Before | Target |
|--------|--------|--------|
| Total pages | 40 | 25 |
| Nav sections | 9 | 7 |
| Avg clicks to find answer (new user) | 3-4 | 1-2 |
| Pages per persona workflow | 5-10 | 3-5 |
| Maintenance surface (PAGES entries) | 40 | 25 |

---

## Risks & Mitigations

| Risk | Mitigation |
|------|-----------|
| Broken bookmarks/shared links | Phase 4 redirect map |
| Merged pages become too long | Use collapsible sections (`<details>`) for secondary content |
| Developer API content lost | No change to developer-api page |
| SEO impact from removed URLs | Redirects preserve link equity; sitemap updated |
| Wizard references broken pages | Phase 2 explicitly updates all wizard nodes |

---

## Out of Scope

- Splitting `index.html` into multiple files (tracked in ADR-001)
- Full Spanish translation (tracked in KAY-123)
- Adding new content or features
- Backend integration for feedback/polls (removed, not replaced)

---

## Dependencies

- None. All changes are within the static `index.html` file.
- Playwright tests will need updates for removed page assertions.
