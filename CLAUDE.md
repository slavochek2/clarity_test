# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start development server (localhost:3000)
npm run build    # Production build
npm run lint     # Run ESLint
npm start        # Start production server
```

## Architecture

This is a Next.js 14 application using the App Router with TypeScript and Tailwind CSS.

- **App Router**: Uses `src/app/` directory structure
- **Path alias**: `@/*` maps to `./src/*`
- **Styling**: Tailwind CSS with custom gradient utilities (radial, conic)
- **Font**: Inter (Google Font via next/font)

