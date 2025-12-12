# AppHub Design System

> A comprehensive design specification for ensuring visual consistency across all integrated applications.

---

## Table of Contents

1. [Overview](#overview)
2. [Technology Stack](#technology-stack)
3. [Design Tokens](#design-tokens)
4. [Color System](#color-system)
5. [Typography](#typography)
6. [Spacing & Layout](#spacing--layout)
7. [Border Radius](#border-radius)
8. [Shadows & Elevation](#shadows--elevation)
9. [Component Specifications](#component-specifications)
10. [Theming](#theming)
11. [Icons](#icons)
12. [Animation & Motion](#animation--motion)
13. [Responsive Design](#responsive-design)
14. [Accessibility](#accessibility)
15. [Implementation Guidelines](#implementation-guidelines)

---

## Overview

This design system defines the visual language for AppHub and all integrated applications. Following these guidelines ensures a cohesive user experience across the entire ecosystem.

### Design Principles

1. **Consistency** - All applications should feel like part of the same family
2. **Clarity** - Interface elements should be immediately understandable
3. **Efficiency** - Users should accomplish tasks with minimal friction
4. **Flexibility** - Support multiple themes while maintaining brand identity
5. **Accessibility** - All interfaces must be usable by everyone

---

## Technology Stack

### Required Dependencies

```json
{
  "dependencies": {
    "tailwindcss": "^4.x",
    "@radix-ui/react-*": "latest",
    "class-variance-authority": "^0.7.x",
    "clsx": "^2.x",
    "tailwind-merge": "^2.x",
    "lucide-react": "^0.x"
  }
}
```

### Utility Function

All applications must implement the `cn()` utility for merging Tailwind classes:

```typescript
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

---

## Design Tokens

Design tokens are the foundational variables that define the visual design. All applications must use these CSS custom properties.

### CSS Variables Structure

```css
:root {
  /* Base radius for all rounded elements */
  --radius: 0.5rem;

  /* Core colors */
  --background: <color>;
  --foreground: <color>;

  /* Component colors */
  --card: <color>;
  --card-foreground: <color>;
  --popover: <color>;
  --popover-foreground: <color>;

  /* Brand colors */
  --primary: <color>;
  --primary-foreground: <color>;
  --secondary: <color>;
  --secondary-foreground: <color>;

  /* Utility colors */
  --muted: <color>;
  --muted-foreground: <color>;
  --accent: <color>;
  --accent-foreground: <color>;
  --destructive: <color>;
  --destructive-foreground: <color>;

  /* Border & Input */
  --border: <color>;
  --input: <color>;
  --ring: <color>;

  /* Chart colors */
  --chart-1: <color>;
  --chart-2: <color>;
  --chart-3: <color>;
  --chart-4: <color>;
  --chart-5: <color>;

  /* Sidebar specific */
  --sidebar: <color>;
  --sidebar-foreground: <color>;
  --sidebar-primary: <color>;
  --sidebar-primary-foreground: <color>;
  --sidebar-accent: <color>;
  --sidebar-accent-foreground: <color>;
  --sidebar-border: <color>;
  --sidebar-ring: <color>;
}
```

### Tailwind Theme Extension

```css
@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --font-sans: var(--font-sans);
  --font-mono: var(--font-mono);
  --font-display: var(--font-display);

  --color-sidebar-ring: var(--sidebar-ring);
  --color-sidebar-border: var(--sidebar-border);
  --color-sidebar-accent-foreground: var(--sidebar-accent-foreground);
  --color-sidebar-accent: var(--sidebar-accent);
  --color-sidebar-primary-foreground: var(--sidebar-primary-foreground);
  --color-sidebar-primary: var(--sidebar-primary);
  --color-sidebar-foreground: var(--sidebar-foreground);
  --color-sidebar: var(--sidebar);

  --color-chart-5: var(--chart-5);
  --color-chart-4: var(--chart-4);
  --color-chart-3: var(--chart-3);
  --color-chart-2: var(--chart-2);
  --color-chart-1: var(--chart-1);

  --color-ring: var(--ring);
  --color-input: var(--input);
  --color-border: var(--border);
  --color-destructive: var(--destructive);
  --color-accent-foreground: var(--accent-foreground);
  --color-accent: var(--accent);
  --color-muted-foreground: var(--muted-foreground);
  --color-muted: var(--muted);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-secondary: var(--secondary);
  --color-primary-foreground: var(--primary-foreground);
  --color-primary: var(--primary);
  --color-popover-foreground: var(--popover-foreground);
  --color-popover: var(--popover);
  --color-card-foreground: var(--card-foreground);
  --color-card: var(--card);

  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) + 4px);
}
```

---

## Color System

### Theme: Bee2hive (Default)

The primary brand theme featuring warm coral/red tones.

```css
:root,
.bee2hive {
  --radius: 0.5rem;

  /* Background & Foreground */
  --background: #ffffff;
  --foreground: #1a1a1a;

  /* Card */
  --card: #ffffff;
  --card-foreground: #1a1a1a;

  /* Popover */
  --popover: #ffffff;
  --popover-foreground: #1a1a1a;

  /* Primary - Coral Red */
  --primary: #f93f26;
  --primary-foreground: #ffffff;

  /* Secondary - Dark Charcoal */
  --secondary: #2d3436;
  --secondary-foreground: #ffffff;

  /* Muted */
  --muted: #f5f5f5;
  --muted-foreground: #666666;

  /* Accent */
  --accent: #f5f5f5;
  --accent-foreground: #1a1a1a;

  /* Destructive */
  --destructive: #ef4444;
  --destructive-foreground: #ffffff;

  /* Border & Input */
  --border: #e5e5e5;
  --input: #e5e5e5;
  --ring: #f93f26;

  /* Chart Colors */
  --chart-1: #f93f26;
  --chart-2: #2d3436;
  --chart-3: #2ecc71;
  --chart-4: #00bcd4;
  --chart-5: #9b59b6;

  /* Sidebar */
  --sidebar: #f8f9fa;
  --sidebar-foreground: #1a1a1a;
  --sidebar-primary: #f93f26;
  --sidebar-primary-foreground: #ffffff;
  --sidebar-accent: #f5f5f5;
  --sidebar-accent-foreground: #1a1a1a;
  --sidebar-border: #e5e5e5;
  --sidebar-ring: #f93f26;
}
```

#### Bee2hive Extended Palette

```css
/* Red Scale */
--color-bee2-red-50: #fff0ee;
--color-bee2-red-100: #fedbd6;
--color-bee2-red-200: #fdb4a9;
--color-bee2-red-300: #fc8d7c;
--color-bee2-red-400: #fb6654;
--color-bee2-red-500: #f93f26;
--color-bee2-red-600: #e03520;
--color-bee2-red-700: #c72d1a;
--color-bee2-red-800: #a82515;
--color-bee2-red-900: #891d10;

/* Division Colors */
--color-divisao-ambiente: #2ecc71;    /* Environment - Green */
--color-divisao-agricultura: #b8860b; /* Agriculture - Golden */
--color-divisao-industria: #00bcd4;   /* Industry - Cyan */
--color-divisao-saude: #9b59b6;       /* Health - Purple */
--color-divisao-retalho: #20b2aa;     /* Retail - Teal */
```

### Theme: SparkIQ Blue

A professional blue theme for technology-focused applications.

```css
.sparkiq-blue {
  --radius: 0.5rem;

  --background: #ffffff;
  --foreground: #1a1a1a;

  --card: #ffffff;
  --card-foreground: #1a1a1a;

  --popover: #ffffff;
  --popover-foreground: #1a1a1a;

  /* Primary - Bright Blue */
  --primary: #2196f3;
  --primary-foreground: #ffffff;

  /* Secondary - Deep Blue */
  --secondary: #1976d2;
  --secondary-foreground: #ffffff;

  /* Muted - Light Blue */
  --muted: #e3f2fd;
  --muted-foreground: #546e7a;

  --accent: #e3f2fd;
  --accent-foreground: #1a1a1a;

  --destructive: #ef4444;
  --destructive-foreground: #ffffff;

  --border: #bbdefb;
  --input: #bbdefb;
  --ring: #2196f3;

  /* Chart Colors */
  --chart-1: #2196f3;
  --chart-2: #1976d2;
  --chart-3: #4caf50;
  --chart-4: #00bcd4;
  --chart-5: #42a5f5;

  /* Sidebar */
  --sidebar: #e3f2fd;
  --sidebar-foreground: #1a1a1a;
  --sidebar-primary: #2196f3;
  --sidebar-primary-foreground: #ffffff;
  --sidebar-accent: #bbdefb;
  --sidebar-accent-foreground: #1a1a1a;
  --sidebar-border: #bbdefb;
  --sidebar-ring: #2196f3;
}
```

### Theme: Green (Ambiente)

An environmental/nature-focused green theme.

```css
.green {
  --radius: 0.5rem;

  --background: #ffffff;
  --foreground: #1a1a1a;

  --card: #ffffff;
  --card-foreground: #1a1a1a;

  --popover: #ffffff;
  --popover-foreground: #1a1a1a;

  /* Primary - Emerald Green */
  --primary: #2ecc71;
  --primary-foreground: #ffffff;

  /* Secondary - Forest Green */
  --secondary: #27ae60;
  --secondary-foreground: #ffffff;

  /* Muted - Mint */
  --muted: #e8f8f5;
  --muted-foreground: #52796f;

  --accent: #e8f8f5;
  --accent-foreground: #1a1a1a;

  --destructive: #ef4444;
  --destructive-foreground: #ffffff;

  --border: #a8e6cf;
  --input: #a8e6cf;
  --ring: #2ecc71;

  /* Chart Colors */
  --chart-1: #2ecc71;
  --chart-2: #27ae60;
  --chart-3: #16a085;
  --chart-4: #45b39d;
  --chart-5: #58d68d;

  /* Sidebar */
  --sidebar: #e8f8f5;
  --sidebar-foreground: #1a1a1a;
  --sidebar-primary: #2ecc71;
  --sidebar-primary-foreground: #ffffff;
  --sidebar-accent: #d5f4e6;
  --sidebar-accent-foreground: #1a1a1a;
  --sidebar-border: #a8e6cf;
  --sidebar-ring: #2ecc71;
}
```

### Theme: Dark (Bee2hive Dark)

A dark mode variant of the Bee2hive theme.

```css
.dark {
  --radius: 0.5rem;

  --background: #0a0a0a;
  --foreground: #ededed;

  --card: #171717;
  --card-foreground: #ededed;

  --popover: #171717;
  --popover-foreground: #ededed;

  /* Primary - Coral Red (maintained) */
  --primary: #f93f26;
  --primary-foreground: #ffffff;

  --secondary: #2d3436;
  --secondary-foreground: #ffffff;

  --muted: #262626;
  --muted-foreground: #a3a3a3;

  --accent: #262626;
  --accent-foreground: #ededed;

  --destructive: #7f1d1d;
  --destructive-foreground: #fef2f2;

  --border: #262626;
  --input: #262626;
  --ring: #f93f26;

  /* Chart Colors */
  --chart-1: #f93f26;
  --chart-2: #4a5568;
  --chart-3: #2ecc71;
  --chart-4: #00bcd4;
  --chart-5: #9b59b6;

  /* Sidebar */
  --sidebar: #0a0a0a;
  --sidebar-foreground: #ededed;
  --sidebar-primary: #f93f26;
  --sidebar-primary-foreground: #ffffff;
  --sidebar-accent: #262626;
  --sidebar-accent-foreground: #ededed;
  --sidebar-border: #262626;
  --sidebar-ring: #f93f26;
}
```

---

## Typography

### Font Families

```typescript
// Primary fonts used in AppHub
const fonts = {
  display: "Funnel Display", // For headings and display text
  sans: "Inter",             // For body text
  mono: "monospace"          // For code blocks
};
```

### CSS Variables

```css
:root {
  --font-sans: "Inter", system-ui, -apple-system, sans-serif;
  --font-display: "Funnel Display", var(--font-sans);
  --font-mono: ui-monospace, SFMono-Regular, monospace;
}

body {
  font-family: var(--font-sans);
}
```

### Type Scale

| Element       | Size Class    | Font Weight | Line Height |
|---------------|---------------|-------------|-------------|
| H1            | `text-4xl`    | `font-bold` | `leading-tight` |
| H2            | `text-3xl`    | `font-bold` | `leading-tight` |
| H3            | `text-2xl`    | `font-semibold` | `leading-snug` |
| H4            | `text-xl`     | `font-semibold` | `leading-snug` |
| H5            | `text-lg`     | `font-semibold` | `leading-normal` |
| H6            | `text-base`   | `font-semibold` | `leading-normal` |
| Body Large    | `text-base`   | `font-normal` | `leading-relaxed` |
| Body          | `text-sm`     | `font-normal` | `leading-normal` |
| Body Small    | `text-xs`     | `font-normal` | `leading-normal` |
| Caption       | `text-xs`     | `font-medium` | `leading-tight` |

### Text Colors

```css
/* Primary text */
.text-foreground { color: var(--foreground); }

/* Secondary/muted text */
.text-muted-foreground { color: var(--muted-foreground); }

/* On colored backgrounds */
.text-primary-foreground { color: var(--primary-foreground); }
.text-secondary-foreground { color: var(--secondary-foreground); }
```

---

## Spacing & Layout

### Spacing Scale

Use Tailwind's spacing scale consistently:

| Token | Value   | Use Case |
|-------|---------|----------|
| `1`   | 0.25rem | Tight gaps, icon margins |
| `2`   | 0.5rem  | Small gaps, badge padding |
| `3`   | 0.75rem | Standard inline spacing |
| `4`   | 1rem    | Component padding, gaps |
| `5`   | 1.25rem | Section gaps |
| `6`   | 1.5rem  | Card padding, larger gaps |
| `8`   | 2rem    | Section spacing |
| `10`  | 2.5rem  | Major section dividers |
| `12`  | 3rem    | Large layout gaps |
| `16`  | 4rem    | Header height |

### Page Layout

```tsx
// Standard dashboard layout structure
<SidebarProvider style={{ "--sidebar-width": "19rem" }}>
  <DashboardHeader className="fixed top-0 left-0 right-0 h-16 z-50" />
  <div className="flex flex-1 w-full pt-16">
    <AppSidebar className="!top-16 h-[calc(100vh-4rem)]" />
    <SidebarInset className="flex-1 min-h-[calc(100vh-4rem)] overflow-y-auto">
      <div className="p-4 md:p-6 w-full">
        {/* Page content */}
      </div>
    </SidebarInset>
  </div>
</SidebarProvider>
```

### Layout Constants

```typescript
const LAYOUT = {
  HEADER_HEIGHT: "4rem",       // 64px - h-16
  SIDEBAR_WIDTH: "19rem",      // 304px - Expanded sidebar
  SIDEBAR_WIDTH_MOBILE: "18rem",
  SIDEBAR_WIDTH_ICON: "3rem",  // 48px - Collapsed sidebar
  CONTENT_PADDING: "1.5rem",   // p-6
  CONTENT_PADDING_MOBILE: "1rem", // p-4
  MAX_CONTENT_WIDTH: "1400px"
};
```

### Grid System

```tsx
// Standard content grid
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {/* Grid items */}
</div>

// Full-width with max constraint
<div className="w-full max-w-7xl mx-auto">
  {/* Content */}
</div>
```

---

## Border Radius

### Radius Scale

```css
--radius: 0.5rem;           /* Base radius - 8px */
--radius-sm: calc(var(--radius) - 4px);  /* 4px - Small elements */
--radius-md: calc(var(--radius) - 2px);  /* 6px - Medium elements */
--radius-lg: var(--radius);              /* 8px - Cards, dialogs */
--radius-xl: calc(var(--radius) + 4px);  /* 12px - Large cards */
```

### Usage Guidelines

| Element         | Radius    | Tailwind Class |
|-----------------|-----------|----------------|
| Buttons         | `md`      | `rounded-md` |
| Inputs          | `md`      | `rounded-md` |
| Cards           | `xl`      | `rounded-xl` |
| Badges          | `full`    | `rounded-full` |
| Avatars         | `full`    | `rounded-full` |
| Dialogs         | `lg`      | `rounded-lg` |
| Checkboxes      | `4px`     | `rounded-[4px]` |
| Tabs            | `sm`/`md` | `rounded-sm` / `rounded-md` |

---

## Shadows & Elevation

### Shadow Scale

```css
/* Extra small - inputs, buttons */
.shadow-xs { box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05); }

/* Small - cards, dropdowns */
.shadow-sm { box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1); }

/* Medium - floating elements */
.shadow-md { box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1); }

/* Large - dialogs, popovers */
.shadow-lg { box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1); }
```

### Elevation Guidelines

| Level | Use Case                    | Shadow   |
|-------|-----------------------------|----------|
| 0     | Surface elements            | none     |
| 1     | Cards, inputs               | `shadow-xs` to `shadow-sm` |
| 2     | Dropdowns, popovers         | `shadow-md` |
| 3     | Dialogs, modals, drawers    | `shadow-lg` |

---

## Component Specifications

### Button

```typescript
// Button variants
const buttonVariants = {
  variant: {
    default: "bg-primary text-primary-foreground hover:bg-primary/90",
    destructive: "bg-destructive text-white hover:bg-destructive/90",
    outline: "border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground",
    secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
    ghost: "hover:bg-accent hover:text-accent-foreground",
    link: "text-primary underline-offset-4 hover:underline"
  },
  size: {
    default: "h-9 px-4 py-2",      // 36px height
    sm: "h-8 rounded-md px-3",     // 32px height
    lg: "h-10 rounded-md px-6",    // 40px height
    icon: "size-9",                // 36x36px
    "icon-sm": "size-8",           // 32x32px
    "icon-lg": "size-10"           // 40x40px
  }
};

// Base styles
const buttonBase = `
  inline-flex items-center justify-center gap-2
  whitespace-nowrap rounded-md text-sm font-medium
  transition-all
  disabled:pointer-events-none disabled:opacity-50
  outline-none
  focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]
`;
```

### Input

```typescript
const inputStyles = `
  h-9 w-full min-w-0
  rounded-md border border-input
  bg-transparent dark:bg-input/30
  px-3 py-1
  text-base md:text-sm
  shadow-xs
  placeholder:text-muted-foreground
  selection:bg-primary selection:text-primary-foreground
  focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]
  aria-invalid:ring-destructive/20 aria-invalid:border-destructive
  disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50
  transition-[color,box-shadow] outline-none
`;
```

### Card

```typescript
const cardStyles = {
  card: "bg-card text-card-foreground flex flex-col gap-6 rounded-xl border py-6 shadow-sm",
  header: "grid auto-rows-min grid-rows-[auto_auto] items-start gap-2 px-6",
  title: "leading-none font-semibold",
  description: "text-muted-foreground text-sm",
  content: "px-6",
  footer: "flex items-center px-6"
};
```

### Badge

```typescript
const badgeVariants = {
  base: `
    inline-flex items-center justify-center
    rounded-full border
    px-2 py-0.5
    text-xs font-medium
    w-fit whitespace-nowrap shrink-0
    transition-[color,box-shadow]
  `,
  variant: {
    default: "border-transparent bg-primary text-primary-foreground",
    secondary: "border-transparent bg-secondary text-secondary-foreground",
    destructive: "border-transparent bg-destructive text-white",
    outline: "text-foreground"
  }
};
```

### Table

```typescript
const tableStyles = {
  container: "relative w-full overflow-x-auto",
  table: "w-full caption-bottom text-sm",
  header: "[&_tr]:border-b",
  body: "[&_tr:last-child]:border-0",
  row: "hover:bg-muted/50 data-[state=selected]:bg-muted border-b transition-colors",
  head: "text-foreground h-10 px-2 text-left align-middle font-medium whitespace-nowrap",
  cell: "p-2 align-middle whitespace-nowrap",
  caption: "text-muted-foreground mt-4 text-sm",
  footer: "bg-muted/50 border-t font-medium"
};
```

### Dialog

```typescript
const dialogStyles = {
  overlay: `
    fixed inset-0 z-50 bg-black/50
    data-[state=open]:animate-in data-[state=closed]:animate-out
    data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0
  `,
  content: `
    fixed top-[50%] left-[50%] z-50
    w-full max-w-[calc(100%-2rem)] sm:max-w-lg
    translate-x-[-50%] translate-y-[-50%]
    grid gap-4
    rounded-lg border bg-background p-6 shadow-lg
    duration-200
    data-[state=open]:animate-in data-[state=closed]:animate-out
    data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0
    data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95
  `,
  header: "flex flex-col gap-2 text-center sm:text-left",
  footer: "flex flex-col-reverse gap-2 sm:flex-row sm:justify-end",
  title: "text-lg leading-none font-semibold",
  description: "text-muted-foreground text-sm"
};
```

### Tabs

```typescript
const tabStyles = {
  list: "inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground",
  trigger: `
    inline-flex items-center justify-center
    whitespace-nowrap rounded-sm
    px-3 py-1.5 text-sm font-medium
    ring-offset-background transition-all
    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2
    disabled:pointer-events-none disabled:opacity-50
    data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm
  `,
  content: "mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
};
```

### Select

```typescript
const selectStyles = {
  trigger: `
    flex w-fit items-center justify-between gap-2
    rounded-md border border-input bg-transparent
    px-3 py-2 text-sm whitespace-nowrap shadow-xs
    data-[placeholder]:text-muted-foreground
    focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]
    disabled:cursor-not-allowed disabled:opacity-50
    data-[size=default]:h-9 data-[size=sm]:h-8
    transition-[color,box-shadow] outline-none
  `,
  content: `
    relative z-50 max-h-(--radix-select-content-available-height)
    min-w-[8rem] overflow-x-hidden overflow-y-auto
    rounded-md border bg-popover text-popover-foreground shadow-md
  `,
  item: `
    relative flex w-full cursor-default items-center gap-2
    rounded-sm py-1.5 pr-8 pl-2 text-sm
    outline-hidden select-none
    focus:bg-accent focus:text-accent-foreground
    data-[disabled]:pointer-events-none data-[disabled]:opacity-50
  `
};
```

### Avatar

```typescript
const avatarStyles = {
  root: "relative flex size-8 shrink-0 overflow-hidden rounded-full",
  image: "aspect-square size-full",
  fallback: "bg-muted flex size-full items-center justify-center rounded-full"
};

// Common sizes
const avatarSizes = {
  sm: "size-6",   // 24px
  default: "size-8", // 32px
  md: "size-10", // 40px
  lg: "size-12", // 48px
  xl: "size-16"  // 64px
};
```

### Checkbox

```typescript
const checkboxStyles = `
  size-4 shrink-0
  rounded-[4px] border border-input
  shadow-xs transition-shadow outline-none
  peer
  dark:bg-input/30
  data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground
  data-[state=checked]:border-primary
  focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]
  aria-invalid:ring-destructive/20 aria-invalid:border-destructive
  disabled:cursor-not-allowed disabled:opacity-50
`;
```

### Switch

```typescript
const switchStyles = {
  root: `
    inline-flex h-[1.15rem] w-8 shrink-0 items-center
    rounded-full border border-transparent shadow-xs
    transition-all outline-none
    peer
    data-[state=checked]:bg-primary
    data-[state=unchecked]:bg-input dark:data-[state=unchecked]:bg-input/80
    focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]
    disabled:cursor-not-allowed disabled:opacity-50
  `,
  thumb: `
    pointer-events-none block size-4 rounded-full ring-0
    bg-background
    dark:data-[state=unchecked]:bg-foreground
    dark:data-[state=checked]:bg-primary-foreground
    transition-transform
    data-[state=checked]:translate-x-[calc(100%-2px)]
    data-[state=unchecked]:translate-x-0
  `
};
```

### Alert

```typescript
const alertVariants = {
  base: `
    relative w-full rounded-lg border p-4
    [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px]
    [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground
  `,
  variant: {
    default: "bg-background text-foreground",
    destructive: "border-destructive/50 text-destructive [&>svg]:text-destructive"
  }
};
```

### Sidebar

```typescript
const sidebarConfig = {
  width: "16rem",        // 256px standard
  widthMobile: "18rem",  // 288px mobile
  widthIcon: "3rem",     // 48px collapsed
  keyboardShortcut: "b"  // Ctrl/Cmd + B to toggle
};

const sidebarStyles = {
  wrapper: "group/sidebar-wrapper flex min-h-svh w-full",
  sidebar: "bg-sidebar text-sidebar-foreground flex h-full flex-col",
  header: "flex flex-col gap-2 p-2 min-w-0",
  content: "flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto overflow-x-hidden",
  footer: "flex flex-col gap-2 p-2",
  separator: "bg-sidebar-border mx-2 w-auto",
  group: "relative flex w-full min-w-0 flex-col p-2",
  groupLabel: "text-sidebar-foreground/70 flex h-8 shrink-0 items-center px-2 text-xs font-medium",
  menu: "flex w-full min-w-0 flex-col gap-1",
  menuItem: "group/menu-item relative",
  menuButton: `
    flex w-full items-center gap-2 overflow-hidden
    rounded-md p-2 text-left text-sm outline-hidden
    ring-sidebar-ring
    transition-[width,height,padding]
    hover:bg-sidebar-accent hover:text-sidebar-accent-foreground
    focus-visible:ring-2
    data-[active=true]:bg-sidebar-accent data-[active=true]:font-medium
    data-[active=true]:text-sidebar-accent-foreground
    disabled:pointer-events-none disabled:opacity-50
  `
};
```

---

## Theming

### Theme Provider Implementation

```tsx
'use client'

import * as React from 'react'

type Theme = 'bee2hive' | 'sparkiq-blue' | 'green' | 'dark'

type ThemeProviderProps = {
  children: React.ReactNode
  defaultTheme?: Theme
  storageKey?: string
}

type ThemeProviderState = {
  theme: Theme
  setTheme: (theme: Theme) => void
}

const ThemeProviderContext = React.createContext<ThemeProviderState>({
  theme: 'bee2hive',
  setTheme: () => null,
})

export function ThemeProvider({
  children,
  defaultTheme = 'bee2hive',
  storageKey = 'apphub-theme',
}: ThemeProviderProps) {
  const [theme, setTheme] = React.useState<Theme>(
    () => (typeof window !== 'undefined' && 
      (localStorage.getItem(storageKey) as Theme)) || defaultTheme
  )

  React.useEffect(() => {
    const root = window.document.documentElement
    root.classList.remove('bee2hive', 'sparkiq-blue', 'green', 'dark')
    root.classList.add(theme)
  }, [theme])

  const value = {
    theme,
    setTheme: (theme: Theme) => {
      localStorage.setItem(storageKey, theme)
      setTheme(theme)
    },
  }

  return (
    <ThemeProviderContext.Provider value={value}>
      {children}
    </ThemeProviderContext.Provider>
  )
}

export const useTheme = () => {
  const context = React.useContext(ThemeProviderContext)
  if (context === undefined)
    throw new Error('useTheme must be used within a ThemeProvider')
  return context
}
```

### Theme Custom Variants

```css
/* Enable theme-specific styling with Tailwind */
@custom-variant dark (&:is(.dark *));
@custom-variant sparkiq-blue (&:is(.sparkiq-blue *));
@custom-variant green (&:is(.green *));
@custom-variant bee2hive (&:is(.bee2hive *));
```

### Creating Custom Themes

To create a new theme, define all CSS variables:

```css
.your-theme {
  --radius: 0.5rem;
  
  /* Required: All color variables */
  --background: <color>;
  --foreground: <color>;
  --card: <color>;
  --card-foreground: <color>;
  --popover: <color>;
  --popover-foreground: <color>;
  --primary: <color>;
  --primary-foreground: <color>;
  --secondary: <color>;
  --secondary-foreground: <color>;
  --muted: <color>;
  --muted-foreground: <color>;
  --accent: <color>;
  --accent-foreground: <color>;
  --destructive: <color>;
  --destructive-foreground: <color>;
  --border: <color>;
  --input: <color>;
  --ring: <color>;
  
  /* Chart colors */
  --chart-1: <color>;
  --chart-2: <color>;
  --chart-3: <color>;
  --chart-4: <color>;
  --chart-5: <color>;
  
  /* Sidebar */
  --sidebar: <color>;
  --sidebar-foreground: <color>;
  --sidebar-primary: <color>;
  --sidebar-primary-foreground: <color>;
  --sidebar-accent: <color>;
  --sidebar-accent-foreground: <color>;
  --sidebar-border: <color>;
  --sidebar-ring: <color>;
}
```

---

## Icons

### Icon Library

AppHub uses **Lucide React** as the primary icon library.

```bash
npm install lucide-react
```

### Icon Sizing

```typescript
const iconSizes = {
  xs: "size-3",    // 12px
  sm: "size-3.5",  // 14px
  default: "size-4", // 16px - Standard UI icons
  md: "size-5",    // 20px
  lg: "size-6",    // 24px
  xl: "size-8"     // 32px
};
```

### Icon Usage Guidelines

```tsx
// Standard button icon
<Button>
  <PlusIcon /> Add Item
</Button>

// Icon-only button
<Button variant="ghost" size="icon">
  <SettingsIcon />
  <span className="sr-only">Settings</span>
</Button>

// Menu item with icon
<SidebarMenuButton>
  <HomeIcon />
  <span>Dashboard</span>
</SidebarMenuButton>
```

### Common Icons

| Purpose            | Icon              |
|--------------------|-------------------|
| Navigation/Home    | `HomeIcon`        |
| Settings           | `SettingsIcon`    |
| User/Profile       | `UserIcon`        |
| Add/Create         | `PlusIcon`        |
| Edit               | `PencilIcon`      |
| Delete             | `TrashIcon`       |
| Close              | `XIcon`           |
| Menu/Hamburger     | `MenuIcon`        |
| Search             | `SearchIcon`      |
| Chevron Down       | `ChevronDownIcon` |
| Chevron Right      | `ChevronRightIcon`|
| Check              | `CheckIcon`       |
| Alert              | `AlertCircleIcon` |
| Info               | `InfoIcon`        |
| Loading            | `LoaderIcon`      |

---

## Animation & Motion

### Transition Defaults

```css
/* Standard transition */
transition-all

/* Color and shadow transitions */
transition-[color,box-shadow]

/* Layout transitions */
transition-[width,height,padding]

/* Position transitions */
transition-[left,right,width]
```

### Duration Scale

```css
duration-75   /* 75ms - Micro interactions */
duration-100  /* 100ms - Quick feedback */
duration-150  /* 150ms - Standard */
duration-200  /* 200ms - Default for most animations */
duration-300  /* 300ms - Larger elements */
duration-500  /* 500ms - Page transitions */
```

### Easing Functions

```css
ease-linear     /* Linear transitions */
ease-in         /* Accelerate */
ease-out        /* Decelerate */
ease-in-out     /* Smooth both ends */
```

### Animation Classes

```css
/* Entrance animations */
.animate-in { animation-name: enter; }
.fade-in-0 { --tw-enter-opacity: 0; }
.zoom-in-95 { --tw-enter-scale: .95; }
.slide-in-from-top-2 { --tw-enter-translate-y: -0.5rem; }
.slide-in-from-bottom-2 { --tw-enter-translate-y: 0.5rem; }

/* Exit animations */
.animate-out { animation-name: exit; }
.fade-out-0 { --tw-exit-opacity: 0; }
.zoom-out-95 { --tw-exit-scale: .95; }
```

### State-Based Animations

```tsx
// Dialog animations
<DialogContent className="
  data-[state=open]:animate-in
  data-[state=closed]:animate-out
  data-[state=closed]:fade-out-0
  data-[state=open]:fade-in-0
  data-[state=closed]:zoom-out-95
  data-[state=open]:zoom-in-95
"/>
```

---

## Responsive Design

### Breakpoints

| Breakpoint | Min Width | Use Case |
|------------|-----------|----------|
| `sm`       | 640px     | Large phones, small tablets |
| `md`       | 768px     | Tablets, sidebar visibility |
| `lg`       | 1024px    | Laptops, multi-column layouts |
| `xl`       | 1280px    | Desktops |
| `2xl`      | 1536px    | Large monitors |

### Mobile-First Approach

```tsx
// Always design mobile-first
<div className="
  flex-col          // Mobile: stacked
  md:flex-row       // Tablet+: horizontal
">

<div className="
  p-4               // Mobile: smaller padding
  md:p-6            // Tablet+: larger padding
">

<div className="
  grid-cols-1       // Mobile: single column
  md:grid-cols-2    // Tablet: two columns
  lg:grid-cols-3    // Desktop: three columns
">
```

### Responsive Patterns

```tsx
// Hide/show based on screen size
<div className="hidden md:block">Desktop only</div>
<div className="md:hidden">Mobile only</div>

// Responsive text sizes
<h1 className="text-2xl md:text-3xl lg:text-4xl">Heading</h1>

// Responsive spacing
<div className="space-y-4 md:space-y-6 lg:space-y-8">
  {/* Content */}
</div>
```

### Sidebar Responsive Behavior

```tsx
// Sidebar hides on mobile, shows on md+
const SIDEBAR_RESPONSIVE = {
  mobile: "hidden", // Completely hidden, use sheet instead
  desktop: "md:flex"
};

// Use Sheet component for mobile navigation
{isMobile ? (
  <Sheet>
    <SheetContent className="w-[--sidebar-width]">
      {/* Sidebar content */}
    </SheetContent>
  </Sheet>
) : (
  <Sidebar>
    {/* Sidebar content */}
  </Sidebar>
)}
```

---

## Accessibility

### Focus States

All interactive elements must have visible focus states:

```css
/* Standard focus ring */
focus-visible:border-ring
focus-visible:ring-ring/50
focus-visible:ring-[3px]

/* Invalid state focus */
aria-invalid:ring-destructive/20
aria-invalid:border-destructive
```

### Screen Reader Support

```tsx
// Always include sr-only labels for icon-only buttons
<Button variant="ghost" size="icon">
  <XIcon />
  <span className="sr-only">Close dialog</span>
</Button>

// Hide decorative content
<div aria-hidden="true">
  {/* Decorative element */}
</div>
```

### ARIA Attributes

```tsx
// Role indicators
<div role="alert">Error message</div>
<nav role="navigation">...</nav>

// State indicators
<button aria-expanded={isOpen}>Toggle</button>
<input aria-invalid={hasError} />
<div aria-disabled={isDisabled}>...</div>

// Labels
<input aria-label="Search" />
<div aria-labelledby="heading-id">...</div>
<div aria-describedby="description-id">...</div>
```

### Color Contrast

- Normal text: minimum 4.5:1 contrast ratio
- Large text (18px+ or 14px+ bold): minimum 3:1 contrast ratio
- UI components and graphics: minimum 3:1 contrast ratio

### Keyboard Navigation

All interactive elements must be keyboard accessible:

```tsx
// Tab order
<button tabIndex={0}>Focusable</button>
<div tabIndex={-1}>Programmatically focusable only</div>

// Keyboard shortcuts
const KEYBOARD_SHORTCUTS = {
  toggleSidebar: "Ctrl/Cmd + B",
  search: "Ctrl/Cmd + K",
  escape: "Escape to close dialogs"
};
```

### Reduced Motion

```css
/* Respect user preference for reduced motion */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## Implementation Guidelines

### File Structure

```
src/
├── app/
│   ├── globals.css          # Global styles and CSS variables
│   └── layout.tsx           # Root layout with providers
├── components/
│   └── ui/                  # Reusable UI components
│       ├── button.tsx
│       ├── card.tsx
│       ├── dialog.tsx
│       └── ...
├── lib/
│   ├── utils.ts             # cn() utility function
│   └── theme-provider.tsx   # Theme context
└── config/
    └── site.ts              # Site configuration
```

### CSS Import Order

```css
/* globals.css */
@import "tailwindcss";
@import "tw-animate-css";

/* Custom variants */
@custom-variant dark (&:is(.dark *));
@custom-variant sparkiq-blue (&:is(.sparkiq-blue *));
@custom-variant green (&:is(.green *));
@custom-variant bee2hive (&:is(.bee2hive *));

/* Theme inline */
@theme inline {
  /* Design tokens */
}

/* Theme definitions */
:root, .bee2hive { /* ... */ }
.sparkiq-blue { /* ... */ }
.green { /* ... */ }
.dark { /* ... */ }

/* Base layer overrides */
@layer base {
  * {
    @apply border-border outline-ring/50;
  }
  body {
    @apply bg-background text-foreground;
  }
}
```

### Component Pattern

```tsx
import * as React from "react"
import { cn } from "@/lib/utils"

// Use data-slot for component identification
function Component({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="component"
      className={cn(
        "base-styles",
        className
      )}
      {...props}
    />
  )
}

export { Component }
```

### Variant Pattern with CVA

```tsx
import { cva, type VariantProps } from "class-variance-authority"

const componentVariants = cva(
  "base-styles shared-by-all-variants",
  {
    variants: {
      variant: {
        default: "variant-specific-styles",
        secondary: "secondary-styles",
      },
      size: {
        default: "size-styles",
        sm: "small-styles",
        lg: "large-styles",
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    }
  }
)

function Component({
  className,
  variant,
  size,
  ...props
}: ComponentProps & VariantProps<typeof componentVariants>) {
  return (
    <div
      className={cn(componentVariants({ variant, size }), className)}
      {...props}
    />
  )
}
```

### State Management for UI

```tsx
// Use data attributes for state-based styling
<div 
  data-state={isOpen ? "open" : "closed"}
  data-active={isActive}
  data-disabled={isDisabled}
  className="
    data-[state=open]:visible
    data-[state=closed]:hidden
    data-[active=true]:bg-accent
    data-[disabled=true]:opacity-50
  "
/>
```

### Integration Checklist

When integrating with AppHub, ensure:

- [ ] All CSS variables are defined
- [ ] Theme provider is implemented
- [ ] `cn()` utility is available
- [ ] Radix UI primitives are used for complex components
- [ ] Lucide icons are used
- [ ] Focus states are visible
- [ ] Keyboard navigation works
- [ ] Responsive breakpoints are respected
- [ ] Color contrast meets WCAG standards
- [ ] Animations respect reduced-motion preference

---

## Quick Reference

### Essential Classes

```css
/* Backgrounds */
bg-background bg-card bg-popover bg-primary bg-secondary bg-muted bg-accent bg-destructive

/* Text */
text-foreground text-card-foreground text-popover-foreground text-primary-foreground
text-secondary-foreground text-muted-foreground text-accent-foreground text-destructive-foreground

/* Borders */
border-border border-input border-ring border-destructive

/* Focus */
focus-visible:ring-ring/50 focus-visible:ring-[3px] focus-visible:border-ring

/* Disabled */
disabled:pointer-events-none disabled:opacity-50

/* Transitions */
transition-all duration-200 ease-in-out
```

### Component Heights

```css
h-8   /* 32px - Small inputs, buttons */
h-9   /* 36px - Default inputs, buttons */
h-10  /* 40px - Large inputs, buttons, tabs */
h-16  /* 64px - Header */
```

### Common Patterns

```tsx
// Page header pattern
<div className="flex items-center justify-between mb-6">
  <div>
    <h1 className="text-2xl font-bold">Page Title</h1>
    <p className="text-muted-foreground">Page description</p>
  </div>
  <Button>Action</Button>
</div>

// Card list pattern
<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
  {items.map(item => (
    <Card key={item.id}>
      <CardHeader>
        <CardTitle>{item.title}</CardTitle>
        <CardDescription>{item.description}</CardDescription>
      </CardHeader>
      <CardContent>
        {/* Content */}
      </CardContent>
    </Card>
  ))}
</div>

// Form pattern
<form className="space-y-4">
  <div className="space-y-2">
    <Label htmlFor="name">Name</Label>
    <Input id="name" />
  </div>
  <Button type="submit">Submit</Button>
</form>
```

---

## Version History

| Version | Date       | Changes |
|---------|------------|---------|
| 1.0.0   | 2024-12-06 | Initial design system documentation |

---

*This design system is maintained by the AppHub team. For questions or contributions, please refer to the main repository.*

