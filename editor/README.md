# Context Free Live Editor

A modern, interactive web-based editor for creating Context Free Design Grammar (CFDG) art. Built with React, TypeScript, and Tailwind CSS, featuring a beautiful dark mode theme.

## Features

- 🎨 **10 Example Patterns** - Learn from diverse examples including fractals, spirals, and geometric patterns
- ⚡ **Live Rendering** - See your changes render automatically as you type
- 🌙 **Dark Mode** - Beautiful dark theme optimized for long coding sessions
- 📊 **Performance Metrics** - Real-time render time display
- 🎯 **Error Handling** - Clear error messages to help debug your CFDG code
- 📱 **Responsive Layout** - Clean 3-column layout that adapts to your screen

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

From the root of the repository:

```bash
npm install
```

### Running the Editor

```bash
npm run dev
```

Then open [http://localhost:5173/](http://localhost:5173/) in your browser.

### Building for Production

```bash
npm run build:editor
```

The built files will be in the `dist-editor` directory.

## Example Gallery

The editor includes 10 carefully curated examples:

1. **Kochlea** - Beautiful spiral pattern with colors (by zol)
2. **Sierpinski Triangle** - Classic fractal pattern using recursive triangles
3. **Tree** - Recursive tree with branching pattern
4. **Spiral** - Simple colorful spiral pattern
5. **Koch Snowflake** - Famous snowflake fractal pattern
6. **Dragon Curve** - Dragon curve fractal
7. **Circles Grid** - Grid of colorful circles with variations
8. **Squares Pattern** - Rotating and scaling squares creating a tunnel effect
9. **Flower** - Simple flower pattern with petals
10. **Hilbert Curve** - Space-filling Hilbert curve

## Using the Editor

1. **Select an Example** - Click on any example in the left panel to load it
2. **Edit the Code** - Modify the CFDG code in the center editor panel
3. **Watch it Render** - The canvas on the right updates automatically
4. **Check Performance** - Render time is displayed above the editor
5. **Debug Errors** - Any syntax errors appear below the editor in red

## CFDG Language Basics

Context Free Design Grammar is a simple language for describing generative art:

- **Shapes**: `CIRCLE`, `SQUARE`, `TRIANGLE`
- **Transformations**: `x`, `y` (position), `r` (rotation), `s` (scale)
- **Colors**: `h` (hue), `sat` (saturation), `b` (brightness), `a` (alpha)
- **Rules**: Define recursive patterns with probability weights

Example:
```cfdg
startshape myshape

rule myshape {
    CIRCLE { }
    myshape { x 1 s 0.9 r 10 }
}
```

## Technology Stack

- **React 19** - UI library
- **TypeScript** - Type-safe JavaScript
- **Vite** - Fast build tool and dev server
- **Tailwind CSS v3** - Utility-first CSS framework
- **Context Free JS** - CFDG renderer

## Contributing

Contributions are welcome! Feel free to:

- Add new example patterns
- Improve the UI/UX
- Fix bugs
- Add new features

## License

MIT License - see the main repository LICENSE file for details.
