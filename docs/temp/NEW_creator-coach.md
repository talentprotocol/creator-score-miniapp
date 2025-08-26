# Creator Coach: What Should You Do Next?

## Context
You're implementing a "Creator Coach" feature for the Creator Score app that suggests actionable steps to help creators improve their scores. The app follows strict client-server separation architecture.

## Feature Requirements

### Core Functionality
Create a system that analyzes a user's Creator Score credentials and suggests all possible actions they can take to improve their score, sorted by impact. Each suggestion should show:
- Specific action (e.g., "Publish 2 more Mirror articles")
- Potential point gain (e.g., "+4 points")

### Future Features (Not for Stage 1)
- Dismissible suggestions with Supabase persistence
- UI component with just Top 3 suggestions

### Data Sources
1. **User credentials**: Existing Talent API endpoint `/api/talent/credentials`
2. **Action rules**: Google Sheets at https://docs.google.com/spreadsheets/d/1EjSzlFgUxJBFGvyhYv5J7m8mq9J0RBgK25KVKRDEdkQ/edit?gid=430316217#gid=430316217

Sheet columns: `credential_slug`, `effort_level`, `action_template`, `is_active`

## Staged Implementation

### Stage 1 (Current Priority)
- Show ALL suggestions sorted by impact for validation
- Static data integration (import sheet as JSON)
- Basic calculation algorithm
- Simple UI display

### Stage 2 (Future)
- Top 3 filtering
- Dismissible suggestions
- Supabase user_preferences integration

## Technical Architecture (Review and Improve These Suggestions)

**Current Pattern**: Client Hook → API Route → Service → External Data

**Suggested approach** - please review and optimize:

1. **Service Layer** (`app/services/nextStepsService.ts`):
   - Import action rules as static JSON to minimize external dependencies
   - Calculate mathematical gaps using existing credential data structure
   - Apply impact scoring based on effort_level mapping
   - Return ALL suggestions sorted by impact (for Stage 1 validation)

2. **API Route** (`app/api/next-steps/route.ts`):
   - Accept talent_uuid as the canonical user identifier
   - Reuse existing credential fetching logic where possible
   - Call NextStepsService with user's credential data

3. **Hook** (`hooks/api/useNextSteps.ts`):
   - Follow existing hook patterns in the codebase
   - Standard `{data, loading, error}` interface
   - Consider if existing caching patterns can be reused

4. **Component Integration**:
   - Extend existing profile/score UI components where logical
   - Minimize new component creation by leveraging existing patterns

**Question for you to consider**: Can we integrate this into existing profile pages rather than creating entirely new components?

## Algorithm Implementation (Review and Optimize)

**Suggested mathematical approach** - please validate:

```typescript
function calculateNextMilestone(currentPoints: number, maxPoints: number): number {
  // For Stage 1: try multiple milestone targets (2, 5, 10 points)
  // Return the most reasonable next target
  const thresholds = [
    Math.ceil(currentPoints + 2),
    Math.ceil(currentPoints + 5), 
    Math.ceil(currentPoints + 10),
    maxPoints
  ];
  return thresholds.find(t => t > currentPoints && t <= maxPoints) || maxPoints;
}
```

**Consider**: Should we calculate multiple milestone options per credential to give users choice?

**Impact scoring approach**:
```typescript
const effortScores = {
  'low': 0.9,
  'medium': 0.6, 
  'high': 0.3,
  'impossible': 0.0
};

function calculateImpactScore(pointGain: number, effortLevel: string): number {
  return pointGain * effortScores[effortLevel];
}
```

**Question**: Does this scoring approach align with the existing app's scoring philosophy?

## Data Integration (Review This Approach)

**Suggested data handling**:
1. Export Google Sheet to JSON file in `/lib/data/next-steps-rules.json`
2. Import statically to avoid runtime dependencies
3. Structure as `Record<credential_slug, RuleConfig>`

**Alternative consideration**: Could we extend the existing Talent API response to include action suggestions server-side?

**Template processing**:
```typescript
function processActionTemplate(template: string, valueNeeded: number, pointGain: number): string {
  return template
    .replace('{value_needed}', formatNumber(valueNeeded))
    .replace('{point_gain}', pointGain.toString());
}
```

**Review needed**: How does this integrate with existing formatting utilities in the app?

## UI Implementation

**Suggested integration points** - please evaluate:
- Add to existing profile page as new section
- Reuse existing card/list components from leaderboard or score breakdown
- Follow existing loading states and error patterns

**Display format**:
- Action text (processed template)
- Point gain indicator
- Sort by impact score (highest first)
- Show all suggestions in Stage 1

## Success Metrics
Add PostHog events following existing patterns:
********

## Critical Questions to Address

1. **Architecture**: Can we reuse more existing code instead of creating new services?
2. **Data Flow**: Should this integrate with existing credential caching?
3. **UI Placement**: Where in the existing app flow does this fit best?
4. **Performance**: How can we minimize computational overhead?
5. **Validation**: What's the simplest way to test calculation accuracy?

## Implementation Principles
- Minimize code changes by extending existing patterns
- Reuse existing utilities, components, and API patterns wherever possible
- Focus on core calculation logic first
- Validate algorithm with real credential data before expanding features

The goal is to create actionable suggestions that help creators understand their next steps while integrating seamlessly with existing app architecture.