# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project description
The web app is a service that helps teachers grade students using a rubric. A rubric is essentially a table organized into rows and columns; each row represents a category, while each column represents a grade level. The leftmost column corresponds to the highest grade, and the rightmost column to the lowest.

To use this system, the teacher must first create the rubric. Once created, they can edit it by adding rows and columns. Teachers can also assign students to a rubric by entering their name and grade level. These students are saved in the database, allowing the teacher to select an existing student later instead of creating a new entry.

Once students are added to the list, the teacher can select one and begin grading by tapping the table cells. Each cell carries a value based on the column's grade, which the teacher defines while editing the rubric.

## Commands

```bash
npm run dev       # Start Vite dev server with HMR
npm run build     # TypeScript check (tsc -b) + Vite production build
npm run preview   # Preview production build locally
npm run lint      # ESLint with TypeScript support
```

There is no test runner configured.

## Tech Stack

- **React 19** + **TypeScript 5.8**, built with **Vite 7**
- **React Router DOM 7** for client-side routing
- **Firebase v12** — Firestore (data) + Firebase Auth (Google OAuth)
- **SCSS with CSS Modules** for scoped component styles; design tokens in [src/styles/_variables.scss](src/styles/_variables.scss)
- **PapaParse** for CSV import (admin bulk student upload)

## Architecture

### Firebase Integration

Firebase is initialized once in [src/context/FirebaseContext.tsx](src/context/FirebaseContext.tsx), which exposes `db`, `auth`, and `user` via the `useFirebase()` hook. Components subscribe to Firestore using `onSnapshot` for real-time updates and must unsubscribe in the `useEffect` cleanup.

The app supports two runtime config sources:
1. **Canvas LMS globals** (`__firebase_config`, `__app_id`, `__initial_auth_token`) — used in production
2. **Vite env vars** (`VITE_FIREBASE_*`, `VITE_APP_ID`) — used in local development

### Firestore Data Model

```
artifacts/{appId}/
├── users/{userId}/rubrics/{rubricId}   # Rubrics owned by a teacher
├── students/{studentId}                 # Global student list
└── admins/{email}                       # Admin users (email as doc ID)
```

### Routing & Auth Guards

[src/routes.tsx](src/routes.tsx) defines three route tiers:
- **Public** — `/login`, `/rubricFeedback` (no auth required)
- **Private** — requires `auth.currentUser` (checks in component/route guard)
- **Admin** — additionally checks Firestore `admins/{email}` document

Only `@ear.com.br` email addresses are permitted to authenticate via Google OAuth ([src/auth.ts](src/auth.ts)).

### Domain Models

Defined as TypeScript interfaces in [src/interfaces/](src/interfaces/):
- `IRubric` — rubric with categories; max grade = number of lines × 25
- `IRubricLine` — single category with four score options (25/20/15/10)
- `IStudent` — student with name, enrollment ID, email, grade level
- `ITeacher` — teacher profile linked to Firebase UID

### Page Responsibilities

| Page | Purpose |
|------|---------|
| `Home` | Dashboard — list, create, and delete rubrics |
| `Rubric` | Main rubric editor; contains `RubricTable` (grading matrix) and `StudentList` (assign students) |
| `RubricFeedback` | Public, unauthenticated view of a student's grades |
| `Admin` | CSV-based bulk import of students via PapaParse |
| `Login` | Google OAuth entry point |

### Styling Conventions

- Each page/component has its own `.module.scss` file imported as `styles`
- Global reset and base rules live in [src/styles/global.scss](src/styles/global.scss)
- Layout uses a 6 px spacing unit system

