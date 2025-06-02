# Builder Score Mini App - Development Plan

## What We're Building

A mini app that shows your Builder Score with clear Builder Rewards eligibility criteria.

## App Flow

1. User opens mini app → Get wallet address from Farcaster context
2. Display Builder Score and Builder level prominently
3. Show Builder Rewards eligibility with 3 interactive checkboxes
4. Display friends leaderboard below eligibility section

## Core Features

- Display user's Builder Score and level (1-6)
- Interactive Builder Rewards eligibility checklist with action buttons
- Friends leaderboard ranked by Builder Score
- Wallet connection, GitHub OAuth, and external linking

## Build Steps

### Step 1: User Profile Display

- [x] Get all wallet addresses with the user FID using Neynar API
- [x] Fetch and display Builder Score and level from Talent Protocol API
- [x] Create visual level indicator component
- [x] "Add app" button
- [x] Send welcome notification with score

### Step 2: Friends Leaderboard

- [ ] Fetch user's Farcaster friends list
- [ ] Get Builder Scores for each friend
- [ ] Create leaderboard component with user position highlighted
- [ ] Add smooth loading animation for friend data


### Step 3: Eligibility Checklist

- [ ] Create three-checkbox eligibility component
- [ ] Builder Score > 40 check with "Connect Wallet" button (using MiniKit)
- [ ] Human checkmark check with "Verify Identity" link to Talent Protocol
- [ ] GitHub account check with OAuth button
- [ ] Check if user added the mini app (and include button if they haven't)
- [ ] Style each checkbox with clear pass/fail indicators



## APIs & Integrations

- **Farcaster Context**: Get wallet address automatically on app load
- **Talent Protocol API**: Fetch Builder Score, human verification, GitHub status
- **MiniKit Wallet**: Connect wallet functionality (existing code)
- **GitHub OAuth**: Connect GitHub account to improve score
- **External Links**: Deep link to Talent Protocol verification


## Technical Notes

- Use Farcaster context for automatic wallet detection
- Cache friend scores to avoid repeated API calls
- Handle cases where friends don't have Builder Scores
- Make action buttons prominent and clear
- Ensure all external links open properly in frame context
