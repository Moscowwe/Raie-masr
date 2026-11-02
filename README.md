# COMPETITION CONTROL CENTER (مركز التحكم في المنافسات)
### Real-Time Live Tournament Management System

A production-ready, full-stack tournament management system designed for esports and competitive athletic events. Manages **10 Teams**, **5 Games**, **5 Rounds**, and **25 Matches** with a server-authoritative central timer, manual operator result submission, and instant real-time synchronization across all connected devices.

---

## 🏆 Key Features

- **Authoritative Central Timer System**:
  - One central round countdown timer (default 10 minutes, fully configurable by Admin).
  - Admin controls: Start Round, Pause, Resume, End Round, Reset Timer, Set Duration.
  - Synchronized start across all 5 game stations.
  - When timer hits 0: broadcasts `TIME EXPIRED` and transitions round to `Awaiting Results`. Timer never automatically determines winners.
- **Manual Result Submission (Human Decisions Only)**:
  - Operator sees two large cards: **TEAM A** vs **TEAM B**.
  - Giant touch buttons: **TEAM A WINS**, **TEAM B WINS**, **DRAW**.
  - Results can be submitted at **any time** (before timer expires, at expiry, or after expiry).
  - Submitting result for one game does **not** stop or affect the central timer or other games.
  - Once submitted, results are immutable for the operator. Only the Administrator can correct submitted results with mandatory audit reasons.
- **Win-Based Scoring & Live Leaderboard**:
  - Win = 1 point, Draw = 0 points, Loss = 0 points.
  - Live recalculation and broadcast after every submitted result or admin correction.
  - Tracks: Rank, Team Name, Points, Wins, Draws, Losses, Matches Played, Matches Remaining.
- **Three Specialized UI Interfaces**:
  1. **Control Room (Admin Dashboard - Desktop-First)**: Live overview of all 5 stations, central timer, round transitions, tournament statistics, and activity audit feed.
  2. **Operator Station (Mobile-First)**: Optimized for phones and tablets with giant touch targets, confirmation modal, and submission locking.
  3. **Arena Broadcast Screen (Public TV/Projector)**: High-contrast esports jumbotron with millisecond timer, live stations, and standings.
- **Bilingual & RTL**: Full Arabic (RTL) and English (LTR) language support with instant toggle.
- **Web Audio Synthesizer**: Zero-dependency Web Audio API sound effects for referee whistles, game buzzers, and victory chimes.

---

## 🎮 Tournament Structure

### 10 Teams
- Team 1 through Team 10 (الفريق 1 إلى الفريق 10)

### 5 Game Stations
1. **Brain Ball** – برين بول
2. **Fish Hunters** – صيادين السمك
3. **Chair & Ball** – كرسي و الكرة
4. **Human Collision** – التصادم البشري
5. **Telescope** – تليسكوب

### Official Match Schedule (25 Matches)

| Round | Station 1 (Brain Ball) | Station 2 (Fish Hunters) | Station 3 (Chair & Ball) | Station 4 (Human Collision) | Station 5 (Telescope) |
|---|---|---|---|---|---|
| **Round 1** | Team 1 vs Team 6 | Team 2 vs Team 7 | Team 8 vs Team 3 | Team 9 vs Team 4 | Team 10 vs Team 5 |
| **Round 2** | Team 2 vs Team 6 | Team 7 vs Team 3 | Team 4 vs Team 8 | Team 5 vs Team 9 | Team 10 vs Team 1 |
| **Round 3** | Team 3 vs Team 6 | Team 4 vs Team 7 | Team 8 vs Team 5 | Team 1 vs Team 9 | Team 10 vs Team 2 |
| **Round 4** | Team 4 vs Team 6 | Team 7 vs Team 5 | Team 8 vs Team 1 | Team 9 vs Team 2 | Team 10 vs Team 3 |
| **Round 5** | Team 1 vs Team 2 | Team 3 vs Team 4 | Team 6 vs Team 5 | Team 8 vs Team 7 | Team 10 vs Team 9 |

*Every team plays exactly once per round.*

---

## 🛠️ Tech Stack

- **Backend**: Laravel 12, PHP 8.4+, SQLite / MySQL, Laravel Reverb WebSockets.
- **Frontend**: React 19, TypeScript, Tailwind CSS v4, Lucide Icons, Canvas Confetti.
- **Authentication**: Bearer Token Authorization with Role-Based Permissions (Admin / Operator).

---

## 🚀 Quick Setup & Installation

### 1. Backend Setup
```bash
cd backend
composer install
cp .env.example .env
php artisan key:generate
touch database/database.sqlite
php artisan migrate --seed
php artisan serve --port=8000
```

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev -- --port 5173
```
Open **`http://localhost:5173`** in your browser.

---

## 🔑 Demo Accounts (1-Click Switcher)

| Role | Email | Password | Assigned Station |
|---|---|---|---|
| **Main Administrator** | `admin@ccc.local` | `password123` | All Stations & Timers |
| **Operator 1** | `operator1@ccc.local` | `password123` | Station 1 (Brain Ball) |
| **Operator 2** | `operator2@ccc.local` | `password123` | Station 2 (Fish Hunters) |
| **Operator 3** | `operator3@ccc.local` | `password123` | Station 3 (Chair & Ball) |
| **Operator 4** | `operator4@ccc.local` | `password123` | Station 4 (Human Collision) |
| **Operator 5** | `operator5@ccc.local` | `password123` | Station 5 (Telescope) |

*Use the **"Switch Role (Demo)"** button in the header to switch roles with a single click.*

---

## 🧪 Automated Testing
Run the backend test suite:
```bash
cd backend
php artisan test
```
**Results**: `9 passed (53 assertions)` verifying tournament structure, schedule integrity, team uniqueness, and manual result workflow.
