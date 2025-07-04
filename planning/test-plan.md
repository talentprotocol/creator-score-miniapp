# Creator Score Miniapp - Comprehensive Test Plan

## Overview
This test plan covers all changes made during the architectural migration from direct API calls to hook-based data fetching. We need to verify feature parity, performance improvements, and ensure no regressions.

---

## 🎯 Critical Path Testing

### 1. Profile System (Top Priority)
**Components Changed**: ProfileScreen, ProfileHeader, ProfileTabs, AccountCard, StatCard, AccountGrid, MinimalProfileDrawer

#### A. Profile Page Loading
- [ ] **Profile by Username**: Navigate to `/username` → verify profile loads correctly
- [ ] **Profile by FID**: Navigate to `/123456` → verify profile loads correctly  
- [ ] **Profile by Wallet**: Navigate to `/0x123...` → verify profile loads correctly
- [ ] **Invalid Profile**: Navigate to `/nonexistent` → verify 404 handling

#### B. Profile Data Display
- [ ] **Header Section**: 
  - [ ] Avatar displays correctly
  - [ ] Display name and username show properly
  - [ ] Follower count formats correctly (e.g., "1.2K followers")
  - [ ] Total earnings display in ETH format
  - [ ] Wallet addresses truncate properly (e.g., "0x123...abc")

- [ ] **Stat Cards**:
  - [ ] Creator Score displays as number
  - [ ] Level badge shows correct level and name
  - [ ] Total Earnings matches header value
  - [ ] All cards show proper loading skeletons initially

- [ ] **Social Accounts Tab**:
  - [ ] All connected platforms display with correct icons
  - [ ] Platform names use centralized constants (PLATFORM_NAMES)
  - [ ] Account ages and follower counts format correctly
  - [ ] Click on accounts opens external links properly
  - [ ] Farcaster links use SDK actions

- [ ] **Score Breakdown Tab**:
  - [ ] Credentials load and display correctly
  - [ ] Score progress bars show proper percentages
  - [ ] Credential values format using `formatReadableValue`
  - [ ] External links work correctly with SDK
  - [ ] Loading states display skeleton components

#### C. Caching Behavior
- [ ] **5-minute Profile Cache**:
  - [ ] Navigate to profile → go to leaderboard → return to profile
  - [ ] Verify data loads instantly (cached)
  - [ ] Wait 6+ minutes → return to profile → verify fresh data fetch

- [ ] **30-minute Score Cache**:
  - [ ] Load profile score breakdown tab
  - [ ] Navigate away and return quickly → verify instant load
  - [ ] Check network tab for API call reduction

#### D. Error Handling
- [ ] **API Failures**: Mock API errors → verify Callout error messages display
- [ ] **Network Issues**: Test offline behavior → verify graceful degradation
- [ ] **Invalid Data**: Test with malformed API responses → verify error boundaries

---

### 2. Leaderboard System (High Priority)
**Components Changed**: LeaderboardPage, MinimalProfileDrawer

#### A. Leaderboard Loading
- [ ] **Initial Load**: Navigate to `/leaderboard` → verify top 10 entries load
- [ ] **User Score**: Verify current user's score displays in stats
- [ ] **Load More**: Click "Load More" → verify next 10 entries load correctly
- [ ] **Ranking**: Verify ranks increment correctly across pages (11, 12, 13...)

#### B. Leaderboard Data Display
- [ ] **Stat Cards**:
  - [ ] "Round Ends" countdown displays correctly (format: "Xd Yh")
  - [ ] "Total Rewards" shows "10 ETH"
  - [ ] "Min. Creator Score" loads from API
  - [ ] "Total Creators" loads from API
  - [ ] Loading skeletons display during initial load

- [ ] **User Pinned Entry**:
  - [ ] Current user appears at top with purple background
  - [ ] Rank shows correctly ("—" if not in top results, or actual rank)
  - [ ] User avatar, name, and score display correctly
  - [ ] ETH rewards calculate correctly (score × 0.00005588184343025108)

- [ ] **Leaderboard Entries**:
  - [ ] All entries show rank, avatar, name, score, rewards
  - [ ] Avatars fallback to initials when no image
  - [ ] ETH rewards format to 3 decimal places
  - [ ] Click on entry opens MinimalProfileDrawer

#### C. MinimalProfileDrawer Integration
- [ ] **Drawer Opening**: Click any leaderboard entry → drawer opens
- [ ] **Profile Data**: Verify drawer shows correct user's profile data
- [ ] **Hook Reuse**: Drawer should use cached data from profile hooks
- [ ] **Conditional Loading**: Data should only load when drawer is open

#### D. Pagination and Performance
- [ ] **Load More Behavior**: 
  - [ ] Button appears when hasMore = true
  - [ ] Button disabled during loading
  - [ ] Button disappears when no more data
  - [ ] Loading spinner shows during fetch

- [ ] **Caching**: 
  - [ ] First page cached for 5 minutes
  - [ ] Return to leaderboard → verify instant load
  - [ ] Stats cached separately from entries

---

### 3. Navigation System (Medium Priority)
**Components Changed**: Header, BottomNav

#### A. Navigation Consistency
- [ ] **Both Components**: Header and BottomNav show same navigation items
- [ ] **User Profile Link**: 
  - [ ] Shows when user has username/FID
  - [ ] Disabled/grayed when no user context
  - [ ] Links to correct user profile

- [ ] **Active States**: 
  - [ ] Current page highlighted correctly in both nav components
  - [ ] Active state styling consistent with design system

#### B. Responsive Behavior
- [ ] **Mobile (< 768px)**: 
  - [ ] Bottom nav visible and functional
  - [ ] Header nav icons hidden
  - [ ] Navigation works correctly

- [ ] **Desktop (≥ 768px)**:
  - [ ] Header nav icons visible and centered
  - [ ] Bottom nav hidden
  - [ ] Navigation works correctly

#### C. User Context Integration
- [ ] **With User**: Profile link enabled and shows correct username/FID
- [ ] **Without User**: Profile link disabled but other links work
- [ ] **User Changes**: Navigation updates when user context changes

---

## 🔄 Regression Testing

### 1. Existing Functionality Preservation
- [ ] **All Routes Work**: Verify all existing URLs still function
- [ ] **External Links**: GitHub, Twitter, LinkedIn profiles open correctly
- [ ] **Farcaster Integration**: SDK actions work for Farcaster-specific links
- [ ] **Mobile Layout**: Bottom nav, responsive design still works
- [ ] **Info Modal**: Help button in header opens info drawer correctly

### 2. Data Accuracy
- [ ] **Score Consistency**: Compare old vs new data fetching results
- [ ] **Profile Completeness**: Verify all profile fields still display
- [ ] **Social Accounts**: All platforms and data points preserved
- [ ] **Credential Details**: Score breakdowns match previous implementation

### 3. Performance Baseline
- [ ] **Initial Load Times**: Should be similar or better than before
- [ ] **Bundle Size**: Verify no significant bundle size increase
- [ ] **Memory Usage**: Check for memory leaks in caching layer
- [ ] **API Call Reduction**: Monitor network tab for fewer redundant calls

---

## 🚀 Performance Testing

### 1. Caching Effectiveness
- [ ] **Cache Hit Ratios**: 
  - [ ] Profile data: >80% hit rate for repeat visits
  - [ ] Score data: >90% hit rate within 30-minute window
  - [ ] Leaderboard: >80% hit rate for first page

- [ ] **Cache Invalidation**:
  - [ ] Profile cache expires after 5 minutes
  - [ ] Score cache expires after 30 minutes
  - [ ] Manual cache clear works if implemented

### 2. Loading Performance
- [ ] **Skeleton States**: All loading states show skeletons, not spinners
- [ ] **Progressive Loading**: Data appears as it becomes available
- [ ] **Error Recovery**: Failed requests don't block other data

### 3. Memory and Network
- [ ] **Memory Leaks**: Extended usage doesn't cause memory growth
- [ ] **API Efficiency**: Reduced total number of API calls
- [ ] **Network Waterfall**: No blocking requests in critical path

---

## 🧪 Edge Case Testing

### 1. Data Edge Cases
- [ ] **Empty Profiles**: Users with no social accounts or credentials
- [ ] **Large Numbers**: Scores/followers with very large values (>1M)
- [ ] **Special Characters**: Usernames with special characters
- [ ] **Missing Data**: Partial profile data, missing fields

### 2. Network Edge Cases
- [ ] **Slow Connections**: Test on throttled 3G network
- [ ] **Intermittent Failures**: Test with spotty network conditions
- [ ] **API Timeouts**: Test with very slow API responses
- [ ] **Rate Limiting**: Test rapid navigation/refresh scenarios

### 3. User Context Edge Cases
- [ ] **No User Context**: App behavior when not logged in to Farcaster
- [ ] **Invalid User**: Farcaster context with invalid/deleted user
- [ ] **User Context Changes**: Switching between different user contexts

---

## 🛠 Developer Experience Testing

### 1. Code Quality
- [ ] **TypeScript**: All components and hooks properly typed
- [ ] **ESLint**: No linting errors in changed files
- [ ] **Build Process**: `npm run build` completes successfully
- [ ] **Hot Reload**: Development server updates correctly

### 2. Hook Consistency
- [ ] **Return Patterns**: All hooks return `{ data, loading, error }`
- [ ] **Error Types**: Consistent error message formats
- [ ] **Loading States**: Consistent loading behavior across hooks

### 3. Component Interface
- [ ] **Props Validation**: All required props documented and typed
- [ ] **Default Values**: Sensible defaults for optional props
- [ ] **Error Boundaries**: Components handle hook errors gracefully

---

## 📱 Device-Specific Testing

### 1. Mobile Devices
- [ ] **iOS Safari**: All functionality works correctly
- [ ] **Android Chrome**: Navigation and data loading work
- [ ] **Touch Interactions**: Tap targets appropriate size
- [ ] **Viewport**: Content fits within mobile viewport

### 2. Desktop Browsers
- [ ] **Chrome**: Full functionality verification
- [ ] **Firefox**: Cross-browser compatibility
- [ ] **Safari**: macOS Safari testing
- [ ] **Responsive Design**: Test various screen sizes

---

## 🔍 Acceptance Criteria

### Must Pass (Blocking Issues)
- [ ] All profile pages load correctly for valid identifiers
- [ ] Leaderboard displays and pagination works
- [ ] Navigation between pages functions properly
- [ ] No JavaScript console errors
- [ ] Build process completes successfully

### Should Pass (High Priority)
- [ ] Caching reduces API calls noticeably
- [ ] Loading states improve perceived performance
- [ ] Error states display helpful messages
- [ ] All external links work correctly

### Nice to Have (Enhancement)
- [ ] Performance metrics show improvement
- [ ] Memory usage remains stable
- [ ] Developer experience improvements noted

---

## 🚨 Test Execution Strategy

### Phase 1: Core Functionality (Day 1)
1. Run Critical Path Testing for Profile and Leaderboard
2. Verify basic navigation works
3. Check for any obvious regressions

### Phase 2: Edge Cases and Performance (Day 2)
1. Execute edge case scenarios
2. Performance testing with network throttling
3. Cross-browser compatibility check

### Phase 3: Full Regression (Day 3)
1. Complete regression testing
2. Device-specific testing
3. Final acceptance criteria verification

### Test Environment Setup
- [ ] Local development environment
- [ ] Production-like staging environment
- [ ] Various device/browser combinations
- [ ] Network throttling tools configured

---

## 📋 Test Reporting

### For Each Test Item:
- **Status**: ✅ Pass / ❌ Fail / ⚠️ Issue
- **Notes**: Any observations or issues found
- **Screenshots**: For UI-related tests
- **Performance Data**: Load times, API call counts

### Critical Issues Require:
- Detailed reproduction steps
- Expected vs actual behavior
- Browser/device information
- Console logs and network data

This comprehensive test plan ensures our architectural migration maintains functionality while delivering the promised performance and maintainability improvements. 