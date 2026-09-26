# 🎓 EduSpare — All-in-One Educational SaaS Platform

> **EduSpare** is a production-grade, full-stack educational SaaS platform engineered for university students, researchers, educators, and technology creators. It unifies daily study activity tracking, intelligent task prioritization, Notion/Keep-style study workspaces with context-aware AI Tutors, Facebook-style research article sharing, real-time peer messaging with block controls, profile biodata vaults, universal auto-complete search, and member-gated study communities.

---

## 📋 Table of Contents
1. [🌐 1. Project Related Discussion](#1-project-related-discussion)
2. [🏗️ 2. Framework Based Discussion](#2-framework-based-discussion)
3. [🤝 3. Project Collaboration Environment](#3-project-collaboration-environment)
4. [🎯 4. Requirement Analysis of Project](#4-requirement-analysis-of-project)
5. [🛠️ 5. Technology Stack & API Endpoint Matrix](#5-technology-stack--api-endpoint-matrix)
6. [🧠 6. How AI Tutor Works & How Workspace Works](#6-how-ai-tutor-works--how-workspace-works)
7. [🚀 7. How to Start the Project in a New Device](#7-how-to-start-the-project-in-a-new-device)

---

## 🌐 1. Project Related Discussion

### 1.1 Executive Overview & Core Vision
Modern academic and research workflows are severely fragmented. Students and researchers routinely juggle separate disconnected applications: Notion for study notes, Todoist or Trello for task scheduling, ChatGPT/Claude for automated tutoring, Medium/Dev.to for publishing articles, and Slack or Discord for peer collaboration. 

**EduSpare** solves this fragmentation by consolidating all essential learning tools into a single, high-performance, glassmorphic SaaS platform. It bridges individual deep work (notes, prioritization, AI study notebook) with social academic networking (study communities, peer chat, knowledge feeds, active streak tracking).

### 1.2 Core Problem & Solution Matrix

| Fragmented Traditional Tooling | EduSpare Unified Solution |
| :--- | :--- |
| **Manual Task Prioritization**: Static todo lists that don't account for approaching deadlines vs task importance. | **Algorithmic Prioritization Engine**: Dual-tier automatic sorting (`dueAt - now` ascending primary sort, `importanceScore` tie-breaker). |
| **Context-Blind AI Assisting**: Copy-pasting study context repeatedly into external LLM chats. | **Contextual AI Tutor Notebook**: Embedded workspace assistant automatically fed task titles, categories, and rich notes. |
| **Disjointed Reference Materials**: Links scattered across browser bookmarks, drive folders, and text files. | **Notion & Edge-Style Workspace**: Tabbed PDF/document reader, reference checklists, and formatted Markdown study notes. |
| **Isolated Study Habits**: Lack of visibility into peer study consistency and academic achievements. | **Codeforces 52-Week Activity Grid**: Visual SVG heatmap grid tracking daily contributions, submission volumes, and streaks (`🔥 42 Days`). |
| **Public vs Private Hub Division**: Difficulty managing private research groups vs open student forums. | **Member-Gated Study Hubs**: Public and private study communities with member-only resource access control. |

---

## 🏗️ 2. Framework Based Discussion

EduSpare is constructed on a modern React ecosystem utilizing **Next.js 14 App Router**, **TypeScript**, **Tailwind CSS**, and **Prisma ORM with PostgreSQL**.

```
                           +-------------------------------------+
                           |         Next.js 14 App Router       |
                           |   (React Server & Client Components)|
                           +------------------+------------------+
                                              |
                +-----------------------------+-----------------------------+
                |                                                           |
   +------------v------------+                                 +------------v------------+
   |   Client State Layer    |                                 |   Next.js API Routes    |
   | (EduSpareContext API)   |                                 |   (/src/app/api/...)    |
   +------------+------------+                                 +------------+------------+
                |                                                           |
   +------------v------------+                                 +------------v------------+
   | Lucide Icons & Tailwind |                                 |  Prisma ORM & PostgreSQL|
   | Glassmorphism Theme     |                                 |   (Supabase DB Pooler)  |
   +-------------------------+                                 +-------------------------+
```

### 2.1 Next.js 14 App Router Architecture
* **Server Components (RSC)**: Renders static layout structures and initial page markups on the server for optimal performance and SEO.
* **Client Components (`'use client'`)**: Used for interactive surfaces such as the Notion-style note editor, live AI tutor panel, search auto-complete dropdown, real-time message stream, and tabbed workspace reader.
* **API Route Handlers (`/src/app/api/...`)**: Standardized Server API Endpoints enforcing validation, database transactions, error handling, and standard HTTP JSON responses.

### 2.2 TypeScript End-to-End Type Safety
All domain models, API payloads, database entities, component props, and global state interfaces are strictly typed under [`src/types/eduspare.ts`](file:///e:/Projects/SBOS/src/types/eduspare.ts). This eliminates runtime undefined crashes and guarantees seamless developer ergonomics across frontend components and backend API route logic.

### 2.3 Glassmorphism UI & Custom Design Tokens
* **Theme Tokens**: Custom Tailwind HSL palette featuring glass canvas background (`#FAF8FF`), primary brand blue (`#003EC7` / `#0052FF`), deep dark mode Slate surfaces (`dark:bg-slate-900`), and subtle outline borders (`#E0E2EC`).
* **Typography & Icons**: Styled with Google `Inter` font family, rendering clean hierarchy alongside `lucide-react` iconography.
* **Math & Markdown Engine**: Implements `react-markdown`, `remark-math`, `rehype-katex`, and `katex` to render mathematical LaTeX notation (`$inline$` and `$$display$$`) inline within study notes and AI Tutor answers.

### 2.4 Prisma ORM & Database Resilience
* Relational database models defined in [`prisma/schema.prisma`](file:///e:/Projects/SBOS/prisma/schema.prisma) mapping Users, Tasks, Materials, Blogs, Comments, Reactions, Messages, UserBlocks, Communities, and SavedItems.
* Compatible with transaction pooling via **Supabase PostgreSQL** (`DATABASE_URL` on port 6543) and direct connection migration/seeding (`DIRECT_URL` on port 5432).

---

## 🤝 3. Project Collaboration Environment

EduSpare provides an environment for peer collaboration, mentor guidance, and knowledge exchange:

```
                            +-------------------------------+
                            |   EduSpare Collaboration Hub  |
                            +---------------+---------------+
                                            |
      +--------------------+----------------+--------------------+--------------------+
      |                    |                                     |                    |
+-----v--------------+ +---v----------------+             +------v-------------+ +----v---------------+
| Member-Gated Hubs  | | Facebook-Style Feed|             | Peer Direct Chat   | | User Switcher      |
| Public/Private     | | Articles & Comments|             | & Block Enforcement| | Multi-User Demo  |
+--------------------+ +--------------------+             +--------------------+ +--------------------+
```

### 3.1 Member-Gated Study Communities
* **Public & Private Hubs**: Users can explore or found specialized research hubs (e.g., *Computer Science & Systems Lab*, *AI & Machine Learning Hub*).
* **Access Control Enforcement**: Non-members see a locked preview banner; joined members gain posting rights, exclusive discussion access, and community material sharing.

### 3.2 Facebook-Style Blog Feed & Peer Feedback
* **Rich Article Publishing**: Authors publish structured articles with cover image previews, attached PDF/document resources, and topic tags (`#WebSockets`, `#AI`, `#Systems`).
* **Interactive Social Engagement**: Features live reaction counters (Heart, Like), nested comment threads rendering commenter profile avatars with timestamps, and bookmark buttons.

### 3.3 Peer Direct Messaging & Safety Controls
* **Conversations Thread**: Active user list with online badges and instant conversation switching.
* **Avatar Profile Navigation**: One-click navigation to user profile pages directly from message headers or chat message bubbles.
* **Block / Unblock Safety Controls**: Toggle block state on target users via `/api/chat/block`. Blocking automatically locks chat input banners and restricts cross-user interactions.

### 3.4 Multi-User Switcher & Role-Based Environment
Top-right navbar features an instant **User Switcher** dropdown to shift active session contexts between distinct academic personas without logging out:
1. **Alex Rivera** (`@alex_dev`) — CS & AI Student (Default User)
2. **Sarah Jenkins** (`@sarah_j`) — Systems Architect & Educator
3. **Dr. Marcus Vance** (`@marcus_v`) — Quantum Physics Researcher
4. **Elena Rostova** (`@elena_r`) — Data Science Fellow

---

## 🎯 4. Requirement Analysis of Project

### 4.1 Functional Requirements

```
         +-----------------------------------------------------------------------+
         |                      EduSpare Core Requirements                       |
         +-----------------------------------+-----------------------------------+
                                             |
                   +-------------------------+-------------------------+
                   |                                                   |
      +------------v------------+                         +------------v------------+
      | Functional Requirements |                         |Non-Functional Req.    |
      +------------+------------+                         +------------+------------+
                   |                                                   |
   +---------------+---------------+                   +---------------+---------------+
   | - Algorithmic Prioritization  |                   | - Sub-100ms REST Responses    |
   | - Notion & Keep Workspace     |                   | - Multi-Provider AI Resilience|
   | - Multi-Provider AI Tutor     |                   | - End-to-End Type Safety      |
   | - 52-Week Codeforces Grid     |                   | - Responsive Glassmorphic UI  |
   | - Real-time Chat & Blocks     |                   | - Strict Data Schema Integrity|
   +-------------------------------+                   +-------------------------------+
```

1. **Task Prioritization Engine**:
   - Primary Sort: Time remaining (`dueAt - now` ascending).
   - Secondary Tie-Breaker: Importance Score (`0` to `100` descending).
   - Dashboard Top 5 Urgent Tasks Widget with quick check-off toggles and countdown status badges.
2. **Notion/Keep Workspace**:
   - Markdown editable study notes with real-time state persistence.
   - Resource & Material checklist (PDF, Documentation link, Code snippet, Video URL).
   - Multi-tab document preview panel.
3. **Multi-Model AI Tutor**:
   - Model Selector supporting Gemini 3.8 Flash, GPT-4o-mini, GPT-4o, Claude 3.5 Sonnet, Llama 3.3, Gemma 2, and DeepSeek.
   - Contextual prompt synthesis taking task title, category, and study notes into account.
   - Preset action modes: *Explain Topic*, *Quiz & Flashcards*, *Summary & Key Takeaways*.
4. **Universal Auto-Complete Search**:
   - Fixed navbar input popover returning instant categorised results (Users, Blogs, Tasks, Communities).
5. **Academic Heatmap & Profile Vault**:
   - SVG 52-week activity grid displaying daily contribution levels and streak counters.
   - Profile biodata vault showcasing academic history, authored blogs, and saved bookmarks.

### 4.2 Non-Functional Requirements
1. **Performance**: Sub-100ms REST API response latency and streaming/fast fallback AI tutor responses (45s timeout limit).
2. **Resilience**: Failover transparent routing across AI providers (`Gemini` -> `OpenAI` -> `Groq` -> `Anthropic` -> `OpenRouter`).
3. **Usability & Accessibility**: Mobile, tablet, and desktop layout responsiveness, keyboard-friendly navigation, ARIA compliance, and dark theme support.
4. **Security & Integrity**: Relational foreign keys in PostgreSQL, user block validation in messaging API routes, and isolated server environment variables.

---

## 🛠️ 5. Technology Stack & API Endpoint Matrix

### 5.1 Technology Stack Breakdown

| Layer | Technology | Version | Purpose & Usage |
| :--- | :--- | :--- | :--- |
| **Frontend Framework** | **Next.js (App Router)** | `^14.2.25` | Fast React Server Components & Client routing |
| **Language** | **TypeScript** | `^5.5.4` | Strict type definitions and API data contracts |
| **Styling & Design** | **Tailwind CSS** | `^3.4.10` | Custom glassmorphism, surface elevation, HSL palette |
| **Icons & UI Utilities**| **Lucide React & clsx** | `^0.428.0` | Iconography and conditional CSS class merging |
| **Database & ORM** | **Prisma ORM + PostgreSQL**| `^5.22.0` | Type-safe schema definition and query builder |
| **Database Host** | **Supabase PostgreSQL** | Cloud | Managed PostgreSQL with pgbouncer transaction pooling |
| **State Sync** | **React Context API** | React 18 | `EduSpareContext` client state synchronization |
| **Math & Markdown** | **KaTeX & React-Markdown** | `^0.18.4` | Rendering LaTeX formulas (`$ ... $`) and Markdown |

### 5.2 REST API Endpoint Matrix

| HTTP Method | API Endpoint Route | Payload / Query Parameters | Description |
| :--- | :--- | :--- | :--- |
| `GET` / `POST` | `/api/auth` | `{ userId }` | Authenticate session and switch active user |
| `GET` / `POST` | `/api/tasks` | `{ title, category, dueAt, importanceScore }` | Fetch prioritized task list or create new task |
| `GET` / `PUT` / `DELETE`| `/api/tasks/[id]` | `{ status, notes, materials }` | Retrieve, update workspace notes/materials, or delete task |
| `GET` / `POST` | `/api/blogs` | `{ title, summary, content, category, coverImage }` | Fetch blog feed with reactions/comments or publish post |
| `PUT` / `DELETE` | `/api/blogs/[id]` | `{ title, content, tags }` | Edit or delete authored blog post |
| `POST` | `/api/blogs/[id]/comments` | `{ content }` | Post comment under blog post with author profile icon |
| `POST` | `/api/blogs/[id]/reactions` | `{ type: "like" \| "heart" }` | Toggle reaction counter on target blog post |
| `GET` / `POST` | `/api/chat` | `{ receiverId, text }` | Retrieve message history or send direct message |
| `GET` / `POST` / `DELETE`| `/api/chat/block` | `{ targetUserId }` | Retrieve blocklist, block user, or unblock user |
| `GET` / `PUT` | `/api/profile` | `{ bio, university }` | Fetch profile biodata or update academic bio |
| `GET` / `POST` | `/api/saved` | `{ type, title, url, itemId }` | Fetch saved vault items or bookmark article/resource |
| `GET` | `/api/search` | `?q=query_string` | Universal auto-complete search across platform |
| `GET` / `POST` | `/api/communities` | `{ name, description, isPrivate }` | Get study hubs, create hub, or toggle join/leave state |
| `POST` | `/api/ai-tutor` | `{ prompt, action, taskTitle, category, notes, history }` | Contextual AI Tutor notebook explanations and quizzes |
| `POST` | `/api/sync` | `{ snapshot }` | Reset database to initial seed snapshot |
| `GET` | `/api/notifications` | - | Fetch active user notifications |

---

## 🧠 6. How AI Tutor Works & How Workspace Works

### 6.1 How AI Tutor Works

```
                                  +---------------------------------------+
                                  |    User Input & Workspace Context     |
                                  | (Task, Notes, Action Mode, Prompt)    |
                                  +-------------------+-------------------+
                                                      |
                                                      v
                                  +---------------------------------------+
                                  |      Context Prompt Synthesizer       |
                                  |  (System Prompt + LaTeX Rules + History)|
                                  +-------------------+-------------------+
                                                      |
                                                      v
                                  +---------------------------------------+
                                  |   Multi-Provider Fallback Controller  |
                                  +-------------------+-------------------+
                                                      |
      +----------------------+------------------------+-----------------------+----------------------+
      |                      |                        |                       |                      |
+-----v------+         +-----v------+           +-----v------+          +-----v------+         +-----v------+
| Google     |         | OpenAI     |           | Groq       |          | Anthropic  |         | OpenRouter |
| Gemini Key | (Fail)  | GPT Key    |  (Fail)   | Hardware   |  (Fail)  | Claude Key | (Fail)  | Universal  |
| (Primary)  |-------->| (Backup 1) |---------->| (Backup 2) |--------->| (Backup 3) |-------->| (Fallback) |
+------------+         +------------+           +------------+          +------------+         +------------+
```

1. **Context Prompt Synthesis**:
   When a query is submitted inside the Study Workspace, `/api/ai-tutor` injects context:
   - Current Task Title & Category (e.g. `Distributed Systems - Raft Consensus`).
   - Active Rich Study Notes (up to 6,000 characters).
   - Selected Action Mode (`explain`, `quiz`, `flashcards`, `summary`, `takeaways`).
   - Sanitized conversation history window.
2. **Transparent Multi-Provider Fallback**:
   Every selected model maps to a preferred provider chain. If a key is missing or encounters a rate limit/quota error, the backend routes the request to the next available provider:
   - **Google Gemini**: `gemini-3.8-flash` (Primary via Google AI Key).
   - **OpenAI**: `gpt-4o-mini`, `gpt-4o`.
   - **Groq**: Ultra-fast execution for `llama-3.3` & `gpt-oss-120b`.
   - **Anthropic**: `claude-3.5-sonnet`.
   - **OpenRouter**: Universal fallback routing for any model.
3. **Pedagogical Formatting & Mathematical LaTeX**:
   - Math equations are formatted with standard LaTeX (`$E = mc^2$` inline, `$$ ... $$` display block).
   - Quizzes are returned with answer keys and flashcards are rendered in structured Markdown tables.

### 6.2 How Workspace Works

```
+---------------------------------------------------------------------------------------------------+
|  EduSpare Task Workspace Modal (Normal / Fullscreen / Floating Minimized Dock Pill)               |
+---------------------------------------------------+-----------------------------------------------+
| LEFT PANE: Notes & Document Reader                | RIGHT PANE: Contextual AI Tutor Notebook      |
|                                                   |                                               |
|  [Notion/Keep Rich Text Editor]                   |  [Model Switcher Dropdown (Gemini, GPT, etc)] |
|  - Title & Category Badge                         |  [Quick Action Chips]                         |
|  - Markdown Notes Editor                          |   (⚡ Explain, 📝 Quiz, 🃏 Flashcards, 💡 Summary)|
|                                                   |                                               |
|  [Resource Checklist & Edge-Style Reader Tabs]    |  [Interactive Chat & History Stream]          |
|  - PDF / Doc / Video / Code Snippet Links         |  - Step-by-step solutions                     |
|  - Tab 1: PDF Paper Preview | Tab 2: Code Doc    |  - Rendered LaTeX equations & Markdown tables  |
+---------------------------------------------------+-----------------------------------------------+
```

1. **Dual-Pane Layout & Flexible Window Modes**:
   - **Normal Modal**: Centered modal overlay for standard editing.
   - **Fullscreen Mode**: Expands workspace across the entire viewport for distraction-free deep work.
   - **Floating Minimized Dock Pill**: Minifies the workspace into a floating pill at the bottom right corner, keeping notes and progress safe while browsing other platform pages.
2. **Notion & Google Keep Style Study Notes**:
   - Edit formatted study notes with immediate context syncing.
3. **Resource Checklist & Edge-Style Reader Tabs**:
   - Attach PDFs, reference links, lecture videos, and code snippets.
   - Clicking any resource opens an integrated multi-tab previewer directly inside the workspace.
4. **Context-Connected AI Tutor**:
   - The right column provides immediate access to the AI tutor without losing focus on study notes.

---

## 🚀 7. How to Start the Project in a New Device

Follow this step-by-step setup guide to get **EduSpare** running on a new machine.

### 7.1 Prerequisites & System Requirements
Ensure your machine has the following software installed:
* **Node.js**: `v18.0.0` or higher (v20+ recommended)
* **npm**: `v9.0.0` or higher
* **Git**: Installed and configured
* **OS**: Windows, macOS, or Linux

---

### 7.2 Step-by-Step Installation Guide

#### Step 1: Clone the Repository
Open your terminal or command prompt and clone the workspace:
```bash
git clone https://github.com/77Arafat383/EduSpare.git
cd EduSpare
```

#### Step 2: Install Project Dependencies
Install all required Node.js packages:
```bash
npm install
```

#### Step 3: Configure Environment Variables
Create a local `.env` or `.env.local` file in the root directory by copying `.env.example`:
```bash
# On Linux/macOS:
cp .env.example .env

# On Windows PowerShell:
Copy-Item .env.example .env
```

Open `.env` and configure your keys:
```env
# Database Connection (Supabase PostgreSQL or local PostgreSQL)
DATABASE_URL="postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres"

# AI Tutor API Key (Add at least ONE key — GEMINI_API_KEY is free at https://aistudio.google.com)
GEMINI_API_KEY="your_google_gemini_api_key_here"

# Optional Additional AI Provider Keys
GROQ_API_KEY=""
OPENAI_API_KEY=""
ANTHROPIC_API_KEY=""
OPENROUTER_API_KEY=""
```

> 💡 **Note**: The AI Tutor auto-routes to any configured key. Providing a single `GEMINI_API_KEY` or `GROQ_API_KEY` is sufficient to enable the AI Tutor.

#### Step 4: Synchronize Database Schema
Push the Prisma schema to your PostgreSQL database:
```bash
npx prisma@5 db push
```

#### Step 5: Seed the Database with Test Data
Populate the database with initial demo users, tasks, blogs, study hubs, and messages:
```bash
npx tsx scripts/seed.ts
```
*(Or run `npm run db:seed`)*

#### Step 6: Launch the Development Server
Start the local Next.js development server:
```bash
npm run dev
```

#### Step 7: Open in Browser
Open your browser and navigate to:
👉 **`http://localhost:3000`**

Use the **User Switcher** in the top right navigation bar to test the platform as **Alex Rivera**, **Sarah Jenkins**, **Dr. Marcus Vance**, or **Elena Rostova**.

---

### 7.3 Production Build & Deployment

To verify and test an optimized production build locally:
```bash
# Generate Prisma Client, sync DB schema, and construct Next.js bundle
npm run build

# Start the production server
npm run start
```

---

### 7.4 Troubleshooting Common Setup Issues

* **Prisma Schema Drift / Database Connection Error**:
  Ensure `DATABASE_URL` and `DIRECT_URL` point to a reachable PostgreSQL instance or Supabase project. Re-run `npx prisma db push`.
* **AI Tutor Returns "Not Configured" Message**:
  Check `.env` to verify that `GEMINI_API_KEY` or another valid key is present. Restart the dev server (`npm run dev`) after editing environment variables.
* **Port 3000 Already in Use**:
  Run `npx kill-port 3000` or launch Next.js on an alternate port: `npx next dev -p 3001`.

---



