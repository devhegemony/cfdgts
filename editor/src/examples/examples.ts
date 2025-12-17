export interface Example {
  name: string;
  description: string;
  code: string;
}

export const examples: Example[] = [
  {
    name: "Kochlea",
    description: "Original Kochlea by zol - A beautiful spiral pattern with colors",
    code: `// original: Kochlea by zol
// licensed: Creative Commons Attribution-ShareAlike 3.0

background { b -1 }
startshape init

rule init {
    turn [ b 1 a -1 sat 1 h 310 ]
}

rule turn {
    SQUARE [ x .5 y -.05 s 1 .1 ]
    CIRCLE [ x 1.77 y .13 s .5 ]
    turn [ z 1 r -2.07028 s 0.298966 a .1 h 90 sat -.3 ]
    turn [ z 1 x 1 r 45.9297 s .324258 a .1 sat .1 ]
    turn [ z 1 x 1.72574 y .806014 r -48 s .922 ]
}`
  },
  {
    name: "Sierpinski Triangle",
    description: "Classic fractal pattern using recursive triangles",
    code: `// Sierpinski Triangle Fractal
background { b 1 }
startshape sierpinski

rule sierpinski {
    triangle { }
    sierpinski { s 0.5 x 0.5 y 0.433 }
    sierpinski { s 0.5 x -0.5 y 0.433 }
    sierpinski { s 0.5 y -0.433 }
}

rule triangle {
    TRIANGLE { }
}`
  },
  {
    name: "Tree",
    description: "Recursive tree with branching pattern",
    code: `// Recursive Tree
background { b 0.9 }
startshape tree

rule tree {
    branch { }
}

rule branch {
    SQUARE { s 0.1 1 }
    branch { y 0.9 s 0.7 r 20 }
    branch { y 0.9 s 0.7 r -20 }
}

rule branch 0.3 {
    SQUARE { s 0.1 1 }
    branch { y 0.9 s 0.8 r 15 }
}

rule branch 0.1 {
    CIRCLE { s 0.2 b 0.3 h 120 sat 0.8 }
}`
  },
  {
    name: "Spiral",
    description: "Simple colorful spiral pattern",
    code: `// Colorful Spiral
background { b -1 }
startshape spiral

rule spiral {
    CIRCLE { s 0.5 }
    spiral { r 10 s 0.98 x 0.1 h 5 }
}

rule spiral 0.01 { }`
  },
  {
    name: "Koch Snowflake",
    description: "Famous snowflake fractal pattern",
    code: `// Koch Snowflake
background { b 1 }
startshape snowflake

rule snowflake {
    koch { }
    koch { r 120 }
    koch { r 240 }
}

rule koch {
    koch_segment { }
}

rule koch_segment {
    SQUARE { s 0.05 0.3 }
}

rule koch_segment {
    koch_segment { s 0.33 }
    koch_segment { x 0.33 r -60 s 0.33 }
    koch_segment { x 0.5 r 60 s 0.33 }
    koch_segment { x 0.67 s 0.33 }
}`
  },
  {
    name: "Dragon Curve",
    description: "Dragon curve fractal",
    code: `// Dragon Curve
background { b 1 }
startshape dragon

rule dragon {
    dragon_l { }
}

rule dragon_l {
    SQUARE { s 0.05 0.5 }
    dragon_l { x 0.5 r -45 s 0.7 }
}

rule dragon_l {
    SQUARE { s 0.05 0.5 }
    dragon_r { x 0.5 r 45 s 0.7 }
}

rule dragon_r {
    SQUARE { s 0.05 0.5 }
    dragon_r { x 0.5 r 45 s 0.7 }
}

rule dragon_r {
    SQUARE { s 0.05 0.5 }
    dragon_l { x 0.5 r -45 s 0.7 }
}`
  },
  {
    name: "Circles Grid",
    description: "Grid of colorful circles with variations",
    code: `// Circles Grid
background { b 0.1 }
startshape grid

rule grid {
    row { }
    grid { y 1.2 }
}

rule grid 0.01 { }

rule row {
    cell { }
    row { x 1.2 }
}

rule row 0.01 { }

rule cell {
    CIRCLE { h 0 sat 1 b 0.8 }
}

rule cell {
    CIRCLE { h 120 sat 1 b 0.8 }
}

rule cell {
    CIRCLE { h 240 sat 1 b 0.8 }
}`
  },
  {
    name: "Squares Pattern",
    description: "Rotating and scaling squares creating a tunnel effect",
    code: `// Squares Tunnel
background { b -1 }
startshape tunnel

rule tunnel {
    SQUARE { }
    tunnel { s 0.95 r 5 b 0.02 h 2 }
}

rule tunnel 0.001 { }`
  },
  {
    name: "Flower",
    description: "Simple flower pattern with petals",
    code: `// Flower Pattern
background { b 0.9 }
startshape flower

rule flower {
    petal { r 0 }
    petal { r 45 }
    petal { r 90 }
    petal { r 135 }
    petal { r 180 }
    petal { r 225 }
    petal { r 270 }
    petal { r 315 }
    CIRCLE { s 0.3 h 60 sat 1 b 0.8 }
}

rule petal {
    CIRCLE { y 0.5 s 0.4 0.6 h 350 sat 0.9 b 0.9 }
}`
  },
  {
    name: "Hilbert Curve",
    description: "Space-filling Hilbert curve",
    code: `// Hilbert Curve
background { b 1 }
startshape hilbert

rule hilbert {
    hilbert_a { }
}

rule hilbert_a {
    hilbert_d { r 90 }
    SQUARE { s 0.05 0.5 }
    hilbert_a { y 0.5 }
    SQUARE { s 0.05 0.5 r 90 x 0.25 y 0.25 }
    hilbert_a { x 0.5 }
    SQUARE { s 0.05 0.5 y 0.5 }
    hilbert_b { r -90 x 0.5 y 0.5 }
}

rule hilbert_a 0.05 {
    SQUARE { s 0.05 0.5 }
}

rule hilbert_b {
    hilbert_c { r -90 }
    SQUARE { s 0.05 0.5 }
    hilbert_b { y 0.5 }
    SQUARE { s 0.05 0.5 r 90 x 0.25 y 0.25 }
    hilbert_b { x 0.5 }
    SQUARE { s 0.05 0.5 y 0.5 }
    hilbert_a { r 90 x 0.5 y 0.5 }
}

rule hilbert_b 0.05 {
    SQUARE { s 0.05 0.5 }
}

rule hilbert_c {
    hilbert_b { r 90 }
    SQUARE { s 0.05 0.5 }
    hilbert_c { y 0.5 }
    SQUARE { s 0.05 0.5 r 90 x 0.25 y 0.25 }
    hilbert_c { x 0.5 }
    SQUARE { s 0.05 0.5 y 0.5 }
    hilbert_d { r -90 x 0.5 y 0.5 }
}

rule hilbert_c 0.05 {
    SQUARE { s 0.05 0.5 }
}

rule hilbert_d {
    hilbert_a { r -90 }
    SQUARE { s 0.05 0.5 }
    hilbert_d { y 0.5 }
    SQUARE { s 0.05 0.5 r 90 x 0.25 y 0.25 }
    hilbert_d { x 0.5 }
    SQUARE { s 0.05 0.5 y 0.5 }
    hilbert_c { r 90 x 0.5 y 0.5 }
}

rule hilbert_d 0.05 {
    SQUARE { s 0.05 0.5 }
}`
  }
];
