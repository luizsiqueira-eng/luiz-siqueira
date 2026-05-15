# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

Static personal website for Luiz Siqueira, deployed to GitHub Pages at `luizsiqueira.com.br`. No build step, no dependencies — everything runs directly in the browser.

## Development

Open `index.html` in a browser to preview. No build, no package manager, no local server required.

To serve locally with live reload:
```bash
npx live-server .
# or
python3 -m http.server 8000
```

Deployment is automatic via GitHub Pages on push to `main`.

## Architecture

Single-page site with anchor-based navigation (`#sobre`, `#palestras`, `#feed`):

- **`index.html`** — the entire site: HTML structure, all inline CSS (overrides `styles.css`), JSON-LD structured data, and a small inline script for the mobile nav toggle.
- **`styles.css`** — base stylesheet, partially superseded by the inline styles in `index.html`. The inline styles take precedence for most elements.
- **`sitemap.xml`** — SEO sitemap for the four main sections.
- **`CNAME`** — GitHub Pages custom domain (`luizsiqueira.com.br`).
- Media assets (`.jpg`, `.jpeg`, `.png`, `.mov`, `.mp4`) are served directly from the repo root.

## Key design decisions

- All critical styles live **inline in `index.html`**, not in `styles.css`. `styles.css` contains legacy/unused rules for a previous layout (`.bio`, `.noticia`, `.palestra`, `.redes-sociais`).
- The hero section uses a background video (`luiz.mov`) rendered via `<video autoplay muted playsinline loop>`.
- Contact CTA links directly to Instagram DM instead of a form (the form section is commented out in `index.html`).
- JSON-LD blocks in `<head>` cover `Person`, `VideoObject`, and two `ItemList` schemas (palestras and artigos) for rich search results.
- The mobile nav toggle is driven by a single inline `<script>` at the bottom of `<body>` that toggles `.active` on `<nav>`.
