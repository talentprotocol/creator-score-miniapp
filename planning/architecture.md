# Creator Score Mini App – Core Principles


## PRODUCT

- **Principle:** Our apps are optimized for fast, consistent building by "vibe coders"-reusability over customization.
- **User Identification:** Users are identified by a canonical Talent UUID, but can log in or be found via Farcaster, GitHub, or wallet.
- **Shared Utilities:** All user lookups and profile loads go through a single resolver that abstracts away the identifier type (Farcaster, GitHub, wallet, Talent UUID). Common logic is extracted into shared services for maintainability and testability.
- **Leaderboard UX:** The current user is always pinned to the top of the leaderboard. Special badges (e.g., "New Builder", "Hall of Fame") can be used to highlight user status and achievements.
- **Advanced Search Callout:** The search page includes a blue callout for advanced search, linking to Talent Index.
- **Profile Modal:** Viewing another user's profile (from Search or Leaderboard) opens a modal overlay (draggable bottom sheet on mobile, side sheet on desktop) rather than navigating away from the current context.
- **Documentation:** All unique or opinionated decisions are documented for clarity; best practices are referenced but not over-explained.

## DESIGN

- **Navigation:** Mobile-first with a fixed top header and bottom navigation bar. 
- **Modals:** All secondary flows (menus, about, eligibility, score breakdown, profile overlays, etc.) are implemented as draggable bottom sheets on mobile, always featuring a small horizontal drag handle at the top center. On desktop, these become side sheets or modal dialogs.
- **Color System:** We use a minimal, neutral palette with a single vibrant accent color, applied sparingly and strategically for clarity and focus.
- **Typographic Hierarchy:** Typography follows a clear, documented scale for all text elements, ensuring visual consistency and fast building.
- **Modals:** All modals are draggable bottom sheets on mobile, with a visual drag handle. On desktop, they become side sheets or dialogs.
- **Mobile:** The mobile experience is the primary focus, with all layouts and interactions optimized for touch and small screens.
- **Desktop:** The desktop experience is a minimal adaptation: content is centered with max width, bottom nav is hidden, and modals become dialogs or side sheets.
- **Show More/Less:** Long text (e.g., AI summaries) is truncated with a toggle for expanding/collapsing content.
- **Progress Bars:** Progress bars are used throughout the app to visualize activity, scores, and reward progress, and are always minimal and thin.

## TECH

- **Stack:** Built with Next.js (App Router, not SPA), React, shadcn/ui, Tailwind CSS, and Lucide icons.
- **Profile Routing:** Public profiles are accessible at `/[identifier]` (Farcaster, GitHub, or UUID). Reserved words are used to avoid route conflicts (see list at the bottom).
- **Component Structure:** Avoid custom components when possible—default to shadcn/ui and only customize for unique UX needs.
- **Minimal Custom CSS:** We minimize custom CSS, leveraging Tailwind utilities and shadcn/ui variants as much as possible.
- **Performance:** Profile data is cached for 5 minutes, leaderboard for 1 minute (with background refresh), and score breakdowns until profile updates.

### Reserved Page/Route Words

`api`, `settings`, `leaderboard`, `old-prototype`, `services`, `.well-known`, `favicon.ico`, `robots.txt`, `sitemap.xml`, `login`, `logout`, `register`, `signup`, `signin`, `auth`, `admin`, `dashboard`, `home`, `explore`, `notifications`, `messages`, `search`, `help`, `support`, `terms`, `privacy`, `about`, `contact`, `static`, `public`, `assets` 


## TAXONOMY

- **User**: An authenticated individual using the app, identified by a Talent UUID.
- **Talent UUID**: The proprietary, canonical unique identifier for a user, created by Talent Protocol.
- **Account**: An external account associated with a user, such as a wallet address, Farcaster, or GitHub.
- **Account Identifier**: A unique value for an account (e.g., FID, fname, wallet address, GitHub username).
- **Account Source**: The platform or service from which an account originates (e.g., Farcaster, ENS, GitHub).
- **Profile**: A Talent Protocol user's public information, which may be viewed by others in the app.
- **Handle**: The human-readable, unique identifier shown publicly for each user (e.g., Farcaster username, ENS) and used in public URLs.
- **Credential**: A Talent API data point scored in the context of a Score, representing a verifiable achievement or attribute.
- **Score**: The sum of all Credentials, representing a user's overall builder status.
- **Data Point**: Any individual metric or value used to calculate Credentials and Score.
- **Session**: The current authenticated context for a user, including authentication method and active accounts. 
