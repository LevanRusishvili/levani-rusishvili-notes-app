# Notes

A full-stack note-taking app: write notes, tag them, archive them, search them, and pick your own theme.
Built to practice React with TypeScript on the front end and a plain Node.js server (no framework) on the back end.

Based on the [Frontend Mentor Note-taking app](https://www.frontendmentor.io) challenge.

## Features

- Create, read, update and delete notes
- Archive and restore notes
- Filter by tag, and search by title, tag and content
- Color theme (light, dark, system) and font theme (sans-serif, serif, monospace), saved in the browser
- Form validation with clear messages
- Fully usable with the keyboard, with visible hover and focus states
- Responsive layout for phone, tablet and desktop
- Accounts: sign up, log in, log out, change password, reset password
- Every user only sees their own notes

## Tech stack

| Part | Tools |
|---|---|
| Front end | React 19, TypeScript, Vite, React Router, Tailwind CSS v4 |
| Back end | Node.js `http` module (no Express), built-in `node:sqlite` |
| Auth | `scrypt` password hashing, server-side sessions in an `HttpOnly` cookie |
| Tooling | oxlint |

## Requirements

- Node.js **22.13 or newer** (the built-in SQLite module is used)

## Getting started

```bash
# 1. install the front end
cd client
npm install

# 2. start the API (terminal 1)
cd server
node server.js

# 3. start the app (terminal 2)
cd client
npm run dev
```

Open http://localhost:5173 and create an account.

The API runs on port 4000. The database file `server/notes.db` is created automatically on first run.

### Password reset in development

No real emails are sent. When you use "Forgot password?", the reset link is **printed in the terminal where the server is running**. Replace `sendPasswordResetEmail` in `server/mail.js` with a real mail provider to send actual emails.

## Project structure

```
server/
  server.js      HTTP server: CORS, routing, validation, error handling
  db.js          SQLite schema and every SQL query
  auth.js        password hashing (scrypt)
  mail.js        sends the reset email (prints it in development)

client/src/
  api/           fetch helpers, one file per area
  context/       auth state shared with the whole app (Context API)
  hooks/         useNotes, useTheme, useAuth
  components/    UI components
  index.css      design tokens, themes and Tailwind setup
```

## API

All routes except the auth ones need a logged-in session cookie.

| Method | Route | Description |
|---|---|---|
| POST | `/api/auth/register` | create an account and log in |
| POST | `/api/auth/login` | log in |
| POST | `/api/auth/logout` | log out |
| GET | `/api/auth/me` | the current user |
| PUT | `/api/auth/password` | change password |
| POST | `/api/auth/forgot` | request a reset link |
| POST | `/api/auth/reset` | set a new password with a reset token |
| GET | `/api/notes` | list your notes |
| POST | `/api/notes` | create a note |
| GET | `/api/notes/:id` | get one note |
| PUT | `/api/notes/:id` | update a note (any of `title`, `content`, `tags`, `isArchived`) |
| DELETE | `/api/notes/:id` | delete a note |

## Security notes

- Passwords are hashed with `scrypt` and a random salt per password.
- Session and reset tokens are random; only their SHA-256 hash is stored in the database.
- Every notes query is scoped to the logged-in user.
- All SQL uses prepared statements.
- Input is validated on the server, not only in the browser.

For a real deployment you would also add HTTPS (and the `Secure` cookie flag), a rate limit on login attempts, and email verification on sign up.

## Scripts (client)

| Command | What it does |
|---|---|
| `npm run dev` | start the dev server |
| `npm run build` | type-check and build for production |
| `npm run lint` | run oxlint |