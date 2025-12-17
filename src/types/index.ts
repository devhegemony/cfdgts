/**
 * Type definitions for ContextFree.js
 */

/**
 * 2D transformation matrix [a, b, c, d, e, f]
 * Represents: | a c e |
 *             | b d f |
 *             | 0 0 1 |
 */
export type Transform = [number, number, number, number, number, number];

/**
 * Color in HSV format with alpha: [hue, saturation, value, alpha]
 * hue: 0-360, saturation: 0-1, value: 0-1, alpha: 0-1
 */
export type Color = [number, number, number, number];

/**
 * RGB color with alpha: [red, green, blue, alpha]
 * red: 0-255, green: 0-255, blue: 0-255, alpha: 0-1
 */
export type RGBAColor = [number, number, number, number];

/**
 * Complete modification state for a shape
 */
export type Modification = [Transform, Color, Color, number, number];

/**
 * Primitive render function
 */
export type PrimitiveRenderFunction = (this: any) => void;

/**
 * Replacement function that generates new shapes
 */
export type ReplacementFunction = (
  this: any,
  transform: Transform,
  color: Color,
  targetColor: Color,
  z: number,
  zScale: number
) => void;

/**
 * Rule definition
 */
export interface Rule {
  weight?: number;
  probability?: number;
  replacements: ReplacementFunction[];
}

/**
 * Shape to be rendered
 */
export interface Shape {
  render: PrimitiveRenderFunction;
  transform: Transform;
  color: Color;
  area: number;
  z: number;
  left?: number;
  right?: number;
  top?: number;
  bottom?: number;
}

/**
 * Compiled adjustment result
 */
export interface CompiledAdjustment {
  transform: Transform;
  color: number[];
  targetColor: number[];
  z: number;
  zScale: number;
}

/**
 * Parser statement types
 */
export type Statement =
  | ['STARTSHAPE', string]
  | ['BACKGROUND', any]
  | ['SIZE', any]
  | ['RULE', string, number, any]
  | ['PATH', string, any];

/**
 * Adjustment types
 */
export type Adjustment =
  | ['XSHIFT', number]
  | ['YSHIFT', number]
  | ['ZSHIFT', number]
  | ['ROTATE', number]
  | ['SIZE', number, number, number]
  | ['SKEW', number, number]
  | ['FLIP', number]
  | ['HUE', number, boolean]
  | ['SATURATION', number, boolean]
  | ['BRIGHTNESS', number, boolean]
  | ['ALPHA', number, boolean]
  | ['TARGETHUE', number]
  | ['TARGETSATURATION', number]
  | ['TARGETBRIGHTNESS', number]
  | ['TARGETALPHA', number];

/**
 * Replacement types from parser
 */
export type Replacement = ['REPLACEMENT' | 'REPLACEMENT_LOOP', string, any, ...any[]];

/**
 * ContextFree configuration options
 */
export interface ContextFreeOptions {
  canvas: HTMLCanvasElement;
  source: string;
}
