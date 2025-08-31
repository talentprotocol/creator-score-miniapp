# Rewards Opt-in QA Checklist (5-min)

## Setup (30 sec)
- [ ] Login with top 200 account
- [ ] Navigate to `/leaderboard`

## Core Functionality (3 min)

### Modal Display
- [ ] **Top 200 user**: Modal auto-opens ✅
- [ ] **Non-top 200**: Modal doesn't show ✅
- [ ] **Already decided**: Modal doesn't show ✅

### Decision Flow
- [ ] Click "Keep My Rewards" → Wallet selection appears ✅
- [ ] Select wallet → API call succeeds ✅
- [ ] Refresh page → Modal doesn't reappear ✅

### Opt-out Flow
- [ ] Click "Pay It Forward" → Settings page opens ✅
- [ ] Complete opt-out → Decision saved ✅
- [ ] Refresh → Shows "PAID FORWARD" badge ✅

## Quick Edge Cases (1.5 min)

### Mobile
- [ ] Mobile view: Bottom sheet opens ✅
- [ ] Touch interactions work ✅

### Errors
- [ ] Network failure: Error message shows ✅
- [ ] No wallets: Appropriate fallback ✅

## Pass/Fail
- ✅ **PASS**: All core flows work, decisions persist, mobile OK
- ❌ **FAIL**: Modal shows wrong users, API fails, mobile broken

## Notes
- Test with different user types (top 200, non-top 200, decided)
- Focus on happy path + critical edge cases
- Skip detailed UI testing - focus on functionality
