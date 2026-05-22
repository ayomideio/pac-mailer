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

## Production build (Windows installer)

```bash
npm run build    # Build the React UI
npm run start    # Run Electron with the built UI (local test)

npm run dist     # Windows NSIS installer (.exe setup wizard)
```

Output: `release/Pac Mailer Setup 1.0.0.exe` — standard install wizard (choose folder, desktop shortcut, Start menu).

**Note:** Building the Windows installer on macOS may require [Wine](https://www.winehq.org/) (`brew install wine-stable`). For best results, run `npm run dist` on a Windows PC or use CI.

## SMTP setup tips

| Provider | Host | Port | Security |
|----------|------|------|----------|
| Gmail | smtp.gmail.com | 587 | STARTTLS |
| Outlook | smtp.office365.com | 587 | STARTTLS |
| Yahoo | smtp.mail.yahoo.com | 587 | STARTTLS |

For Gmail with 2FA enabled, create an [App Password](https://myaccount.google.com/apppasswords) and use it instead of your regular password.

## Remote access control (GitHub JSON + Machine ID)

Each install generates a **Machine ID** (UUID). Users send it to you; you add it to `access.json` on GitHub. If the ID is not listed, they see *Contact Developer Pac*.

### First launch (user)

1. Click **Generate Machine ID**
2. Copy the ID and send it to Developer Pac
3. Once you activate them on GitHub, the app opens automatically (or when they restart)

### Your `access.json` on GitHub

Use `access.json.example` as a template:

```json
{
  "active": true,
  "message": "Support has expired. Contact Developer Pac.",
  "contactMessage": "Contact Developer Pac to activate this device.",
  "users": {
    "550e8400-e29b-41d4-a716-446655440000": {
      "allowed": true,
      "name": "Client A"
    }
  }
}
```

| Field | Meaning |
|-------|---------|
| `active` | `false` = block **everyone** immediately |
| `contactMessage` | Shown when Machine ID is not in `users` |
| `users` | Map of Machine ID → access |
| `users[id].allowed` | `true` = can use app, `false` = revoke that user |
| `users[id].name` | Optional label for your reference |

**Activate a user:** add their Machine ID under `users` with `"allowed": true`, commit, push.

**Revoke one user:** set their entry to `"allowed": false` or remove the key.

**Count users:** number of keys in `users` (manual; each key is one install).

### Setup

1. Host `access.json` in a GitHub repo (public is fine).
2. Copy the **raw** URL into `electron/config.js` (not the `/blob/` page URL).
3. User count = entries you add to `users`.

**Offline:** Allowed users can run up to **7 days** offline using the last successful check.

**Development:** Skipped while the config URL contains `YOUR_GITHUB_USER`. Use `ENFORCE_ACCESS=1 npm run dev` to test with your real GitHub file.

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
