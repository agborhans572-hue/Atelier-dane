# Dane Design — Website

A nine-page marketing site for a (fictional) Scandinavian furniture brand, built as
static HTML styled with Tailwind CSS. Every page shares one "Glacier Light" design system.

## Pages
| File | Purpose |
| --- | --- |
| `index.html` | Home / collections overview |
| `seating.html` | Seating collection |
| `lighting.html` | Lighting collection |
| `tables.html` | Tables collection |
| `storage.html` | Storage collection |
| `shipping.html` | Shipping & delivery |
| `sustainability.html` | Sustainability commitments |
| `care-guide.html` | Material care guide |
| `showrooms.html` | Showroom locations |

The fixed top nav and footer are shared across all pages and use **relative links**,
so keep every file together in this folder.

## Run it
No build step required.

- **Quickest:** double-click `index.html` to open it in your browser.
- **Recommended (VS Code):** install the **Live Server** extension (suggested in
  `.vscode/extensions.json`), then right-click `index.html` → **Open with Live Server**
  for auto-reload as you edit.

An internet connection is needed to see the photos and fonts (they load from CDNs).

## How it's built
- **CSS:** Tailwind CSS via CDN (`cdn.tailwindcss.com`). The shared theme — colors,
  spacing scale, type scale — is defined in a `tailwind.config` block in each page's `<head>`.
- **Fonts:** Plus Jakarta Sans + Inter (Google Fonts), JetBrains Mono on the Tables page,
  Material Symbols for icons.
- **Shared CSS** (`.glass-panel`, `.glass-elevated`, `.atmospheric-shadow`, etc.) lives in a
  `<style>` block in each page's `<head>`. Because there's no build step yet, edit these in
  each page (or factor them into a shared file — see Next steps).
- **Images:** hero/product photos load from remote URLs.

## Known placeholders
- Nav search / cart / account icons are decorative (no handlers).
- Showroom "Book a visit" and the appointment button link to `#` (no booking backend).
- Showroom addresses and phone numbers are illustrative.
- The home hero still uses the original photo.

## Possible next steps
- Replace the Tailwind CDN with a real Tailwind build (CLI/PostCSS) and extract the shared
  config + CSS into single files instead of repeating them per page.
- Move images into a local `images/` folder for offline use and performance.
- Wire the showroom booking buttons to a contact form.
