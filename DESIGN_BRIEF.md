# Orchestra Frontend Design Brief

Status: extracted from the current frontend implementation

## Overall direction

The site uses a warm, editorial SaaS style:

- soft off-white app backgrounds
- white card surfaces with light grey borders and low, diffused shadows
- high-contrast black headings
- a condensed display face for labels and headings
- a humanist sans for body copy
- restrained but frequent motion using spring and ease-out transitions
- thin-stroke icons and pastel semantic accents instead of heavy illustration

The result is a product workspace aesthetic that sits between a dashboard, a knowledge tool, and a lightweight operating system for project delivery.

## Color scheme

### Core neutrals

- App background: `#f7f6f3`
- Secondary warm backgrounds: `#fafaf8`, `#f5f5f2`, `#f5f4f0`, `#f0f0ec`
- Card/surface white: `#ffffff`
- Borders: `#eeeeea`, `#e8e8e4`, `#e5e5e0`, `#d0d0cc`
- Primary text: `#0a0a0a`
- Secondary text: `#333333`, `#555555`, `#666666`
- Muted text: `#888888`, `#999999`, `#bbbbbb`, `#cccccc`

### Brand / semantic accents

- Primary brand teal: `#B8543D`
- Teal tints: `#f0faf8`, `#c8f0e8`, `#e8faf6`, `#e8faf7`
- Purple accent: `#8B7FD4`
- Purple tints: `#f4f2fc`, `#e0dbf5`, `#f0eeff`
- Orange accent: `#B8543D`
- Orange tints: `#fef6ec`, `#fceee4`, `#fef3e8`
- Red accent: `#9E3B2E`
- Red tints: `#fff0f0`, `#ffe8e8`
- Blue integration accent: `#5A5450`, `#5A5450`

### Usage pattern

- Teal is the dominant interactive and “healthy/active” color.
- Purple is used for structure, planning, memory, and approval states.
- Orange is used for warnings, review states, provenance, and unresolved items.
- Red is used for risk, criticality, and change requests.
- The palette is mostly low-saturation and pastel, with stronger accents reserved for dots, pills, icons, and hover states.

## Typography

Three fonts define the system:

- `Geist`: headings, labels, tabs, buttons, section markers
- `Geist`: body copy, UI copy, cards, paragraphs, controls
- `Geist Mono`: metadata, timestamps, versions, IDs, evidence labels, system text

### Type roles

- `Geist` is typically uppercase or visually uppercase, with letter spacing around `0.06em` to `0.18em`.
- `Geist` is the default font on `:root` and `body`, and carries nearly all long-form and UI text.
- `Geist Mono` is used as an information layer for technical or provenance-like details.

### Tone

Typography mixes:

- bold, compressed display lettering for product identity and navigation
- softer, more contemporary editorial sans for readable content
- monospaced annotations for “system truth” and data provenance

## Design scheme

### Layout language

- Fixed left nav rail plus fixed right Socrates panel
- Main canvas centered between both rails
- Frequent slide-over right panels for evidence/detail views
- Large internal padding and spacious card gutters
- Many screens use top utility bars with translucent backgrounds and `flat opacity`

### Surface treatment

- Base canvas uses warm off-white backgrounds rather than pure white
- Most content sits on white cards with rounded corners from `16px` to `24px`
- Shadows are soft and layered, usually subtle black alpha glows
- Interactive cards lift slightly on hover rather than changing dramatically
- Dashed borders are used for “add”, “upload”, or incomplete states

### Shape language

- Rounded rectangles dominate the interface
- Pills and capsules are used for status, tabs, and metadata
- Circles are used for avatars, assistant marks, status dots, and key knowledge nodes
- The knowledge map and flowchart pages use circles plus softened node chips to keep diagrams visually consistent with the rest of the UI

### Visual motifs

- Warm neutral background + crisp white surfaces
- Teal-led status indicators and selection states
- Occasional soft glassmorphism on search bars, message bubbles, and side panels
- Light gradients used sparingly for hero nodes, AI/chat bubbles, and service fallback logos
- Knowledge/provenance views rely on left-border highlights, muted panels, and mono metadata

## Iconography

### Icon system

The main icon set is Tabler Icons via `react-icons/tb`, wrapped in a local `AppIcons` component layer.

Characteristics:

- outlined icons
- thin stroke width (`1.5`)
- consistent sizing, usually `14px` to `22px`
- monochrome by default, then tinted semantically per context

Common icon families:

- navigation: dashboard, settings, arrow, books, file, message
- project modeling: brain, git branch, pull request, checkbox
- utility: search, upload, zoom, maximize, lock, close, plus

### Contextual icon color

- teal for active navigation and healthy states
- purple for memory/structure/approval views
- orange for review and unresolved states
- red for critical or change-oriented actions

### External brand marks

Project subscriptions use Simple Icons CDN logos when available, with gradient fallback tiles when not.

### Documents and diagrams

Mermaid is used to render generated diagrams in the live doc and assistant panel, styled to match the app palette and mono system text.

## Avatars

Avatars are generated with DiceBear `avataaars`.

Characteristics:

- circular crop
- white border
- soft shadow
- pastel flat tint background variants
- deterministic seeds tied to initials or names for role consistency

The avatar style is more playful than the rest of the system, but kept controlled through small size, soft colors, and minimal framing.

## Animations and motion

The site uses `framer-motion` heavily, but the motion system stays restrained and purposeful.

### Common motion patterns

- staggered page and list reveals
- hover lift on cards
- small scale feedback on buttons
- nav rail width expansion on hover
- side panels sliding in from the right
- pulsing dots for activity, streaming, and critical states
- progressive diagram/edge drawing animations
- subtle looping ambient motion on key AI/brain elements

### Notable bespoke animations

- `OmniLogo`: rotating outer ring plus blinking/moving eyes
- `SocratesPanel`: streaming dots and animated suggestion chips
- `ProjectBrainPage`: pulsing core rings, traveling edge dots, staged node entry
- `ProjectFlowchartPage`: edge draw-on animation and pulsing critical markers
- `LiveDocPage`: shimmer loading cards for diagram generation, source-tooltip popovers, animated section highlight

### Motion tone

The app favors:

- short ease-out transitions
- spring-based expansion and entrance for structural UI
- continuous but low-amplitude ambient loops

It avoids:

- large parallax effects
- exaggerated bounces
- decorative full-screen motion

## Source files

The extracted brief is based primarily on:

- `frontend/src/index.css`
- `frontend/tailwind.config.ts`
- `frontend/index.html`
- `frontend/src/components/ui/AppIcons.tsx`
- `frontend/src/components/ui/Avatar.tsx`
- `frontend/src/components/ui/OmniLogo.tsx`
- `frontend/src/components/shell/NavBar.tsx`
- `frontend/src/components/shell/SocratesPanel.tsx`
- `frontend/src/pages/DashboardPage.tsx`
- `frontend/src/pages/ProjectDashboardPage.tsx`
- `frontend/src/pages/ProjectBrainPage.tsx`
- `frontend/src/pages/ProjectFlowchartPage.tsx`
- `frontend/src/pages/LiveDocPage.tsx`
- `frontend/src/pages/LiveDocViewerPage.tsx`
- `frontend/src/pages/ProjectDocsPage.tsx`
