# Plan: Cloudflare Pages Deployment

## Overview
Deployment of the `frontend` (Vite/React) to Cloudflare Pages. Note: The `backend` is a standard Express server and cannot be hosted on Cloudflare Pages (which is for static sites/functions). It will need a separate host (like Railway, Render, or fly.io).

## Project Type
WEB (Frontend Deployment)

## Success Criteria
- [ ] Cloudflare Pages project created and linked to the `killspbr/sendmessage` repository.
- [ ] Build configuration verified for the monorepo structure.
- [ ] Environment variables (.env) configured in the Cloudflare dashboard.
- [ ] Successful production build and deployment via Cloudflare.

## Tech Stack
- Cloudflare Pages (Hosting)
- Vite (Build Tool)

## Configuration Details
- **Framework Preset**: Vite
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Root Directory**: `frontend` (Crucial since it's a monorepo)

## Task Breakdown

### Phase 1: Deployment Configuration
| ID | Task Name | Agent | Skills | Priority | Dependencies | Input -> Output -> Verify |
|--|--|--|--|--|--|--|
| 1 | Create Deployment Doc | `devops-engineer` | `plan-writing` | P1 | None | Analyze project structure -> Documentation for CF Pages settings -> File `cloudflare-deploy.md` |
| 2 | Backend Hosting Plan | `devops-engineer` | `deployment-procedures` | P2 | None | Identify Express server needs -> Recommendations for backend hosting -> Updated deployment plan |

## Phase X: Verification
- [ ] Verify `frontend/dist` exists after local build.
- [ ] Check Cloudflare build logs for "Build Successful".
- [ ] Test the live URL provided by Cloudflare.
