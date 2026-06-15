# SEO Foundation Design

**Date:** 2026-06-15
**Status:** Approved
**Scope:** Static SEO tags, robots.txt, sitemap.xml, JSON-LD, favicon/icons

## Goal

Add search-engine-visible metadata to ToonSlice — a pure frontend SPA deployed on Vercel.
No backend, no SSR. All routes share unified social preview tags (not per-channel).

## What We're Adding

### 1. `index.html` — Static Meta Tags

Add before the `<script>` tag:

- `<title>` — updated from "ToonSlice" to descriptive title with keywords
- `<meta name="description">` — static fallback for crawlers that don't execute JS
- `<link rel="canonical">` — prevent duplicate content across route variations
- Open Graph: `og:title`, `og:description`, `og:url`, `og:type`, `og:site_name`, `og:image`, `og:image:width`, `og:image:height`
- Twitter Card: `twitter:card` (summary_large_image), `twitter:title`, `twitter:description`, `twitter:image`
- Favicon: `<link rel="icon">` pointing to `/export_r1_c1.ico`
- Apple touch icon: `<link rel="apple-touch-icon">` pointing to `/apple-touch-icon.png`
- JSON-LD `WebApplication` schema for rich results

### 2. `public/` Static Assets

Files already generated and placed:

| File | Dimensions | Purpose |
|---|---|---|
| `og-image.png` | 1200×634 | Social share preview image |
| `export_r1_c1.ico` | 32×33 | Browser favicon |
| `apple-touch-icon.png` | 180×188 | iOS home screen icon |
| `icon-192.png` | 192×198 | General app icon (PWA) |
| `robots.txt` | — | Crawler allow + sitemap pointer |
| `sitemap.xml` | — | URL enumeration for search engines |

### 3. `robots.txt`

```
User-agent: *
Allow: /
Sitemap: https://toonslice.com/sitemap.xml
```

### 4. `sitemap.xml`

Lists all 5 routes: `/`, `/webtoon`, `/tapas`, `/twitter`, `/instagram`.

No `<lastmod>` or `<changefreq>` — MVP simplicity.

## What We're NOT Changing

- `ChannelPage` dynamic `document.title` / `<meta name="description">` via `useEffect` — preserved. JS-capable crawlers (Googlebot) will see channel-specific titles; static tags are fallback for social crawlers.
- `seo.keyword` field in channel specs — still unused. Removing it is out of scope.
- No new npm dependencies.

## Edge Cases

- **Blank `/` route:** Currently shows "404 Not Found" (no landing page). Sitemap includes `/` regardless — fix landing page separately.
- **Image dimensions off by 1-8px:** No functional impact. All platforms tolerate minor aspect ratio differences.
- **`og:image` URL is absolute:** Hardcoded to `https://toonslice.com/og-image.png`. If domain changes, update this.

## Implementation Checklist

1. Edit `index.html` — add all meta tags, JSON-LD block, icon links
2. Create `public/robots.txt`
3. Create `public/sitemap.xml`
4. Verify images exist in `public/`
5. Build and inspect `dist/index.html` for correct tag output
6. Commit
