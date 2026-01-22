# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a vanilla JavaScript interactive web application that renders an animated rose with falling petals on an HTML5 canvas. Users can tap petals to make them fall, double-tap to re-bloom all petals, and switch between different artistic rendering styles (pencil, watercolor, oil, marker).

## Tech Stack

- Pure vanilla JavaScript (no frameworks)
- HTML5 Canvas API for all rendering
- CSS3 for UI styling and animations
- No build system or package manager

## Development

Since this is a static web application with no build process, simply open `index.html` in a web browser to run the application.

For development with live reload, you can use any static file server:
```bash
python -m http.server 8000
# or
npx serve
```

## Code Architecture

### Core Classes

**Petal** (`script.js:1-90`)
- Represents a single rose petal with physics properties
- Manages three states: active (attached to rose), falling (physics simulation), and blooming (re-growing animation)
- Each petal has properties for angle, radius, size, layer, curl, wobble, and fall physics (position, velocity, rotation, opacity)

**Rose** (`script.js:92-753`)
- Main application class that manages the entire rose visualization
- Handles canvas rendering, animation loop, and user interactions
- Creates a layered petal structure: 8 outer, 13 middle, 8 inner, 5 center petals (34 total)
- Implements four rendering styles with different drawing algorithms

### Rendering Architecture

The application uses a multi-layer rendering approach:

1. **Background gradient** - Radial gradient from dark blue center to darker edges
2. **Stem and leaves** - Drawn using bezier curves and ellipses, styled per art style
3. **Petals** - Rendered in layers from outermost to innermost
4. **Center** - Golden radial gradient center with decorative dots
5. **Particles** - Sparkle effects on tap/bloom events

Each art style (`pencil`, `watercolor`, `oil`, `marker`) has its own drawing method:
- **Pencil**: Light fill with sketch lines, crosshatch shading at 30° angle
- **Watercolor**: 6 translucent layers with spreading, radial gradient fills
- **Oil**: Linear gradients, thick impasto highlights, bold outlines
- **Marker**: Solid fill with black outlines and simple highlights

### Interaction System

- **Single tap**: Finds the petal at tap coordinates and triggers fall animation with particle burst
- **Double tap** (< 300ms): Re-blooms all fallen petals with bloom animation
- Mouse/touch tracking updates particle effects to follow cursor
- Responsive design with mobile-optimized controls

### Animation Loop

The `animate()` method runs on `requestAnimationFrame`:
1. Clears and redraws background
2. Updates growth progress and bloom pulse effects
3. Updates petal wobble animations
4. Processes petal states (falling physics, bloom transitions)
5. Renders all elements in correct z-order
6. Updates and renders particle effects

### File Structure

- `index.html` - Main HTML document with canvas element and controls UI
- `script.js` - All application logic (Petal and Rose classes, initialization, event handlers)
- `styles.css` - UI styling, animations, responsive design
- `favicon.svg` - Rose icon
