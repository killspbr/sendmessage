# Plan: GitHub Repository Setup

## Overview
This plan outlines the steps to initialize a local Git repository for the `sendmessage` project, configure local exclusions to maintain AI functionality, create a private repository on GitHub, and push the codebase.

## Project Type
BACKEND/FRONTEND (Full-stack Node.js project)

## Success Criteria
- [ ] Local Git repository initialized.
- [ ] `.gitignore` created with standard exclusions (node_modules, .env, etc.).
- [ ] `.git/info/exclude` configured with `.agent/` to keep AI agents functional but untracked.
- [ ] Private GitHub repository `sendmessage` created.
- [ ] Remote `origin` linked to the local repository.
- [ ] Initial commit created and pushed to the `main` branch.

## Tech Stack
- Git (Local version control)
- GitHub (Remote hosting)
- github-mcp-server (Repository creation and management)

## File Structure
- `G:\Dev\sendmessage\` (Root)
  - `.git/` (VCS)
  - `.gitignore` (Public ignore list)
  - `.git/info/exclude` (Local ignore list)

## Task Breakdown

### Phase 1: Local Preparation
| ID | Task Name | Agent | Skills | Priority | Dependencies | Input -> Output -> Verify |
|--|--|--|--|--|--|--|
| 1 | Initialize Git Repo | `devops-engineer` | `powershell-windows` | P1 | None | `git init` -> `.git` folder -> `Test-Path .git` |
| 2 | Create .gitignore | `devops-engineer` | `clean-code` | P1 | 1 | Create file with standard Node.js/React ignores -> `.gitignore` file -> `cat .gitignore` |
| 3 | Configure Local Exclude | `devops-engineer` | `powershell-windows` | P1 | 1 | Append `.agent/` to `.git/info/exclude` -> Configured file -> `cat .git/info/exclude` |

### Phase 2: Remote Setup
| ID | Task Name | Agent | Skills | Priority | Dependencies | Input -> Output -> Verify |
|--|--|--|--|--|--|--|
| 4 | Create GitHub Repo | `devops-engineer` | `github-mcp-server` | P1 | None | Call `create_repository` (private: true) -> GitHub Repo URL -> API response success |
| 5 | Link & Push | `devops-engineer` | `powershell-windows` | P1 | 1, 4 | `git remote add origin`, `git add .`, `git commit`, `git push` -> Code on GitHub -> `git remote -v` and GitHub UI check |

## Phase X: Verification
- [ ] Verify `.agent/` is NOT in `.gitignore`.
- [ ] Verify `.agent/` IS in `.git/info/exclude`.
- [ ] Verify repository is set to PRIVATE on GitHub.
- [ ] Run `python .agent/scripts/checklist.py .` to ensure codebase health before final push.
