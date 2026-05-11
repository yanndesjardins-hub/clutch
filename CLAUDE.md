# Clutch Game — Notes for Claude

## Deployment

- **Production host: Netlify only.** Do not mention Vercel in suggestions,
  commits, PR descriptions, or docs for this project — even though the README
  still lists it as an alternative.
- Netlify auto-redeploys from `main` on every push/merge.

## Branching

- `main` is protected on GitHub — direct pushes are refused (HTTP 403).
- All changes must go through a Pull Request targeting `main`.
- Feature work happens on `claude/clutch-game-setup-*` branches.
