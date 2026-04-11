# Kaynos Docs

Help center for [Kaynos](https://app.kaynos.net) — hosted at [docs.kaynos.net](https://docs.kaynos.net).

## What this is

Static documentation site for the Kaynos video coaching platform. Built as a single-page application with all content in `index.html`, deployed automatically to Netlify on merge to `main`.

## Local development

```bash
# Clone and serve locally
git clone https://github.com/jlambert229/kaynos-docs.git
cd kaynos-docs
npx http-server . -p 3000 -c-1
# Open http://localhost:3000
```

## Tests

Playwright end-to-end tests live in `tests/`.

```bash
npm install
npx playwright install --with-deps chromium
BASE_URL=http://localhost:3000 npx playwright test
```

## Deploy

Netlify auto-deploys from `main`. Every merge triggers a production build.

- **Publish directory:** `.` (repo root)
- **Headers & caching:** `netlify.toml`
- **Rollback:** Use the Netlify dashboard → Deploys → select a previous deploy → "Publish deploy"

See `docs/runbook.md` for incident response.

## Architecture

Currently a single `index.html` (~5200 lines) with inline CSS, JS, and all help content including a parent-guide page and a Netlify function for feature-request submissions. A planned split to a static site generator is tracked separately.

### Adding a help article

1. Add an entry to the `PAGES` object in `index.html`
2. Add the page key to the appropriate section in the `NAV` array
3. Add the URL to `sitemap.xml`
4. Update `feed.xml` if the article is newsworthy

## Reporting issues

- **Security vulnerabilities:** See [SECURITY.md](docs/SECURITY.md)
- **Bugs & improvements:** Open a GitHub Issue or Linear ticket in the KAY project

## License

See [LICENSE](LICENSE).
