# SEO Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add static SEO meta tags, JSON-LD structured data, favicon/icons, robots.txt, and sitemap.xml to ToonSlice's Vite-built SPA.

**Architecture:** All tags go into `index.html` — Vite copies this file as-is during build (no templating). Static files live in `public/` (Vite copies to `dist/` root). No new dependencies.

**Tech Stack:** Vite + React SPA. Domain: `https://toonslice.com`.

---

### Task 1: Add SEO meta tags and JSON-LD to index.html

**Files:**
- Modify: `index.html`

- [ ] **Step 1: Replace `<title>` and add all meta tags before `<script defer src="/_vercel/insights/script.js">`**

The current `<head>` is:

```html
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>ToonSlice</title>
    <script defer src="/_vercel/insights/script.js"></script>
  </head>
```

Replace with:

```html
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />

    <!-- Primary SEO -->
    <title>ToonSlice — Free Comic Slicer for Webtoon, Tapas &amp; More</title>
    <meta name="description" content="Format and slice your comic to platform-ready panels in your browser. No upload. 100% private.">
    <link rel="canonical" href="https://toonslice.com">

    <!-- Open Graph -->
    <meta property="og:title" content="ToonSlice — Free Comic Slicer for Webtoon, Tapas & More">
    <meta property="og:description" content="Format and slice your comic to platform-ready panels in your browser. No upload. 100% private.">
    <meta property="og:url" content="https://toonslice.com">
    <meta property="og:type" content="website">
    <meta property="og:site_name" content="ToonSlice">
    <meta property="og:image" content="https://toonslice.com/og-image.png">
    <meta property="og:image:width" content="1200">
    <meta property="og:image:height" content="630">

    <!-- Twitter Card -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="ToonSlice — Free Comic Slicer for Webtoon, Tapas & More">
    <meta name="twitter:description" content="Format and slice your comic to platform-ready panels in your browser. No upload. 100% private.">
    <meta name="twitter:image" content="https://toonslice.com/og-image.png">

    <!-- Icons -->
    <link rel="icon" type="image/x-icon" href="/export_r1_c1.ico">
    <link rel="apple-touch-icon" href="/apple-touch-icon.png">

    <!-- JSON-LD Structured Data -->
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      "name": "ToonSlice",
      "description": "Free browser-based comic slicer for Webtoon, Tapas, X/Twitter, and Instagram. No upload. 100% private.",
      "url": "https://toonslice.com",
      "applicationCategory": "Multimedia",
      "operatingSystem": "Any",
      "offers": {
        "@type": "Offer",
        "price": "0"
      }
    }
    </script>

    <script defer src="/_vercel/insights/script.js"></script>
  </head>
```

- [ ] **Step 2: Verify the edit was applied correctly**

Run: `head -50 index.html`
Expected: See the new meta tags between `<head>` and `<script defer`.

- [ ] **Step 3: Build and inspect dist output**

Run:
```bash
npm run build
grep -E '<title|<meta|<link|<script type="application' dist/index.html
```

Expected: See all new meta tags, canonical link, JSON-LD block in the built output.

- [ ] **Step 4: Commit**

```bash
git add index.html
git commit -m "feat(seo): add static meta tags, OG, Twitter Card, JSON-LD, favicon

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 2: Create robots.txt

**Files:**
- Create: `public/robots.txt`

- [ ] **Step 1: Create the file**

```txt
User-agent: *
Allow: /
Sitemap: https://toonslice.com/sitemap.xml
```

- [ ] **Step 2: Build and verify it lands in dist**

Run:
```bash
npm run build
cat dist/robots.txt
```

Expected: Same content as public/robots.txt.

- [ ] **Step 3: Commit**

```bash
git add public/robots.txt
git commit -m "feat(seo): add robots.txt with sitemap pointer

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 3: Create sitemap.xml

**Files:**
- Create: `public/sitemap.xml`

- [ ] **Step 1: Create the file**

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://toonslice.com/</loc>
  </url>
  <url>
    <loc>https://toonslice.com/webtoon</loc>
  </url>
  <url>
    <loc>https://toonslice.com/tapas</loc>
  </url>
  <url>
    <loc>https://toonslice.com/twitter</loc>
  </url>
  <url>
    <loc>https://toonslice.com/instagram</loc>
  </url>
</urlset>
```

- [ ] **Step 2: Build and verify it lands in dist**

Run:
```bash
npm run build
cat dist/sitemap.xml
```

Expected: Same content as public/sitemap.xml.

- [ ] **Step 3: Commit**

```bash
git add public/sitemap.xml
git commit -m "feat(seo): add sitemap.xml with all 5 routes

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 4: Final verification

- [ ] **Step 1: Clean build and inspect all outputs**

```bash
rm -rf dist
npm run build
echo "=== index.html meta tags ===" && grep -c 'meta name\|meta property\|meta charset' dist/index.html
echo "=== JSON-LD present ===" && grep -c 'application/ld+json' dist/index.html
echo "=== canonical present ===" && grep -c 'canonical' dist/index.html
echo "=== robots.txt ===" && cat dist/robots.txt
echo "=== sitemap.xml lines ===" && wc -l dist/sitemap.xml
echo "=== image files ===" && ls dist/*.png dist/*.ico 2>/dev/null
```

Expected:
- 11+ meta tags (charset + viewport + description + 6 OG + 3 twitter)
- 1 JSON-LD block
- 1 canonical link
- robots.txt with 3 lines
- sitemap.xml with 5 `<url>` entries
- og-image.png, apple-touch-icon.png, icon-192.png, export_r1_c1.ico in dist root

- [ ] **Step 2: Commit any remaining changes**

```bash
git status
git add -A
git commit -m "chore(seo): final verification — all SEO assets in dist

Co-Authored-By: Claude <noreply@anthropic.com>" --allow-empty
```
