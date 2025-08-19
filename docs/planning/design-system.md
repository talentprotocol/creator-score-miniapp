# Creator Score Mini App - Design System

## Core Principles

### 1. Semantic-First Approach
- **Default to semantic classes** (`text-foreground`, `bg-muted`, `border-border`) for theme consistency
- **Avoid hardcoded colors** unless for specific brand moments

### 2. Mobile-First Design
- **Touch interactions only** - no hover states on mobile
- **Bottom sheets** for modals on mobile, centered dialogs on desktop
- **Responsive breakpoint**: `640px` (sm+)

### 3. Minimal & Elegant
- **Smaller, thinner fonts** with more white space
- **Consistent spacing** using established patterns
- **Clean, uncluttered interfaces**

## Color System

### Semantic Colors (Default)
- **Background**: `bg-background` / `bg-muted`
- **Text**: `text-foreground` / `text-muted-foreground`
- **Borders**: `border-border`

### Brand Colors
- **Primary**: Tailwind purple-700  #7e22ce 
- **Secondary**: 
  - Tailwind lime-600 #84cc16
  - Tailwind cyan-600 #0e7490 
  - Tailwind pink-600 #be185d


### Usage Rules
1. **Start with semantic classes** for all standard UI
2. **Use brand colors only** for:
   - Rewards and earnings
   - Primary CTAs
   - Data visualization (SegmentedBar, PostsChart)
   - Brand identity moments

### Brand Accent System (core)
- **Token**: Tailwind `brand-purple` color maps to `hsl(var(--creator-purple))`.
- **Defaults**: Brand colors are now explicit variants: `brand-purple`, `brand-green`, `brand-blue`, `brand-pink`.
- **Override**: Use explicit variant props instead of dynamic accent system.
- **Utilities**: Use `text-brand`, `bg-brand/10`, `bg-brand/20`, `hover:bg-brand/30` for washes and states.
- **Components**: Brand variants accept `color?: 'purple'|'green'|'blue'|'pink'` to set the accent per instance.

## Component Patterns

### Cards
**Base Pattern**: All cards use the foundational `Card` component with semantic styling.

**Variants**:
- **Content Cards**: Standard `bg-card` with border and shadow
- **Muted Cards**: `bg-muted` with `border-0 shadow-none` for subtle sections
- **Interactive Cards**: Add hover states and click handlers

**Common Patterns**:
- **Stat Cards**: Title/value pairs with optional click handlers
- **List Cards**: Avatar lists with rankings or data
- **Progress Cards**: Score displays with progress visualization
- **Accordion Cards**: Expandable content sections

### Buttons
**Base Button**: Standard semantic variants with consistent sizing
**ButtonFullWidth**: Section-level actions with required icons and left alignment

### Callouts & Carousel
- **Callout variants**: `brand` and `muted`. Brand reads `text-brand`/`bg-brand/20`.
- **Accent control**: Set per-instance via explicit variant props (`brand-purple|brand-green|brand-blue|brand-pink`).
- **Typography**: Title = `size="base"` + `weight="medium"` (brand color for `brand`, default otherwise). Description = `size="sm"`, `color="muted"`. Left-aligned.
- **Icons**: Left icon uses brand accent for `brand`, `text-foreground` for `muted`. Right arrow/close `X` are `text-muted-foreground`.
- **Interactivity**: Entire callout clickable when `href` is set. If `onClose` is present, close takes priority but the rest remains clickable.
- **Dismissal**: Season-aware persistence in `localStorage` using a round-specific key.
- **CalloutCarousel**: Mobile-first horizontal snap (`snap-x snap-mandatory`), one slide per viewport, hides scrollbar, aligns with page padding (no negative margins), disables overflow when single item.

### Interactive States
- **Hover**: `hover:bg-muted/50` for non-card elements
- **Active**: Semantic color variants
- **Disabled**: `opacity-50 cursor-not-allowed`
- **Loading**: Consistent skeleton patterns

## Layout Standards

### Page Structure
**All pages use `PageContainer` + `Section` components for consistent layout and spacing.**

**Single Pattern (All Pages):**
```tsx
<PageContainer>
  <Section variant="header">Title & context</Section>
  <Section variant="full-width">Tabs/dividers (edge-to-edge)</Section>
  <Section variant="content">Main content</Section>
</PageContainer>
```

**Section variants handle all padding:**
- **`header`**: `px-4 pt-6 pb-3` - Page titles and context
- **`content`**: `px-4 py-4` - Main content with padding
- **`full-width`**: `w-full` - Edge-to-edge elements (tabs, dividers)

**PageContainer provides:**
- **Layout structure**: `min-h-screen` + `overflow-y-auto` + `relative`
- **Max-width constraint**: `max-w-xl` (576px) for consistent mobile design
- **Responsive bottom spacing**: `pb-4` (desktop) + `md:pb-24` (mobile)
- **No horizontal padding**: Section variants handle all content spacing

### Spacing Scale
- **Large**: `mb-6 sm:mb-8`
- **Default**: `mb-4 sm:mb-6`
- **Compact**: `mb-3 sm:mb-4`
- **Internal**: `p-4 sm:p-6` (regular), `p-3 sm:p-4` (compact)

### Z-Index Hierarchy
- **Content**: 0-10
- **Header**: 30
- **Navigation**: 40
- **Modals**: 50

## Typography

### Typography Component
The `Typography` component provides consistent text styling across the app using semantic classes and the established design system.

**Usage:**
```tsx
import { Typography } from "@/components/ui/typography";

// Basic usage
<Typography>Default body text</Typography>

// With variants
<Typography size="xs" weight="medium" color="muted">
  Small, medium weight, muted text
</Typography>

// As different elements
<Typography as="h1" size="xl" weight="bold">
  Page heading
</Typography>
```

**Available Variants:**
- **Size**: `xs`, `sm`, `base`, `lg`, `xl`, `2xl`
- **Weight**: `light`, `normal`, `medium`, `bold`
- **Color**: `default`, `muted`, `brand`
- **Element**: `p`, `span`, `div`, `h1`-`h6`

> **Note**: The Typography component (`components/ui/typography.tsx`) is the single source of truth for all typography values. Refer to the component implementation for the complete list of available options.

### Guidance

- Always use `components/ui/typography.tsx` to set typography variants (size, weight, color) in components and pages. Avoid ad‑hoc Tailwind text classes for text styling to maintain semantic, theme-safe consistency.

### Typography Principles
- **Semantic Colors**: Use `default`, `muted`, or `brand` colors for consistent theming
- **Responsive Sizes**: Most sizes include responsive variants (e.g., `text-sm sm:text-[15px]`)
- **Element Semantics**: Use appropriate HTML elements (`h1`-`h6` for headings, `p` for paragraphs)
- **Consistent Spacing**: Typography components work with the established spacing scale

### Component Integration
**Callout Component**: Updated to use children composition instead of `textSize` prop:
```tsx
// ✅ GOOD: Use Typography component for text styling
<Callout variant="brand" href="/settings">
  <Typography size="xs">Connect accounts to increase your Creator Score</Typography>
</Callout>

// ✅ GOOD: Direct children for simple text
<Callout variant="neutral">
  Simple text without special styling
</Callout>
```

### Migration Guide
**From `textSize` prop to `Typography` component:**

```tsx
// ❌ OLD: Using textSize prop
<Callout variant="brand" textSize="xs">
  Connect accounts to increase your Creator Score
</Callout>

// ✅ NEW: Using Typography component
<Callout variant="brand">
  <Typography size="xs">
    Connect accounts to increase your Creator Score
  </Typography>
</Callout>
```

**Benefits of the new approach:**
- **Flexibility**: Easy to add bold, different colors, or other typography variations
- **Composability**: Combine any typography variant with any callout variant
- **Reusability**: Typography component can be used anywhere, not just in callouts
- **Maintainability**: Changes to typography don't require changes to layout components
- **Separation of concerns**: Callout handles layout/styling, Typography handles text styling

## Data Visualization

### SegmentedBar
- **Colors**: Brand colors only (`purple`, `green`, `blue`, `pink`)
- **Usage**: `green` for earnings, `pink` for followers, `blue` for posts, `purple` for score

### PostsChart
- **Colors**: Brand colors cycling through years
- **Pattern**: `purple-500` → `green-500` → `blue-500` → `pink-500`

## Icon System

### Sizes
- **Large**: 24px (navigation)
- **Medium**: 18px (engagement)
- **Small**: 14px (indicators)

### States
- **Default**: `text-muted-foreground stroke-[1.5]`
- **Active**: `text-foreground stroke-2`
- **Disabled**: `opacity-20`

### Interactions
- **Click effect**: Scale + stroke weight change
- **No hover states** (mobile-first)

## Loading & Error States

### Loading Patterns
- **Skeleton loaders** with `animate-pulse`
- **Progress indicators** for complex operations
- **Consistent messaging** across all components

### Error Handling
- **Graceful fallbacks** with helpful messaging
- **Retry mechanisms** where appropriate
- **No crashes** - always show something

## Accessibility

### Focus Management
- **Visible focus rings** with `focus-visible:ring-2`
- **Proper tab order** and keyboard navigation
- **Screen reader support** with `aria-*` attributes

### Color Contrast
- **WCAG AA compliance** for all text combinations
- **Semantic color usage** ensures proper contrast

## Animation Guidelines

### Transitions
- **Page transitions**: `animate-in fade-in duration-300`
- **Modal animations**: `slide-in-from-bottom` (mobile), `zoom-in` (desktop)
- **Interactive feedback**: `active:scale-95` for buttons

### Performance
- **Hardware acceleration** for smooth animations
- **Reduced motion** support for accessibility
- **Consistent timing** across all interactions

## Modal Backdrop (Blurred Scrim)

### Shared Pattern
- **Overlay utility**: `.modal-overlay`
- **Default styles**: `bg-black/70 backdrop-blur-sm` with fade in/out via data state classes.
- **Scope**: Applied to both `Dialog` (desktop) and `Drawer` (mobile) overlays for uniform feel.

### Usage
- The utility is defined in `app/theme.css` and used by `components/ui/dialog.tsx` and `components/ui/drawer.tsx`.
- To customize per-use, pass `className` to `DialogOverlay` or `DrawerOverlay` and compose with `modal-overlay`.

### Guidance
- **Subtle by default**: stick with `backdrop-blur-sm` and `bg-black/70` for performance and clarity.
- **Performance note**: backdrop blur can impact low-end devices; avoid increasing blur strength globally.
- **No background scaling**: Drawers do not scale the background by default.

## Component Decision Tree

### When to Create New Components
1. **Reused 3+ times** across different contexts
2. **Complex interaction patterns** that need abstraction
3. **Consistent visual patterns** that vary only in data

### When to Use Existing Components
1. **Standard patterns** (cards, buttons, lists)
2. **Minor variations** can be handled with props
3. **Consistent behavior** across the app

### When to Use Semantic Classes
1. **Simple styling** that doesn't need abstraction
2. **One-off variations** of existing components
3. **Layout and spacing** patterns 