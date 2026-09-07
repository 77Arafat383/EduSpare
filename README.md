# 🎓 EduSpare — All-in-One Educational SaaS Platform

> **EduSpare** is a production-grade educational SaaS platform designed for students, researchers, educators, and creators. It unifies daily study activity tracking, intelligent task prioritization, Notion/Keep-style task workspaces with contextual AI Tutors, Facebook-style blog and document sharing, real-time user messaging with block controls, profile biodata vaults, universal auto-complete search, and member-gated study communities.

---

## 🌟 Key Platform Features

### 1. 📊 Dashboard & Codeforces Activity Heatmap
* **Profile Summary Card**: Displays user avatar, handle (`@alex_dev`), university, scholar rank, total points, and streak counter (`🔥 42 Days`). Clicking leads directly to full profile view.
* **Codeforces-Style 52-Week Activity Grid**: Visual SVG heatmap grid displaying daily activity levels, total submission counts, streak milestones, and hover tooltips for exact date details.
* **Platform Navigation Sidebar**: Left-hand menu providing 1-click access to all 8 core platform modules.

### 2. ⚡ Task Prioritization Engine & Notion/Keep Workspaces
* **Prioritization Algorithm**:
  1. **Primary Sort**: Less remaining time first (`dueAt - now` ascending).
  2. **Secondary Tie-Breaker**: Importance Score (`0` to `100` descending).
* **Top 5 Urgent Tasks Widget**: Live ranked list on the right column of the dashboard with countdown badges and quick check-off toggles.
* **Notion & Google Keep Style Workspace**:
  * **Rich Text Workspace Notes**: Editable study notes with Markdown formatting.
  * **Resource & Material Checklist**: Attach reference PDFs, documentation links, video lectures, and code snippets (Add, Update, Delete).
  * **Contextual AI Tutor Notebook**: Integrated assistant supporting *Explain Topic*, *Quiz & Flashcards*, *Key Takeaways*, and custom prompt inquiries.

### 3. 📰 Facebook-Style Blog Feed & Knowledge Sharing
* **Rich Article Publishing**: Post articles with cover images, PDF/doc attachments, and topic tags (`#WebSockets`, `#AI`, `#Systems`).
* **Interactive Feed UX**: Reactions counter (Heart, Like), comment thread displaying commenter profile icons alongside comments, share links, and author post management.
* **Personal Saved Vault**: Bookmark blogs, attached PDFs, images, or documents directly into personal saved items.

### 4. 💬 Real-Time Messaging & Block Controls
* **Conversations Thread List**: User list with online status indicators.
* **Message Controls**: Send text messages, view chat history, navigate to user profile by clicking avatar in chat header or message bubbles.
* **Block / Unblock Enforcement**: Toggle block state on target users with input lock banners.

### 5. 👤 Profile Biodata & Saved Vault
* **Academic Background**: View university, major, bio, scholar points, rank badges, and active streak.
* **Authored Blogs Tab**: Filtered list of blogs published by the profile owner.
* **Saved Items Vault**: Accessible on own profile for bookmarked articles, PDFs, images, and notes.
* **Visitor Mode**: Direct **Message User** CTA button to initiate chat threads.

### 6. 🔍 Universal Search Bar & Auto-Complete
* **Fixed Navbar Input**: Universal search accessible from anywhere in the app.
* **Auto-Complete Recommendations Popover**: Live search suggestions categorized into Users, Blogs, Tasks, and Study Communities with 1-click navigation.

### 7. 👥 Member-Gated Study Communities
* **Create & Browse Hubs**: Public and private study communities (e.g. *Computer Science & Systems Lab*, *AI & Machine Learning Hub*).
* **Member-Gated Access Control**: Non-members view a gated access notice; members can view, post, react, and comment on exclusive community resources.

---

## 🛠️ Technology Stack

| Layer | Technology | Purpose & Usage |
| :--- | :--- | :--- |
| **Frontend Framework** | **Next.js 14 (App Router)** | Fast Server Component & Client State routing |
| **Language** | **TypeScript** | Strict type checking & API contracts |
| **Styling & Theme** | **Tailwind CSS** | Custom glassmorphism `#FAF8FF`, primary blue `#003EC7`/`#0052FF`, `Inter` font |
| **Database & ORM** | **Prisma ORM + PostgreSQL (Supabase)** | Relational data model hosted on Supabase PostgreSQL |
| **Backend API** | **Next.js Server API Routes** | REST API route handlers (`/api/...`) |
| **Icons & UI** | **Lucide React** | Sleek iconography |
| **State Management** | **React Context (`EduSpareContext`)** | Client state sync with server API endpoints |

---

## 📡 REST API Endpoint Matrix

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` / `POST` | `/api/auth` | Login, registration, and active user switcher |
| `GET` / `POST` | `/api/tasks` | Get prioritized tasks list or create new task |
| `GET` / `PUT` / `DELETE` | `/api/tasks/[id]` | Get task details, update status/notes/materials, delete task |
| `GET` / `POST` | `/api/blogs` | Get blog feed with reactions/comments or post new blog |
| `PUT` / `DELETE` | `/api/blogs/[id]` | Update or delete authored blog post |
| `POST` | `/api/blogs/[id]/comments` | Add comment with author profile icon |
| `POST` | `/api/blogs/[id]/reactions` | Toggle like/reaction on blog post |
| `GET` / `POST` | `/api/chat` | Get message history or send message |
| `GET` / `POST` / `DELETE` | `/api/chat/block` | Get blocklist, block user, or unblock user |
| `GET` / `PUT` | `/api/profile` | Get profile data or update academic biodata |
| `GET` / `POST` | `/api/saved` | Get saved vault items or bookmark new item |
| `GET` | `/api/search` | Search auto-complete recommendations (Users, Blogs, Tasks, Hubs) |
| `GET` / `POST` | `/api/communities` | Get communities, create hub, or toggle join/leave |
| `POST` | `/api/ai-tutor` | Contextual AI Tutor notebook explanations, quizzes, and summaries |

---

## 🚀 Getting Started & Local Setup

### 1. Prerequisites
* **Node.js**: v18.0.0 or higher (v24 supported)
* **npm**: v9.0.0 or higher

### 2. Installation
Clone the repository and install dependencies:
```bash
npm install
```

### 3. Database Initialization & Seeding
Sync PostgreSQL database schema and populate with rich test data:
```bash
npx prisma@5 db push
npx tsx scripts/seed.ts
```

### 4. Run Development Server
Start the local Next.js development server:
```bash
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.

### 5. Production Build
To create an optimized production build:
```bash
npm run build
npm run start
```

---

## 👥 Demo Accounts for Testing

You can use the **User Switcher** in the top right header to instantly switch between pre-configured test users:

1. **Alex Rivera** (`@alex_dev`) — CS & AI Student (Default Active User)
2. **Sarah Jenkins** (`@sarah_j`) — Systems Architect & Educator
3. **Dr. Marcus Vance** (`@marcus_v`) — Quantum Physics Researcher
4. **Elena Rostova** (`@elena_r`) — Data Science Fellow

---

## 📄 License

This project is licensed under the MIT License.
