# Plan: Migration from Supabase to PostgreSQL (Easypanel)

## Overview
Compete removal of Supabase dependency, migrating to a standalone PostgreSQL database hosted on Easypanel. This includes database logic, schema recreation, and custom authentication implementation.

## Project Type
BACKEND/FRONTEND (Migration)

## Success Criteria
- [x] PostgreSQL database initialized on Easypanel with identical schema.
- [x] Backend converted from `@supabase/supabase-js` to `pg`.
- [x] Custom JWT Authentication implemented to replace Supabase Auth.
- [x] Frontend updated to use local Auth API instead of Supabase client.
- [x] Environment variables updated for the new infrastructure.

## Tech Stack
- PostgreSQL (Database)
- `pg` (Node.js Postgres client)
- `jsonwebtoken` & `bcryptjs` (For Auth replacement)
- Express (Existing backend)

## Task Breakdown

### Phase 1: Database Setup
| ID | Task Name | Agent | Skills | Priority | Dependencies | Input -> Output -> Verify |
|--|--|--|--|--|--|--|
| 1 | Database Schema | `database-architect` | `database-design` | P0 | None | Supabase structure -> SQL Schema Script -> `tables.sql` file |
| 2 | Backend Client | `backend-specialist` | `nodejs-best-practices` | P1 | None | `npm install pg` -> Database connection pool config -> `db.js` file |

### Phase 2: Auth Implementation (Replacement)
| ID | Task Name | Agent | Skills | Priority | Dependencies | Input -> Output -> Verify |
|--|--|--|--|--|--|--|
| 3 | Auth Backend | `security-auditor` | `api-patterns` | P1 | 2 | Login/Signup routes + JWT middleware -> Auth endpoints -> API tests |
| 4 | Auth Frontend | `frontend-specialist` | `react-best-practices` | P1 | 3 | UseAuth hook update -> Login via backend API -> Login success |

### Phase 3: Logic Migration
| ID | Task Name | Agent | Skills | Priority | Dependencies | Input -> Output -> Verify |
|--|--|--|--|--|--|--|
| 5 | Migrate Queries | `backend-specialist` | `nodejs-best-practices` | P2 | 2 | Replace `supabase.from()` calls with SQL queries -> Updated `index.js` -> Functionally identical API |
| 6 | Worker Update | `backend-specialist` | `nodejs-best-practices` | P2 | 2, 5 | Replace Supabase in `scheduledWorker.js` -> Updated worker -> Successful job processing |

## Phase X: Verification
- [x] All API endpoints returning correct data from PostgreSQL.
- [x] User can Login/Logout without Supabase.
- [x] Scheduled jobs still firing correctly.
- [x] Run `python .agent/scripts/checklist.py .`
