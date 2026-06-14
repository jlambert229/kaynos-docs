---
name: docs-publish-check
description: Validate Kaynos Docs publishing artifacts before merge — XML well-formedness of feed.xml/sitemap.xml, URL consistency with index.html, robots/sitemap agreement. Use after editing index.html, feed.xml, sitemap.xml, robots.txt, or sw.js.
disable-model-invocation: true
---

# docs-publish-check

The site ships raw (no build), so a malformed artifact reaches production. Run this checklist before merging artifact changes.

```
- [ ] XML well-formed:  xmllint --noout feed.xml sitemap.xml
- [ ] Every new/renamed doc page in index.html is in sitemap.xml
- [ ] Release-note additions in index.html are reflected in feed.xml
- [ ] robots.txt and sitemap.xml agree on what's crawlable
- [ ] If cached assets changed, the sw.js cache version was bumped
- [ ] No secrets / scratch files added to the published root
```

## Steps

1. **Well-formedness** — `xmllint --noout feed.xml sitemap.xml` (no output = valid). If `xmllint` is unavailable, parse with `node -e "new (require('xmldom').DOMParser)()..."` or any XML parser.
2. **URL diff** — list the canonical URLs in `sitemap.xml` and compare against the section anchors / page routes referenced in `index.html`. Flag any URL in one but not the other.
3. **Regression** — run the Playwright subset that covers the touched area: `npm test` (after `npm install`). Override `baseURL` for local/staging rather than asserting only against prod.
4. Report results as the checklist above with each item checked or flagged.
