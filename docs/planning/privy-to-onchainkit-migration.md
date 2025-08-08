### Goal

Replace Privy authentication with OnchainKit provider and wallet flows, keeping MiniKit support for Farcaster Mini App context.

Reference: [Next.js Installation · OnchainKit](https://docs.base.org/onchainkit/installation/nextjs)

### Summary of changes

- Replace `PrivyProvider` with `OnchainKitProvider` in `app/providers.tsx`.
- Introduce a new auth hook powered by Wagmi/OnchainKit to replace `usePrivyAuth`.
- Swap Privy login/logout usage in UI with OnchainKit Wallet connect/disconnect.
- Update copy: “Login with Privy” → “Connect Wallet”.
- Remove Privy dependencies and env vars.

### Status

- Completed:
  - Provider swap: `OnchainKitProvider` added; `PrivyProvider` removed in `app/providers.tsx` (kept `MiniKitProvider`).
  - New auth hook: `hooks/useWalletAuth.ts` created (ports talent-user caching/UUID resolution).
  - Call sites updated to use `useWalletAuth`:
    - `app/profile/page.tsx`
    - `components/navigation/Header.tsx`
    - `app/settings/page.tsx`
    - `hooks/useUserResolution.ts`
    - `components/navigation/BottomNav.tsx`
  - `FarcasterAccessModal.tsx` now uses `ConnectWallet` (with `onConnect`) and copy updated to “connect your wallet”.
  - Privy removed from `package.json` and `hooks/usePrivyAuth.ts` deleted.
  - Build passes after changes.
- Pending:
  - Remove `NEXT_PUBLIC_PRIVY_APP_ID` and `NEXT_PUBLIC_PRIVY_CLIENT_ID` from `.env` and deployment configs.
  - Optional: add `components/common/ConnectWalletButton.tsx` if we want a styled wrapper for multiple places.
  - Optional: feature flag `AUTH_PROVIDER_ONCHAINKIT` not added (skipped for now).
  - QA passes for manual scenarios below (smoke tested build only).

### Prerequisites

1. Ensure dependency present (already in repo): `@coinbase/onchainkit`
2. Env var: add `NEXT_PUBLIC_ONCHAINKIT_API_KEY` in `.env`
3. Styles are already included in `app/layout.tsx`: `import '@coinbase/onchainkit/styles.css'`

### Step-by-step plan

1. Add OnchainKit provider wrapper
   - File: `app/providers.tsx`
   - Replace `PrivyProvider` with `OnchainKitProvider` wrapping the app. Keep `MiniKitProvider` so `useMiniKit` continues to work.
   - Example structure (adjust only the provider layer):
     ```tsx
     // inside <PostHogProvider>
     <OnchainKitProvider
       apiKey={process.env.NEXT_PUBLIC_ONCHAINKIT_API_KEY}
       chain={base}
     >
       <MiniKitProvider
         apiKey={process.env.NEXT_PUBLIC_ONCHAINKIT_API_KEY}
         chain={base}
         config={
           {
             /* existing config */
           }
         }
       >
         {children}
       </MiniKitProvider>
     </OnchainKitProvider>
     ```
   - Remove Privy env checks and `<PrivyProvider>` usage.
   - Status: Done.

2. Create a replacement auth hook
   - New file: `hooks/useWalletAuth.ts`
   - Responsibilities:
     - Source connection status via Wagmi (`useAccount`, `useDisconnect`).
     - Maintain existing talent user resolution and caching behavior (port logic from `hooks/usePrivyAuth.ts`: `fetchTalentUser`, `globalTalentUserCache`, `globalTalentUserId`, debounce, localStorage sync).
     - Return signature analogous to `usePrivyAuth`:
       - `ready` (wagmi status is available), `authenticated` (connected), `walletAddress`, `talentId`, `handleLogin`, `handleLogout`.
     - Implement `handleLogin` as a no-op trigger that consumers replace with a Connect Wallet component, and `handleLogout` using `disconnect()`.
   - Status: Done.

3. Replace usages of `usePrivyAuth`
   - Files to update:
     - `app/profile/page.tsx` – import and use `useWalletAuth` for `talentId`.
     - `components/navigation/Header.tsx` – import and use `useWalletAuth` for gating nav.
     - `app/settings/page.tsx` – import and use `useWalletAuth` for `authenticated` and `handleLogout`.
     - `hooks/useUserResolution.ts` – import and use `useWalletAuth` for `talentId`.
     - `components/navigation/BottomNav.tsx` – import and use `useWalletAuth` for `talentId`.
   - Status: Done.

4. Update `FarcasterAccessModal`
   - File: `components/modals/FarcasterAccessModal.tsx`
   - Remove `usePrivy` and `useLogin` usage.
   - Replace “Login with Privy” button with OnchainKit Wallet connect UI:
     - Inline component `ConnectWallet` from OnchainKit Wallet package.
   - Update copy to “Connect Wallet”.
   - On successful connection, close modal and push to `redirectPath` (use `ConnectWallet`’s `onConnect`).
   - Status: Done.

5. Add a reusable Connect Wallet entry point
   - If desired, create `components/common/ConnectWalletButton.tsx` that renders OnchainKit’s connect component with consistent styling.
   - Use it anywhere a connect control is needed.
   - Status: Optional, not implemented.

6. Remove Privy provider and dependencies
   - File: `app/providers.tsx` – delete `PrivyProvider` import and usage.
   - `package.json` – remove `@privy-io/react-auth` and `@privy-io/server-auth`.
   - `.env` – remove `NEXT_PUBLIC_PRIVY_APP_ID`, `NEXT_PUBLIC_PRIVY_CLIENT_ID`.
   - Status: Code and packages done; env cleanup pending.

7. Adjust copy and UX
   - Search and replace UI text: “Login with Privy” → “Connect Wallet”.
   - Ensure any docs/tooltips reference OnchainKit Wallet instead of Privy.
   - Status: Done where applicable.

8. QA checklist
   - Build boots without Privy provider and packages (done).
   - From a cold start with no localStorage, connect a wallet via OnchainKit:
     - Talent UUID correctly resolved and cached.
     - `app/profile/page.tsx` redirects as before using `talentId` or MiniKit user.
   - Disconnect (logout) from Settings works and redirects to `/leaderboard`.
   - Mini App flows (`useMiniKit`) remain unaffected.
   - No references to Privy left in codebase or UI.
   - Status: Pending manual verification in runtime.

9. Optional: staged rollout
   - Introduce a temporary feature flag `AUTH_PROVIDER_ONCHAINKIT` to toggle new auth in non-prod if desired. Keep flag usage centralized (e.g., in `app/providers.tsx` and hook export), then remove after rollout.
   - Status: Skipped.

### Implementation notes

- Keep provider order: `PostHogProvider` → `OnchainKitProvider` → `MiniKitProvider` → children.
- OnchainKit provider under the hood creates Wagmi and QueryClient providers; do not add additional Wagmi providers unless customizing.
- Ensure `@coinbase/onchainkit/styles.css` remains imported at app root.

### Rollback plan

- Revert `app/providers.tsx` to Privy provider version.
- Restore `hooks/usePrivyAuth.ts` imports in updated files.
- Reinstall Privy packages and re-add env vars.
