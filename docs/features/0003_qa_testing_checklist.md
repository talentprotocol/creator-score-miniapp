# **QA Testing Checklist - Rewards Opt-Out Feature**

## **🔍 Visual & UI Testing**
- [X] Navigate to `/leaderboard` - verify "Pay It Forward" callout appears (green, HandHeart icon)
- [X] Click callout - verify redirects to `/settings?section=pay-it-forward`
- [X] Check settings page - verify "Pay It Forward" section auto-expands
- [X] Verify HandHeart icon uses brand green color (not hardcoded lime)

## **⚙️ Settings Flow Testing**
- [X] In settings, verify current rewards amount displays correctly
- [X] Click "Confirm and Pay It Forward" button
- [X] Verify checkbox enables the button (no separate confirmation modal)
- [X] Submit opt-out - verify success state and page refresh
- [X] Test error handling - verify error messages display properly
- [X] Test success state - verify success message appears before refresh
- [X] Verify API call includes required confirm_optout field

## **🎯 Pay It Forward Section Testing**
- [X] Navigate to `/settings?section=pay-it-forward` - verify section expands automatically
- [X] Check initial state - description, current rewards display, checkbox, and button
- [X] Verify checkbox enables/disables the action button
- [X] Test opt-out flow - click button with confirmation
- [X] Verify success state shows green success message
- [X] Verify form is disabled after successful opt-out
- [X] Verify no page refresh occurs after success
- [X] Check that leaderboard data refreshes automatically after opt-out

## **🏆 Leaderboard Badge Testing**
- [X] Check MyRewards section - verify "PAY FORWARD" badge appears for opted-out users
- [X] Verify badge uses green brand colors (not hardcoded)
- [X] Check leaderboard entries - verify OptOut badge (green HandHeart) appears
- [X] Verify OptOut badge takes precedence over Boost badge
- [X] Check crossed-out rewards text uses brand green color
- [X] Verify leaderboard updates immediately after opt-out (no manual refresh needed)

## **💰 Rewards Calculation Testing**
- [X] Verify rewards calculation includes boost multiplier (1.1x for 100+ TALENT holders)
- [X] Verify opted-out users' boosted scores contribute to redistribution pool
- [X] Verify remaining eligible users get proportionally larger rewards
- [X] Verify opted-out users show crossed-out reward amount (not $0)
- [X] Verify reward amounts update correctly when opt-out status changes

## **🔄 Integration Testing**
- [X] Test complete flow: callout → settings → opt-out → leaderboard display
- [X] Verify database updates correctly store opt-out preference
- [X] Verify no console errors during testing
- [X] Verify success feedback before page refresh
- [ ] Test API endpoints return proper responses

## **🎨 Design System Testing**
- [ ] Confirm all colors use semantic brand classes (no hardcoded Tailwind)
- [ ] Verify consistent spacing and typography

## **✅ Updated Component Details**
- **Component Name**: `PayItForwardSection` (was `RewardsDistributionSection`)
- **Section Title**: "Pay It Forward" (was "Rewards Distribution")
- **Section ID**: `pay-it-forward` (was `rewards-distribution`)
- **Navigation Path**: `/settings?section=pay-it-forward`
- **Button Text**: "Confirm and Pay It Forward" (was "Opt Out of Rewards")
- **No Confirmation Modal**: Direct opt-out flow with checkbox
- **No Eligibility Restrictions**: Everyone can opt out regardless of rank
