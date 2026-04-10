# Docs Change Management Policy

## Source of truth

The `main` branch of `jlambert229/kaynos-docs` is the source of truth for all help center content. Merging to `main` deploys to production.

## Versioning

This site is not versioned — it always reflects the latest state. The "What's New" and "Release Notes" pages in the help center track user-facing changes to the Kaynos product (not to the docs themselves).

## Change process

1. **Content changes:** Open a PR against `main`. Describe what changed and why.
2. **Structural changes:** (new pages, navigation changes, CSS/JS) — require PR review.
3. **Emergency fixes:** May merge directly to `main` with post-merge review.

## Release notes

Product release notes are maintained in the `RELEASES` array in `index.html`. When adding a release:
1. Add a new entry to `RELEASES` with version, date, and categorized changes
2. Update `feed.xml` with the new release entry
3. The "What's New" page auto-renders from the latest release

## Ownership

The docs site is maintained by the Kaynos team. Content should stay aligned with the current state of the product — when the app changes, docs should be updated in the same sprint.
