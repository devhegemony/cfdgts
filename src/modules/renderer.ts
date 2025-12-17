/**
 * Renderer module - handles drawing shapes to canvas
 */

import { Shape } from '../types';
import { hsv2rgb } from '../utils/color';
import { loop } from './expansion';

export interface RendererContext {
  canvas: HTMLCanvasElement;
  context: CanvasRenderingContext2D;
  shapes: Shape[];
  scale: number;
  clip: boolean;
  left: number;
  right: number;
  top: number;
  bottom: number;
  x: number;
  y: number;
  intervalID: number | null;
  callback: (() => void) | null;
}

/**
 * Draw all generated shapes to the canvas
 */
export function drawShape(this: RendererContext): void {
  // Sort shapes by z-order and area
  this.shapes.sort((a, b) => b.z - a.z || a.area - b.area);
  
  // Remove shapes that are too small to see
  let i = 0;
  const len = this.shapes.length;
  while (i < len && this.shapes[i].area * this.scale * this.scale < 0.3) i++;
  this.shapes.splice(0, i);

  if (!this.shapes.length) {
    stop.call(this);
    return;
  }

  // Recalculate bounds if not clipping
  if (!this.clip) {
    this.left = this.right = 0;
    this.top = this.bottom = 0;
    
    this.shapes.forEach((shape) => {
      if (this.left > shape.left!) this.left = shape.left!;
      if (this.right < shape.right!) this.right = shape.right!;
      if (this.top > shape.top!) this.top = shape.top!;
      if (this.bottom < shape.bottom!) this.bottom = shape.bottom!;
    });
    
    this.x = -(this.left + this.right) / 2;
    this.y = -(this.top + this.bottom) / 2;
  }

  // Set up the canvas transform
  this.context.translate(this.canvas.width / 2, this.canvas.height / 2);
  this.context.scale(this.scale, -this.scale);
  this.context.translate(this.x, this.y);

  // Draw shapes
  loop(
    function(this: RendererContext) {
      const shape = this.shapes.pop()!;
      this.context.save();
      this.context.transform(...shape.transform);
      this.context.fillStyle = 'rgba(' + hsv2rgb(...shape.color).join(',') + ')';
      this.context.scale(1.025, 1.025);
      shape.render.call(this);
      this.context.restore();
      return this.shapes.length;
    }.bind(this),
    () => stop.call(this),
    this
  );
}

/**
 * Stop the rendering process
 */
export function stop(this: RendererContext): void {
  if (this.intervalID) {
    window.clearInterval(this.intervalID);
    this.intervalID = null;
  }
  if (this.callback) {
    this.callback.call(null);
    this.callback = null;
  }
}

/**
 * Initialize rendering - clear canvas and set background
 */
export function initializeCanvas(
  this: RendererContext,
  background?: [number, number, number, number]
): void {
  this.context.setTransform(1, 0, 0, 1, 0, 0);
  this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
  
  if (background) {
    this.context.fillStyle = 'rgba(' + hsv2rgb(...background).join(',') + ')';
    this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }
}
