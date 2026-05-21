# Pac Mailer

A desktop SMTP mail client built with Electron and React.

**Developer:** Developer Pac

## Features

- **Compose** — Send plain text or HTML email with CC, BCC, Reply-To, and file attachments
- **SMTP profiles** — Save multiple server configs with presets (Gmail, Outlook, Yahoo, SendGrid, Mailgun, custom)
- **Test connection** — Verify SMTP settings before sending
- **History** — Local log of sent and failed messages (stored on your device)
- **Themes** — Dark, light, or follow system appearance

## Requirements

- Node.js 18+
- npm

## Quick start

```bash
npm install
npm run dev
```

This starts the Vite dev server and launches the Electron app.

Optional: open DevTools in dev mode (may log harmless Autofill warnings in the terminal):

```bash
OPEN_DEVTOOLS=1 npm run dev
```

You can also toggle DevTools from the app with **View → Toggle Developer Tools** (macOS: **⌥⌘I**).

## Production build

```bash
npm run build    # Build the React UI
npm run start    # Run Electron with the built UI

npm run dist     # Package installers (macOS .dmg, Windows .exe, Linux AppImage)
```

Installers are written to the `release/` folder.

## SMTP setup tips

| Provider | Host | Port | Security |
|----------|------|------|----------|
| Gmail | smtp.gmail.com | 587 | STARTTLS |
| Outlook | smtp.office365.com | 587 | STARTTLS |
| Yahoo | smtp.mail.yahoo.com | 587 | STARTTLS |

For Gmail with 2FA enabled, create an [App Password](https://myaccount.google.com/apppasswords) and use it instead of your regular password.

## Remote access control (GitHub JSON)

Pac Mailer checks a JSON file on GitHub at startup. You can disable the app for all users anytime by editing that file.

### 1. Create a GitHub repo

Example: `pac-mailer-access` (public is fine — the file only contains on/off + message).

Add `access.json`:

```json
{
  "active": true,
  "message": "Support has expired. Contact Developer Pac."
}
```

Use `access.json.example` in this project as a template.

### 2. Get the raw URL

On GitHub: open `access.json` → **Raw** → copy the URL, e.g.

`https://raw.githubusercontent.com/youruser/pac-mailer-access/main/access.json`

### 3. Point the app at it

Edit `electron/config.js` and replace `YOUR_GITHUB_USER` with your repo path, or set:

```bash
export ACCESS_CONFIG_URL="https://raw.githubusercontent.com/youruser/pac-mailer-access/main/access.json"
```

### 4. Block users

Set `"active": false` in `access.json`, commit, and push. Users see your `message` and cannot use the app (on next online launch).

| Field | Meaning |
|-------|---------|
| `active` | `true` = app runs, `false` = blocked |
| `message` | Shown when blocked (optional; default mentions Developer Pac) |

**Offline behavior:** If the check cannot reach GitHub, users who were previously allowed can run for up to **7 days** using the cached result. After that, they must be online to verify access.

**Development:** Access check is skipped in dev while the URL still contains the `YOUR_GITHUB_USER` placeholder. Use `ENFORCE_ACCESS=1 npm run dev` to test blocking locally.

## Project structure

```
mailer/
├── electron/       # Main process (SMTP via nodemailer)
├── access.json.example
├── src/            # React UI
├── dist/           # Built UI (after npm run build)
└── release/        # Packaged apps (after npm run dist)
```

## License

MIT — © Developer Pac
