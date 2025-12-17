/**
 * ContextFree.js - TypeScript implementation
 * Main class that orchestrates parsing, compilation, expansion, and rendering
 */

import {
  Transform,
  Color,
  Shape,
  Rule,
  Statement,
  PrimitiveRenderFunction,
  ReplacementFunction
} from './types';
import { adjustColor } from './modules/adjustment';
import {
  compileAdjustment,
  compileReplacement,
  compileReplacements,
  compilePath,
  CompilerContext
} from './modules/compiler';
import { expandShape } from './modules/expansion';
import { drawShape, stop, initializeCanvas, RendererContext } from './modules/renderer';

// Global CFDG parser (loaded separately)
declare const CFDG: {
  parse: (source: string) => Statement[];
  yy: {
    rand_static: number;
  };
};

/**
 * Main ContextFree class
 */
export class ContextFree {
  // Canvas and rendering context
  public canvas: HTMLCanvasElement;
  public context: CanvasRenderingContext2D;
  
  // Display properties
  public x: number = 0;
  public y: number = 0;
  public left: number = 0;
  public right: number = 0;
  public top: number = 0;
  public bottom: number = 0;
  public width: number = 1;
  public height: number = 1;
  public scale: number;
  public clip: boolean = false;
  
  // Background color
  public background?: Color;
  
  // Rules and primitives
  public rules: { [name: string]: Rule[] } = {};
  public primitives: { [name: string]: PrimitiveRenderFunction } = {};
  
  // Start shape
  public startshape: ReplacementFunction | null = null;
  
  // Expansion and rendering state
  public stack: Array<() => void> = [];
  public shapes: Shape[] = [];
  
  // Timing and control
  public intervalID: number | null = null;
  public callback: (() => void) | null = null;

  /**
   * Create a new ContextFree instance
   * @param source - CFDG source code
   * @param canvas - HTML canvas element to render to
   */
  constructor(source: string, canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.context = canvas.getContext('2d')!;
    this.scale = Math.min(canvas.width, canvas.height);

    // Initialize primitives
    this.initializePrimitives();

    // Parse and process the source
    this.parseSource(source);

    // Compile rules
    this.compileRules();

    // Calculate scale if clipping is enabled
    if (this.clip) {
      this.scale = Math.min(
        canvas.width / this.width,
        canvas.height / this.height
      );
    }

    // Validate start shape
    if (!this.startshape) {
      throw new Error('startshape is not defined');
    }
  }

  /**
   * Initialize built-in primitive shapes
   */
  private initializePrimitives(): void {
    this.primitives = {
      SQUARE: function(this: ContextFree) {
        this.context.fillRect(-0.5, -0.5, 1, 1);
      },
      CIRCLE: function(this: ContextFree) {
        this.context.beginPath();
        this.context.arc(0, 0, 0.5, 0, Math.PI * 2, false);
        this.context.fill();
      },
      TRIANGLE: function(this: ContextFree) {
        this.context.beginPath();
        this.context.moveTo(0, 0.57735);
        this.context.lineTo(-0.5, -0.28828);
        this.context.lineTo(0.5, -0.28828);
        this.context.closePath();
        this.context.fill();
      }
    };
  }

  /**
   * Parse CFDG source code
   */
  private parseSource(source: string): void {
    CFDG.yy.rand_static = Math.random();
    const statements = CFDG.parse(source);

    statements.forEach((statement) => {
      switch (statement[0]) {
        case 'STARTSHAPE':
          this.startshape = compileReplacement.call(
            this as any as CompilerContext,
            ['REPLACEMENT', statement[1], ['ADJUSTMENTS', []]]
          );
          break;

        case 'BACKGROUND':
          const adjustment = compileAdjustment.call(
            this as any as CompilerContext,
            statement[1]
          );
          this.background = adjustColor([0, 0, 1, 1], adjustment.color);
          break;

        case 'SIZE':
          this.clip = true;
          statement[1][1].forEach((adj: any) => {
            switch (adj[0]) {
              case 'XSHIFT':
                this.x = adj[1];
                break;
              case 'YSHIFT':
                this.y = adj[1];
                break;
              case 'SIZE':
                this.width = adj[1];
                this.height = adj[2];
                break;
            }
          });
          break;

        case 'RULE':
          const rule: Rule = {
            weight: statement[2],
            replacements: statement[3]
          };
          if (this.rules[statement[1]] != null) {
            this.rules[statement[1]].push(rule);
          } else {
            this.rules[statement[1]] = [rule];
          }
          break;

        case 'PATH':
          this.primitives[statement[1]] = compilePath.call(
            this as any as CompilerContext,
            statement[2]
          );
          break;
      }
    });
  }

  /**
   * Compile rules into executable functions
   */
  private compileRules(): void {
    // Create rules for primitives
    let n = 0;
    for (const name in this.primitives) {
      const render = this.primitives[name];
      this.rules[name] = [
        {
          replacements: [
            function(
              this: ContextFree,
              transform: Transform,
              color: Color,
              _targetColor: Color,
              z: number,
              _zScale: number
            ) {
              const area = Math.abs(transform[0] * transform[3] - transform[1] * transform[2]);
              if (area * this.scale * this.scale < 0.3) return;

              const shape: Shape = {
                render,
                transform,
                color,
                area,
                z
              };
              this.shapes.push(shape);

              if (!this.clip) {
                const size = Math.sqrt(area);
                shape.left = transform[4] - size;
                shape.right = transform[4] + size;
                shape.top = transform[5] - size;
                shape.bottom = transform[5] + size;

                if (this.left > shape.left) this.left = shape.left;
                if (this.right < shape.right) this.right = shape.right;
                if (this.top > shape.top) this.top = shape.top;
                if (this.bottom < shape.bottom) this.bottom = shape.bottom;

                if (
                  this.width < this.right - this.left ||
                  this.height < this.bottom - this.top
                ) {
                  this.width = this.right - this.left;
                  this.height = this.bottom - this.top;
                  this.scale = Math.min(
                    this.canvas.width / this.width,
                    this.canvas.height / this.height
                  );
                  
                  if (n++ > 100 && this.shapes.length > 1000) {
                    n = 0;
                    this.shapes = this.shapes.filter((shape) => {
                      return shape.area * this.scale * this.scale > 0.3;
                    });
                  }
                }
              }
            }
          ],
          probability: 1
        }
      ];
    }

    // Compile user-defined rules
    for (const name in this.rules) {
      if (name in this.primitives) continue;

      const sum = this.rules[name].reduce((sum, rule) => sum + (rule.weight || 0), 0);
      this.rules[name].forEach((rule) => {
        rule.probability = (rule.weight || 0) / sum;
        rule.replacements = compileReplacements.call(
          this as any as CompilerContext,
          rule.replacements as any
        );
      });
    }
  }

  /**
   * Render the context-free design
   * @param callback - Called when rendering is complete
   */
  public render(callback?: () => void): void {
    this.callback = callback || null;

    // Initialize canvas
    initializeCanvas.call(this as any as RendererContext, this.background);

    // Start expansion
    expandShape.call(
      this as any,
      () => drawShape.call(this as any as RendererContext)
    );
  }

  /**
   * Stop the rendering process
   */
  public stop(): void {
    stop.call(this as any as RendererContext);
  }
}

// Export for window/global (for browser compatibility)
declare const window: any;
if (typeof window !== 'undefined') {
  window.ContextFree = ContextFree;
}
