# Implementation Plan — Login/Signup Authentication & DB Integration

This plan outlines the architecture and changes needed to add user registration, login, and database integration (using SQLite) to the SafeRoute AI application.

---

## Proposed Changes

### 1. Backend Integration (Flask + SQLite)

#### [NEW] [db.py](file:///d:/Syed/Github_work/Tata%20Hackathon/backend/utils/db.py)
Create a database management module to initialize an SQLite database (`saferoute.db`) and user table with columns:
- `id` (INTEGER PRIMARY KEY AUTOINCREMENT)
- `username` (TEXT UNIQUE NOT NULL)
- `email` (TEXT UNIQUE NOT NULL)
- `password_hash` (TEXT NOT NULL)
- `created_at` (TIMESTAMP DEFAULT CURRENT_TIMESTAMP)

We will use Flask's built-in `werkzeug.security` library for secure password hashing and verification.

#### [MODIFY] [app.py](file:///d:/Syed/Github_work/Tata%20Hackathon/backend/app.py)
Add standard authentication API endpoints:
- `POST /api/auth/signup` — Register a new user (hash password, save to SQLite).
- `POST /api/auth/login` — Authenticate user credentials and return a user session object/token.

---

### 2. Frontend Integration (React)

#### [NEW] [AuthContext.jsx](file:///d:/Syed/Github_work/Tata%20Hackathon/frontend/src/contexts/AuthContext.jsx)
Create a global authentication provider containing:
- `user` state (stored in `localStorage` for persistence across refreshes).
- `login(email, password)` and `signup(username, email, password)` functions.
- `logout()` helper.

#### [NEW] [Login.jsx](file:///d:/Syed/Github_work/Tata%20Hackathon/frontend/src/pages/Login.jsx)
Create a login page with form fields for Email and Password.

#### [NEW] [SignUp.jsx](file:///d:/Syed/Github_work/Tata%20Hackathon/frontend/src/pages/SignUp.jsx)
Create a signup page with form fields for Username, Email, Password, and Password Confirmation.

#### [MODIFY] [api.js](file:///d:/Syed/Github_work/Tata%20Hackathon/frontend/src/services/api.js)
Add signup and login fetch handlers to connect to the backend auth endpoints.

#### [MODIFY] [App.jsx](file:///d:/Syed/Github_work/Tata%20Hackathon/frontend/src/App.jsx)
- Wrap application routes in `AuthProvider`.
- Create a `PrivateRoute` wrapper that redirects unauthenticated users to `/login`.

#### [MODIFY] [Header.jsx](file:///d:/Syed/Github_work/Tata%20Hackathon/frontend/src/components/layout/Header.jsx)
- Hide navigation links if user is not logged in.
- Display a profile avatar/username and a logout button when logged in.

#### [MODIFY] [index.css](file:///d:/Syed/Github_work/Tata%20Hackathon/frontend/src/index.css)
Add premium styling for Login and Signup cards, form controls, error alerts, and transitions.

---

## Verification Plan

### Automated/Manual Verification
1. **Signup Test**: Create a new account. Verify backend hashes password and saves to `saferoute.db`.
2. **Login Test**: Sign in with incorrect and correct credentials. Verify correct session persistence.
3. **Route Guard Test**: Try navigating directly to `/analytics` or dashboard while logged out. Verify redirect to `/login`.
4. **Logout Test**: Click logout and verify user is redirected to `/login` and session is cleared.
