# AGENTS.md

## Cursor Cloud specific instructions

This repository (`xjf17.github.io`) is a **pre-built Hugo static site** deployed to GitHub Pages (custom domain: `xiejinfeng.cn`). It contains only generated output (HTML, CSS, JS, images) — there are no source templates, `config.toml`, or Hugo content files in this repo.

### Key facts

- **No build system or package manager.** There is no `package.json`, `requirements.txt`, `Makefile`, or any dependency manifest. No `npm install` / `pip install` step is needed.
- **No linter, test suite, or CI pipeline** exists in this repository.
- **Git LFS** is configured for `*.mp4` files (see `.gitattributes`), but no `.mp4` files are currently tracked.

### Running locally

Serve the site with any static HTTP server from the repo root:

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000/` in a browser. All pages, navigation, search, and dark-mode toggle should work.

### Caveats

- Some assets reference the production domain (`xjf17.github.io` or `xiejinfeng.cn`), so absolute-URL resources (e.g. canonical links, Open Graph meta) will point externally when served locally. This does not affect page rendering or navigation.
- The site's language is Chinese (zh-cn).
