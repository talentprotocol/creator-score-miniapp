# Creator Score Mini App - Design System

## Color System

### Background
- **App Background:** `#ffffff` (white) via `bg-background` / `bg-white`

### Neutrals & Grays
- **Text (foreground):** `#111111` → `text-gray-900` / `text-foreground`
- **Secondary text:** `#999999` → `text-gray-400` / `text-muted-foreground`
- **Background sections:** `#FAFAFA` → `bg-gray-50` / `bg-muted`
- **Borders:** `#d5d5d5` → `border-gray-300` / `border-border`

**Dark Mode:**
- **Background:** `#111111` → `bg-gray-900`
- **Text:** `#fafafa` → `text-gray-50`
- **Secondary text:** `#a3a3a3` → `text-gray-400`
- **Borders:** `#262626` → `border-gray-800`

### Brand Colors
- **Primary:** Purple `#8E7BE5` - rewards, key features, primary brand moments
- **Secondary:** Green `#EBF4B4`, Blue `#82DEED`, Pink `#E879C7` - data visualization, accents

### Usage Patterns

**1. Default to Semantic Classes:**
```tsx
<div className="bg-background text-foreground border-border">
<p className="text-muted-foreground">Secondary text</p>
```

**2. Brand Moments:**
```tsx
<div className="bg-purple-50">Primary brand element</div>
<div className="border-purple-200 bg-purple-50 text-purple-700">Brand callouts</div>
```

**3. Data Visualization:**
- **SegmentedBar colors:** `purple`, `green`, `blue`, `pink` (via `color` prop)
- **PostsChart colors:** Cycles through `purple-500`, `green-500`, `blue-500`, `pink-500`

## Component Patterns

### Buttons
- **Default (Outline):** `border-input hover:border-gray-400` - Most actions
- **Special:** `bg-purple-100 text-purple-700 hover:bg-purple-200` - Primary/important actions
- **Destructive:** `bg-red-100 text-red-700 hover:bg-red-200` - Dangerous actions

### Cards
- Default: `bg-card` with `border` and `shadow`
- Muted sections: `bg-muted` with `border-0 shadow-none`

### Loading States
- Skeleton: `bg-muted animate-pulse` 
- Consistent patterns across all data components

### Responsive Modals
- Mobile: Bottom sheets via `Drawer` component
- Desktop: Centered dialogs via `Dialog` component  
- Breakpoint: `640px` (sm+)

## Layout Standards

### Page Layout Pattern

Every page follows a consistent layout pattern using the `PageContainer` and `Section` components:

```tsx
<PageContainer noPadding>
  {/* Header section with padding */}
  <Section variant="header">
    <h1 className="text-xl font-semibold">Page Title</h1>
    <p className="text-sm text-muted-foreground">Description</p>
    {/* Other header content (search, stats, etc.) */}
  </Section>

  {/* Optional: Full width sections (tabs, media) */}
  <Section variant="full-width">
    <TabContainer /> {/* or other full-width content */}
  </Section>

  {/* Content section with padding and animation */}
  <Section variant="content" animate>
    <div>
      {/* Main content */}
    </div>
  </Section>
</PageContainer>
```

#### Key Characteristics:

1. **Container Strategy**
   - `PageContainer` with `noPadding` to allow full-width sections
   - Maximum width of `max-w-xl` (576px) enforced by container
   - Bottom padding (`pb-24`) for navigation clearance

2. **Section Types**
   - Header sections: `px-4 py-6` with title and contextual content
   - Full-width sections: No padding, spans entire container width
   - Content sections: `px-4 py-6` with optional animation

3. **Section Spacing**
   - Header sections: `px-4 pt-6 pb-3` (24px top, 12px bottom)
   - Content sections: `px-4 py-4` (16px top and bottom)
   - Full-width sections: No padding, spans entire container width
   - Content-specific spacing handled within sections

4. **Transitions**
   - Tab content changes use subtle zoom and fade animation
   - Duration: 300ms with ease-out timing
   - Classes: `animate-in fade-in zoom-in-98 duration-300 ease-out`

### Component Spacing

```tsx
// Vertical margins between components
className="mb-6 sm:mb-8"        // Large
className="mb-4 sm:mb-6"        // Default
className="mb-3 sm:mb-4"        // Compact

// Internal padding
className="p-4 sm:p-6"          // Regular
className="p-3 sm:p-4"          // Compact

// Flex/Grid spacing
className="gap-3 sm:gap-4"      // Default grid/flex gap
```

### Mobile Considerations
- Bottom padding for navigation: Handled by PageContainer (`pb-24`)
- Safe area insets: `pb-safe` for bottom nav component
- Backdrop blur: `bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60`
- Mobile-first breakpoints: `md:hidden` for bottom nav

### Z-index Scale
```tsx
// Base content: 0-10
.content { z-index: 0 }

// Header (sticky): 30
.header { z-index: 30 }

// Bottom nav (fixed): 40
.bottom-nav { z-index: 40 }

// Modals/overlays: 50 (highest)
.modal { z-index: 50 }
```

### Section Component Usage

The `Section` component encapsulates our layout patterns:

```tsx
// Header sections
<Section variant="header">
  <h1>Title</h1>
  <p>Description</p>
</Section>

// Full-width sections
<Section variant="full-width">
  <TabContainer />
</Section>

// Content sections with animation
<Section variant="content" animate>
  {content}
</Section>
```

**Key Features:**
- Consistent padding through variants
- Optional content animation
- Handles common layout patterns
- Maintains spacing consistency

### Loading & Error States
```tsx
// Loading state
<div className="flex-1 flex items-center justify-center min-h-[200px]">
  <div className="text-center space-y-4">
    <div className="animate-spin">...</div>
    <p className="text-sm text-muted-foreground">Loading...</p>
  </div>
</div>

// Error state
<div className="rounded-xl border bg-card p-6 space-y-4">
  <h2 className="text-lg font-semibold">Something went wrong</h2>
  <p className="text-sm text-muted-foreground">{error.message}</p>
  <Button onClick={reset} variant="outline" size="sm">Try Again</Button>
</div>
```

### Interactive States
- **Hover:** `hover:bg-muted/50` for non-card elements
- **Active:** Semantic color variants (`text-primary` for active nav)
- **Disabled:** `opacity-50 cursor-not-allowed`

### Accessibility
- **Focus rings:** `focus-visible:ring-2 focus-visible:ring-primary`
- **Screen reader:** Proper `aria-label`, `aria-current` usage
- **Color contrast:** All combinations meet WCAG standards

### Animation
```tsx
// Interactions
className="transition-all duration-200 active:scale-95"  // Buttons

// Page transitions
className="animate-in fade-in duration-300"

// Bottom sheet
className="animate-in slide-in-from-bottom duration-300"

// Loading states
className="animate-pulse"  // Skeletons
```

## Typography
- **Font:** Geist (Google Fonts)
- **Type Scale:**
  ```tsx
  // Base text (14px mobile, 15px desktop)
  <p className="text-sm sm:text-[15px] font-light">Body text</p>
  
  // Secondary text (13px mobile, 14px desktop)
  <p className="text-xs sm:text-sm text-muted-foreground font-light">Secondary text</p>
  
  // Headings
  <h1 className="text-xl sm:text-2xl font-normal">Page Title</h1>
  <h2 className="text-lg sm:text-xl font-normal">Section Title</h2>
  <h3 className="text-base sm:text-lg font-medium">Subsection</h3>
  
  // Micro text (12px)
  <span className="text-xs font-light">Labels, metadata</span>
  ```

## Spacing & Layout
- **Container max-width:** `max-w-xl` (576px)

### Component Spacing
```tsx
// Vertical margins between sections
className="mb-6 sm:mb-8"        // Large
className="mb-4 sm:mb-6"        // Default
className="mb-3 sm:mb-4"        // Compact

// Internal padding
className="p-4 sm:p-6"          // Regular
className="p-3 sm:p-4"          // Compact

// Flex/Grid spacing
className="gap-3 sm:gap-4"      // Default grid/flex gap
```

- **Safe areas:** Handled via `pb-safe` and `env(safe-area-inset-bottom)`

## Interactive States
- **Hover:** `hover:bg-muted/50` for non-card elements
- **Active:** Semantic color variants (`text-primary` for active nav)
- **Disabled:** `opacity-50 cursor-not-allowed`

## Accessibility
- **Focus rings:** `focus-visible:ring-2 focus-visible:ring-primary`
- **Screen reader:** Proper `aria-label`, `aria-current` usage
- **Color contrast:** All combinations meet WCAG standards

## Animation
```tsx
// Interactions
className="transition-all duration-200 active:scale-95"  // Buttons

// Page transitions
className="animate-in fade-in duration-300"

// Bottom sheet
className="animate-in slide-in-from-bottom duration-300"

// Loading states
className="animate-pulse"  // Skeletons
```

## Component Specific Guidelines

### SegmentedBar
- **Colors:** Always use brand colors (`purple`, `green`, `blue`, `pink`)
- **Intensities:** Automatically cycles through 600→500→400→300→200→100
- **Usage:** `green` for earnings, `pink` for followers, `blue` for posts, `purple` for score

### PostsChart  
- **Colors:** Brand colors only - `purple-500`, `green-500`, `blue-500`, `pink-500`
- **Cycling:** Modulo 4 for year differentiation

### Navigation
- **TabNavigation:** Uses semantic classes for consistent theming
- **BottomNav:** Brand-specific styling with semantic color integration

### Forms & Inputs
- **Search:** Consistent `Input` component with proper placeholder styling
- **Buttons:** Semantic variants with proper disabled/loading states 

## Icon System

### Sizes
- `lg`: 24px - Navigation
- `md`: 18px - Engagement (likes, comments)
- `sm`: 14px - Small indicators

### States
- Default: `text-muted-foreground stroke-[1.5]`
- Active: `text-foreground stroke-2`
- Disabled: `text-muted-foreground stroke-[1.5] opacity-20`

### Interactions
- Click effect: Scale up + stroke weight change
- No hover states (mobile first)

### Colors
- Primary: `text-foreground`
- Muted: `text-muted-foreground`
- Brand: `text-purple-500` (reserved for special moments)
- Error: `text-destructive`

### Loading
- Default spinner with outer track (25% opacity) and inner spinner (75% opacity)

## Typography
// ... rest of the design system stays the same ... 

### Callouts
```tsx
// Static
<Callout>Message</Callout>

// Internal navigation (with arrow)
<Callout href="/path">Navigate</Callout>

// External link (with external icon)
<Callout href="https://...">External</Callout>
```

**Styling:**
- Base: `bg-purple-100 text-purple-700`
- Interactive: `hover:bg-purple-200` + icon
- Icons: `ArrowRight` (internal), `ExternalLink` (external)