# Kaynos Docs — Operator Runbook

## Deploy path

1. PR merged to `main`
2. Netlify detects push, builds from repo root (publish dir: `.`)
3. Build completes in ~10s (static files, no build step)
4. Site live at docs.kaynos.net

## Rollback

1. Go to [Netlify dashboard](https://app.netlify.com) → select kaynos-docs site
2. Navigate to **Deploys**
3. Find the last known-good deploy
4. Click **Publish deploy**
5. Verify at https://docs.kaynos.net

## Cache behavior

| Path | Cache-Control | Notes |
|------|--------------|-------|
| `/*.html` | `public, max-age=0, must-revalidate` | Always fresh |
| `/fonts/*` | `public, max-age=31536000, immutable` | Versioned fonts |
| `/robots.txt` | `public, max-age=86400` | Daily refresh |
| `/sitemap.xml` | `public, max-age=86400` | Daily refresh |

See `netlify.toml` for full header configuration.

## Cache purge

Netlify automatically purges CDN cache on each deploy. For manual purge:
- Netlify dashboard → Site settings → Build & deploy → Post processing → Purge cache

## Header verification

```bash
curl -I https://docs.kaynos.net/ | grep -iE '(content-security|x-frame|strict-transport|cache-control)'
```

## DNS

Managed via Netlify DNS or your registrar. Verify:
```bash
dig docs.kaynos.net +short
```

## Incident template

1. Identify: what's broken (content, SSL, DNS, headers)
2. Triage: is rollback sufficient, or is a fix needed?
3. Act: rollback via Netlify dashboard if urgent
4. Verify: check site loads, headers correct, tests pass
5. Post-mortem: document what happened and update this runbook
