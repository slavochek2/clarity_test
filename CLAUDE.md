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

## Development Practices

Follow these principles when writing and modifying code:

- **KISS** (Keep It Simple, Stupid): Prefer simple, readable solutions over clever ones. Complexity should be justified.
- **DRY** (Don't Repeat Yourself): Extract common logic into reusable functions/components, but avoid premature abstraction.
- **YAGNI** (You Aren't Gonna Need It): Don't build features or abstractions until they're actually needed.
- **Lean/MVP**: Ship the smallest working solution first. Iterate based on real feedback.
- **Single Responsibility**: Each function, component, or module should do one thing well.
- **Fail Fast**: Validate inputs early and surface errors immediately rather than hiding them.
- **Boy Scout Rule**: Leave code cleaner than you found it—but only for code you're actively changing.
- **Composition over Inheritance**: Prefer composing small, focused pieces over deep inheritance hierarchies.
- **Explicit over Implicit**: Make behavior obvious. Avoid magic that obscures what code does.

## File & Project Organization

- **Colocation**: Keep related files together (component + styles + tests in same folder).
- **Flat over Nested**: Avoid deep folder nesting. Prefer 2-3 levels max.
- **Naming Conventions**:
  - Components: `PascalCase.tsx`
  - Utilities/hooks: `camelCase.ts`
  - Constants: `SCREAMING_SNAKE_CASE`
- **Index Files**: Use sparingly—only for clean public APIs, not to hide structure.
- **Delete Dead Code**: Remove unused files, imports, and commented-out code. Git is your history.

## Code Quality

- **Types over Comments**: Let TypeScript describe what code does. Add comments only for *why*.
- **Small Functions**: If a function needs scrolling, split it.
- **Early Returns**: Reduce nesting with guard clauses.
- **Consistent Formatting**: Trust ESLint and Prettier. Don't fight the tooling.
- **Meaningful Names**: Variables and functions should reveal intent. Avoid abbreviations.
- **No Magic Numbers**: Extract constants with descriptive names.

## Testing & Reliability

- **Test Behavior, Not Implementation**: Tests should survive refactors.
- **Happy Path + Edge Cases**: Cover the main flow and likely failure modes.
- **Run Before Commit**: Always run `npm run lint` and `npm run build` before pushing.

## Git Practices

- **Atomic Commits**: One logical change per commit.
- **Descriptive Messages**: Start with a verb (Add, Fix, Update, Remove, Refactor).
- **Small PRs**: Easier to review, faster to merge, less risk.

