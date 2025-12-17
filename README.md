contextfree.js
==============

JavaScript Implementation of [Context Free](http://www.contextfreeart.org/).

Almost compatible with Context Free 2.x, but tile directive and path directive are not supported yet.

See [demo](http://alpico.la/contextfree.js/).

## TypeScript Architecture

This package has been ported to TypeScript with a modular architecture for better maintainability and extensibility:

- **Modular design**: Core functionality is split into separate modules:
  - `compiler`: Handles compilation of CFDG statements into executable functions
  - `expansion`: Manages shape expansion and generation
  - `renderer`: Handles canvas drawing and rendering
  - `adjustment`: Provides transformation and color adjustment utilities
  - `types`: Comprehensive TypeScript type definitions
  
- **Extensible**: Each module can be extended or customized independently
- **Type-safe**: Full TypeScript type definitions for better IDE support and fewer runtime errors

## Building

To build the project:

    npm install
    npm run build

This will:
1. Generate `cfdg.js` from `cfdg-parser-template.js` using the [Chevrotain](https://github.com/Chevrotain/chevrotain) parser
2. Compile TypeScript source files from `src/` to `dist/`
3. Create a browser-compatible bundle `contextfree.js`

### Build Scripts

- `npm run build` - Full build (parser + TypeScript + browser bundle)
- `npm run build:parser` - Generate parser only
- `npm run build:ts` - Compile TypeScript only
- `npm run build:browser` - Create browser bundle only
- `npm run clean` - Remove build artifacts

Usage
-----

    <script type="text/javascript" src="contextfree.js"></script>
    <script type="text/javascript" src="cfdg.js"></script>
    <script type="text/javascript">
        window.onload = function() {
            var src = '....'; // cfdg source
            var contextfree = new ContextFree(src, document.querySelector('canvas'));
            contextfree.render(function() {
                ... // called when rendering is done
            });
        };
    </script>

License
-------

MIT

Copyright (c) alpicola
