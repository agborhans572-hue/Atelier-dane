# Atelier Dane

A multi-platform e-commerce solution for a (fictional) Scandinavian furniture brand. This project includes a marketing website, backend API, mobile app, and database infrastructure.

## Project Structure

### Frontend (`/`)
A nine-page marketing website built with static HTML and Tailwind CSS. Every page shares the "Glacier Light" design system.

**Pages:**
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
| `gift-cards.html` | Gift cards |
| `gift-ideas.html` | Gift ideas & curations |
| `new-arrivals.html` | New product arrivals |
| `journal.html` | Design journal & blog |
| `design-classics.html` | Design classics collection |
| `outdoor.html` | Outdoor furniture |
| `trade.html` | B2B trade program |
| `careers.html` | Careers & hiring |
| `press.html` | Press kit & media |
| Additional: `about.html`, `contact.html`, `account.html`, `checkout.html`, `order-confirmation.html`, `admin.html` |

### Backend (`/backend`)
Node.js/Express server handling API endpoints, authentication, and business logic.
- **Runtime:** Node.js
- **Framework:** Express
- **Hosting:** Railway (via `railway.toml` and `Procfile`)
- **Key files:** `server.js`, `package.json`

### Mobile App (`/myapp`)
Cross-platform Flutter application supporting iOS, Android, macOS, Windows, and web.
- **Framework:** Flutter
- **Supported platforms:** iOS, Android, macOS, Windows, Web
- **Entry point:** `lib/main.dart`

### Database (`/supabase`)
PostgreSQL schema and migrations managed through Supabase.
- **Schema:** `schema.sql`
- **Backend:** Supabase (PostgreSQL)

## Getting Started

### Frontend (Website)

**Quickest start:**
```bash
cd c:\Users\ADMIN\Desktop\dane-design-website
# Double-click index.html or use a local server
```

**With Live Server (recommended):**
1. Install the **Live Server** extension in VS Code (suggested in `.vscode/extensions.json`)
2. Right-click `index.html` → **Open with Live Server**
3. Auto-reload as you edit

**Note:** Internet connection required for images and fonts (loaded from CDNs).

### Backend

```bash
cd backend
npm install
npm start
```

The server runs on `http://localhost:3000` by default.

### Mobile App (Flutter)

```bash
cd myapp
flutter pub get
flutter run
```

**Platforms:**
- **iOS:** `flutter run -d iphone` (requires macOS + Xcode)
- **Android:** `flutter run -d android` (requires Android SDK)
- **Web:** `flutter run -d web`

### Database

Import the schema:
```sql
psql -U postgres < supabase/schema.sql
```

Or use Supabase UI to run the SQL directly.

## Architecture

- **CSS:** Tailwind CSS via CDN (`cdn.tailwindcss.com`)
- **Fonts:** Plus Jakarta Sans + Inter (Google Fonts), JetBrains Mono, Material Symbols
- **Shared CSS:** Glass panels, elevated cards, atmospheric shadows — defined in each page's `<head>`
- **Images:** Product/hero photos load from remote URLs
- **Backend:** RESTful API with Node.js/Express
- **Mobile:** Native iOS/Android via Flutter, with shared Dart codebase
- **Database:** Supabase PostgreSQL with real-time subscriptions

## Known Placeholders

- Nav search / cart / account icons are decorative (no handlers)
- "Book a visit" and appointment buttons link to `#` (no booking backend)
- Showroom addresses and phone numbers are illustrative
- Admin panel is under development

## Environment Setup

### Frontend
No build step required. Uses Tailwind CDN.

### Backend
Create `backend/.env` (see `backend/.env.example`):
```
DATABASE_URL=<supabase-connection-string>
PORT=3000
NODE_ENV=production
```

### Flutter
No additional env vars needed for local development. For production:
- Update API endpoint in code
- Configure signing certificates (iOS/Android)

## CI/CD

This project uses GitHub Actions for automated testing and deployment:
- **Triggers:** Push to `main`, pull requests
- **Checks:** Linting, format verification, backend tests
- **Deployment:** Railway (backend), Supabase (database)

See `.github/workflows/ci.yml` for details.

## Contributing

1. Create a branch: `git checkout -b feature/your-feature`
2. Commit changes: `git commit -am "Add feature"`
3. Push: `git push origin feature/your-feature`
4. Open a PR

## License

[Add license info]

## Contact

For questions or support, visit `contact.html` or open an issue on GitHub.
- Move images into a local `images/` folder for offline use and performance.
- Wire the showroom booking buttons to a contact form.
