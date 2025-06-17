## TASK

- Design and implement the frontend for "Builder Rewards," a mobile-first Farcaster mini app. 
- The application must feature a clean, minimalist UI, allowing users to track their onchain development rewards, view leaderboards, manage their public profile, and configure personal settings.

## CONTEXT & CONSTRAINTS

-   **Application:** Builder Rewards, a Farcaster Frame v2.
-   **Target Platform:** Mobile-first.
-   **Core Idea:** Distribute weekly rewards to onchain developers based on verified crypto activity (GitHub, smart contracts) and a "Builder Score." No need to apply, post, or claim; rewards are automatic.
-   **Key UI Principles:** Clean, minimalist, intuitive, and responsive.
-   **Focus:** This prompt focuses on the UI/UX (what the user sees and interacts with) rather than deep technical implementation details.

## LAYOUT & NAVIGATION

### 1. Global Navigation Elements

-   **Top Navigation Bar:**
    -   Displays "Builder Rewards" title.
    -   Menu icon (right side) opens a draggable bottom sheet (Menu Modal).
-   **Bottom Navigation Bar:**
    -   Fixed at the bottom.
    -   Provides primary navigation to four main pages: 'Rewards', 'Search', 'Profile', 'Settings'.
    -   The active page icon and label are visually highlighted (e.g., blue icon/text with a light blue background).

### 2. Modal Navigation & Behavior

-   **Menu Modal (Draggable Bottom Sheet):**
    -   Accessed from the Top Navigation Bar's menu icon.
    -   Navigation links: "Settings," "About" (opens About Modal), "Dev Docs" (external link), "Support" (external link), and "Log Out."
    -   Footer: Copyright information and social media icons/links (T&C, X/Twitter, Discord, Farcaster).
-   **About Modal (Draggable Bottom Sheet):**
    -   Accessed from the Menu Modal.
    -   Includes a "Back" button to return to the Menu Modal.
    -   Content sections:
        -   "Builder Rewards": App description.
        -   "How it works": Bullet-point explanation.
        -   "Supported Networks": Visual badges (e.g., Base, Celo, Talent).
        -   "About Talent Protocol": Brief description.
-   **General Modal Behavior:**
    -   All modals appearing as bottom sheets (Menu, About, Eligibility, Score Breakdown, Hall of Fame, Wallet Menu, Profile Modal) are draggable downwards to close.
    -   These draggable sheets feature a small, horizontal gray dash at the top center as a visual drag handle.

## DESIGN SYSTEM & GUIDELINES

-   **Mobile-First Design:** UI must be optimized for mobile viewing and touch interaction.
-   **Clean & Minimalist Aesthetic:**
    -   Emphasize clarity through ample white space.
    -   Use legible typography suitable for mobile screens.
    -   Employ a restrained color palette. Blue should be the primary accent color for interactive elements, highlights, and key information.
-   **Component-Based Architecture:**
    -   Utilize reusable UI components (Cards, Buttons, Badges, Progress Bars, Tabs, Select Dropdowns, Avatars, Inputs, Checkboxes, Labels, etc.) for consistency.
    -   Adhere to shadcn/ui component styling principles where applicable.
-   **Interactivity & Feedback:**
    -   All interactive elements (buttons, links, tabs, etc.) must have clear visual feedback for hover and active/pressed states.
-   **Iconography:**
    -   Use Lucide React icons consistently for actions, information, and visual cues.
    -   Ensure icons are appropriately sized and styled for a mobile context, maintaining visual balance.
-   **Consistency:**
    -   Maintain uniformity in font sizes, spacing, padding, border styles, icon usage, and component appearance throughout the application.
    -   Pay attention to consistent sizing and styling for elements like icons and text within similar components across different pages (e.g., icons in Accounts tab vs. Projects tab on the Profile page).

## PAGE STRUCTURE

### 1. Rewards Page

-   **Selectors & Filters:**
    -   Dropdown: 'Sponsor' (e.g., Base, Celo, Talent).
    -   Dropdown: 'Status' (displays user's eligibility for the selected sponsor).
        -   Includes an info icon that, when clicked, opens an **Eligibility Modal** (draggable bottom sheet). This modal details criteria (e.g., connect GitHub, verify human, deploy contract) with visual check/cross marks. A "Complete Verification" button navigates to the Settings page.
    -   Tabs: 'Period' selection ("This Week," "Last Week," "All Time").
        -   "This Week" tab should have a visual indicator (e.g., a green pulsing dot) signifying it's current.
-   **Stats Cards (2x2 Grid):**
    -   **Aggregate Stats (Contextual):**
        -   If 'This Week': "Round Ends" (e.g., "3d 14h") and "Total Rewards" in the pool. These cards also feature the green pulsing dot.
        -   If 'Last Week'/'All Time': "Builders Rewarded" (count) and "Total Rewards" distributed.
    -   **User-Specific Stats:**
        -   "Builder Activity" (percentage with progress bar) or "Builder Score" (numeric, if 'All Time').
            -   Clickable, opening a **Score Breakdown Modal** (draggable bottom sheet) detailing components like "Verified Contracts," "Public Commits," etc., each with its own progress bar and description.
            -   Features green pulsing dot if 'This Week'.
        -   "Potential Rewards" (value with progress bar) or "Rewards Earned."
            -   Clickable (if not 'This Week'), navigating the user to their own profile's rewards tab.
            -   Features green pulsing dot if 'This Week'.
-   **Leaderboard Card:**
    -   Title: "Leaderboard" with a badge indicating the selected period.
    -   List items: Rank, PFP, Name, Rewards Amount.
    -   Current user's entry is visually highlighted (e.g., light blue background and border).
    -   **User Badges:**
        -   '🆕' emoji: For new high-ranking users.
        -   '👑' emoji: For "Hall of Fame" (HoF) users.
            -   This emoji is clickable, opening a **HoF Modal** (draggable bottom sheet) explaining the HoF status and the maximum reward cap for the selected sponsor (e.g., "1 ETH" or "5,000 CELO").
    -   **Reward Cap Progress Bar (All Time View Only):**
        -   Displayed for each user under their reward amount.
        -   Visually indicates progress towards the lifetime reward cap for the selected sponsor.
        -   The bar's color is a solid color derived from a gradient interpolation (blue at 0% to amber at 100%) based on progress.
        -   The bar should be wide, starting roughly aligned with the reward value text.
    -   **Interaction:** Clicking a user (not self) opens their profile in a **Profile Modal**. Clicking self navigates to the user's own Profile Page.
    -   "Load More" button at the bottom.

### 2. Search Page

-   **Search Input:** Prominent search bar with a search icon for finding builders by name.
-   **Results List:** Displays matching users with PFP, name, and Builder Score.
    -   Each user entry is clickable, opening their profile in a **Profile Modal**.
-   **No Results Message:** Displayed if the search query yields no matches.
-   **Callout Component:** Blue-themed callout: "Need advanced search? Go to Talent Index" with an external link icon.

### 3. Profile Page (Applies to own profile and viewing others via Profile Modal)

-   **Profile Header Card:** Large PFP, Name/Username (shows "You" if current user, otherwise their name like "vitalik.eth"), "First reward: [Date]".
-   **Personal Stats Cards (1x2 Grid):** "Builder Score" (numeric), "Total Rewards Earned" (value).
-   **AI Summary Card:**
    -   Displays an AI-generated summary.
    -   If text exceeds a certain length, it's truncated with a "Show more" / "Show less" toggle button (ChevronUp/Down icons).
-   **Tabs Navigation:** "Accounts," "Projects," "Rewards."
    -   **Accounts Tab:**
        -   **Own Profile View:**
            -   Blue-themed callout: "Manage your connected accounts." with a light blue "Go to Settings" button (Settings icon, darker blue on hover) aligned right.
            -   Below, a list of the user's *publicly visible* connected accounts.
        -   **Other User's Profile View:** A list of the user's publicly displayed accounts.
        -   **Account Item (Card):** Account icon (e.g., GitHub, Twitter, Wallet), type/handle/ENS name/truncated address, secondary info (e.g., followers, wallet balance), and an external link icon.
    -   **Projects Tab:**
        -   Lists user's projects.
        -   **Project Item (Card):** Icon (GitHub for repo, FileCode for contract), project name, ecosystem badge (e.g., "Base"), and an external link icon.
        -   For GitHub repos with contributors: Display a **Facepile** component (max 3 visible PFPs, then "+X others" text, or "X contributors" if total ≤ 3).
    -   **Rewards Tab:**
        -   Chronological list of rewards: Date, Rank, Reward amount, Sponsoring platform.
-   **Profile Modal (Draggable Bottom Sheet):**
    -   Used when viewing another user's profile (from Search or Leaderboard).
    -   Displays the Profile Page structure within this modal, occupying most of the screen height (e.g., 95vh).

### 4. Settings Page

-   Organized into sections with clear titles.
-   **Connect Accounts Section:**
    -   Lists connectable/connected accounts.
    -   **Social Account Item (Card):** Icon, type. If connected: user's handle. If not: "Verify ownership" as secondary text. "Connect" (primary black button) or "Disconnect" (outline button).
    -   **Wallet Account Item (Card):** Icon. Primary text: ENS name or truncated address. Secondary text: "Public"/"Private" status. If disabled: "Disabled" appended, card has reduced opacity.
        -   Light blue "Primary" badge if applicable.
        -   Three-dot (MoreHorizontal) icon opens a **Wallet Menu Modal**.
    -   "Add New Wallet" button (Plus icon, outline style).
-   **Wallet Menu Modal (Draggable Bottom Sheet):**
    -   List of actions, each with an icon on the right:
        -   "Copy address" (Copy icon).
        -   "Set primary" (Star icon - only if not already primary).
        -   "Make private" / "Make public" (EyeOff / Eye icon).
        -   "Disable" / "Enable" (PowerOff / Power icon).
-   **Human Verification Section:**
    -   Lists verification methods (e.g., "Coinbase Verified Account").
    -   Each item (Card): Method name, "Verified" badge or "Verify" button.
-   **Reward Boosts Section:**
    -   Lists available/active boosts.
    -   Each item (Card): Boost name (e.g., "$TALENT Staker"), sponsor badge(s) (e.g., "Talent"), boost percentage (e.g., "+20% boost" - text color indicates eligibility), eligibility status badge ("Eligible"/"Not Eligible").
-   **Email Section:**
    -   Input field for email, helper text, "Update email" button (primary black).
-   **Notifications Section:**
    -   Checkboxes for "Marketing email notifications" and "In-app notifications for builders," each with descriptive text.
    -   "Save settings" button (outline style).
-   **Delete Account Section:**
    -   Descriptive text on consequences.
    -   "Delete Account" button (destructive red).
