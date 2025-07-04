# Migration Plan: Modularizing and Rebuilding Creator Score Miniapp

This document outlines a high-level, step-by-step plan to migrate and modularize the Creator Score Miniapp into a new GitHub repository. The goal is to make all UI components pure (no API calls or business logic), with all data fetching and logic abstracted into hooks and service files. **For each feature/page, first refactor the code in the original repo to be modular and pure UI, then copy only the refactored code to the new repo.** The migration will proceed feature-by-feature (page-by-page), starting with the Profile screen.

---

## 1. Initial Setup

- **[ ]** Create a new GitHub repository for the modularized app.
- **[ ]** Set up the project structure (using Next.js, shadcn/ui, Tailwind, Lucide, etc.).
- **[ ]** Copy over global config files (e.g., `tailwind.config.ts`, `tsconfig.json`, `globals.css`, etc.).
- **[ ]** Set up the `planning/` folder and add this migration plan.
- **[ ]** Add a shared user resolver abstraction for all identifier types (see or create `lib/user-resolver.ts`).
- **[ ]** Centralize shared utilities and constants (see or create `lib/constants.ts` and `lib/utils.ts`).

---

## 2. Migration Process (Repeat for Each Feature/Page)

**For each feature/page, follow this improved workflow:**

### 2.1. Profile Screen Refactoring ✅ COMPLETED

- **[✅]** Refactor all relevant UI components in the original repo to be pure UI (no API calls, no business logic). All data should come from props.
- **[✅]** Move all data fetching and business logic to hooks and service files in the original repo.
- **[✅]** Use shadcn/ui components by default; avoid custom components unless necessary.
- **[✅]** Ensure all modals (e.g., profile overlays) follow the mobile/desktop modal principles (bottom sheet/side sheet/dialog).
- **[✅]** Apply minimal custom CSS, using Tailwind utilities and shadcn/ui variants.
- **[✅]** Implement mobile-first navigation (fixed header, bottom nav on mobile; centered content, hidden bottom nav on desktop).
- **[✅]** Use minimal, thin progress bars for scores and rewards.
- **[✅]** Truncate long text with show more/less toggles where needed.
- **[✅]** Apply the documented color system and typographic scale.
- **[✅]** Use the shared user resolver for all user/account lookups.
- **[✅]** Centralize any shared logic or constants.
- **[✅]** Implement caching for profile data (5 min) and score breakdowns (until profile updates).
- **[✅]** Ensure public profiles are accessible at `/[identifier]` and avoid reserved route words.
- **[✅]** Test the refactor in the original context for feature parity (UI, data, loading/error states, modal overlays, mobile/desktop adaptation).
- **[✅]** Ensure all taxonomy terms (User, Talent UUID, Account, etc.) are preserved and documented in code and docs.
- **[✅]** Document any unique or opinionated decisions made during refactoring.

**Profile Screen Status:** Complete ✅ - All components are now pure UI with TalentUUID-based data fetching, comprehensive caching, and modular architecture.

### 2.2. Leaderboard Page Refactoring 🚧 IN PROGRESS

**Current Status**: MinimalProfileDrawer completed ✅, main leaderboard page needs refactoring

- **[ ]** Refactor all relevant UI components in the original repo to be pure UI (no API calls, no business logic). All data should come from props.
- **[ ]** Move all data fetching and business logic to hooks and service files in the original repo.
- **[ ]** Use shadcn/ui components by default; avoid custom components unless necessary.
- **[ ]** Ensure all modals follow the mobile/desktop modal principles.
- **[ ]** Apply minimal custom CSS, using Tailwind utilities and shadcn/ui variants.
- **[ ]** Implement mobile-first navigation and responsive design.
- **[ ]** Use the shared user resolver for all user/account lookups.
- **[ ]** Centralize any shared logic or constants.
- **[ ]** Implement appropriate caching strategies.
- **[ ]** Test the refactor in the original context for feature parity.
- **[ ]** Ensure all taxonomy terms are preserved and documented.
- **[ ]** Document any unique or opinionated decisions made during refactoring.

### 2.3. Copy Refactored Code to New Repo (When Ready)

- **[ ]** Copy only the refactored, modular, and pure UI code (components, hooks, services, utils) to the new repo.
- **[ ]** Compose the page/container in the new repo using the refactored code.
- **[ ]** Test the feature/page in the new repo for parity and integration.
- **[ ]** Document any unique or opinionated decisions made during migration.

---

## 3. Next Components to Refactor

### 3.1. Leaderboard Components ✅ PARTIALLY COMPLETED
- **[✅]** Refactor MinimalProfileDrawer to use profile hooks instead of direct API calls
- **[ ]** Refactor LeaderboardRow component to pure UI
- **[ ]** Create useLeaderboard hook for leaderboard data fetching
- **[ ]** Refactor main leaderboard page to use hooks instead of direct API calls
- **[ ]** Implement proper loading and error states throughout leaderboard
- **[ ]** Apply shadcn/ui design system consistency
- **[ ]** Add caching for leaderboard data

### 3.2. Navigation Components
- **[ ]** Refactor Header and BottomNav to pure UI
- **[ ]** Create navigation hooks for user state management
- **[ ]** Ensure mobile/desktop responsive behavior

### 3.3. Settings Page
- **[ ]** Refactor settings components to pure UI
- **[ ]** Create appropriate hooks for settings data

### 3.4. Additional Features
For each additional feature/page:
- **[ ]** Repeat refactoring steps above
- **[ ]** Ensure all principles in architecture.md
- **[ ]** Document unique/opinionated decisions

---

## 4. Final Steps

- **[ ]** Review all components to ensure no API calls or business logic remain in UI components.
- **[ ]** Ensure all hooks and services are well-documented and tested.
- **[ ]** Update README and architecture docs to reflect the new modular structure and all principles.
- **[ ]** Remove any unused or legacy code.
- **[ ]** Double-check that all reserved route words are avoided.
- **[ ]** Confirm all caching and performance requirements are met.
- **[ ]** Ensure taxonomy is preserved and documented.

---

## 5. Tips & Best Practices

- **Refactor before migrating:** Always refactor in the original repo first, then migrate only clean, modular code.
- **Keep UI components pure:** Only receive data via props, emit events/callbacks.
- **Centralize logic:** All API calls and business logic should be in service files and hooks.
- **Test incrementally:** After each feature/page migration, test thoroughly before moving to the next.
- **Document as you go:** Update this plan and add notes for any deviations or improvements. Document all unique or opinionated decisions.
- **Follow architecture.md:** Regularly review the architecture.md file to ensure all principles are being followed.

---

*Use this plan as a guide for a clean, modular migration. For each step, you can ask the agent for specific prompts or code to help with the implementation.* 