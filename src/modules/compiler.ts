/**
 * Compiler module - compiles CFDG statements into executable functions
 */

import { Transform, CompiledAdjustment, Replacement, ReplacementFunction, Rule } from '../types';
import { adjustTransform, adjustColor } from './adjustment';

export interface CompilerContext {
  rules: { [name: string]: Rule[] };
  primitives: { [name: string]: any };
  scale: number;
  stack: Array<() => void>;
  shapes: any[];
  clip: boolean;
  left: number;
  right: number;
  top: number;
  bottom: number;
  width: number;
  height: number;
  canvas: HTMLCanvasElement;
}

/**
 * Compile adjustment statements into executable form
 * @param adjustments - Array of adjustments from parser
 * @returns Compiled adjustment object
 */
export function compileAdjustment(
  this: CompilerContext,
  adjustments: any
): CompiledAdjustment {
  const geomAdjustments = ['XSHIFT', 'YSHIFT', 'ZSHIFT', 'ROTATE', 'SIZE', 'SKEW', 'FLIP'];
  const colorAdjustments = ['HUE', 'SATURATION', 'BRIGHTNESS', 'ALPHA'];
  
  let transform: Transform = [1, 0, 0, 1, 0, 0];
  const color: number[] = [];
  const targetColor: number[] = [];
  let z = 0;
  let zScale = 1;

  const ordered = adjustments[2];
  const adjustmentList = adjustments[1].slice();
  adjustmentList.forEach((adjustment: any) => {
    adjustmentList[adjustment[0]] = adjustment;
  });

  const toProcess = ordered
    ? adjustmentList
    : geomAdjustments.reduce((result: any[], type: string) => {
        if (type in adjustmentList) result.push(adjustmentList[type]);
        return result;
      }, []);

  toProcess.forEach((adjustment: any) => {
    let x: number, y: number, c: number, s: number;
    
    switch (adjustment[0]) {
      case 'XSHIFT':
        x = adjustment[1];
        transform = adjustTransform(transform, [1, 0, 0, 1, x, 0]);
        break;
      case 'YSHIFT':
        y = adjustment[1];
        transform = adjustTransform(transform, [1, 0, 0, 1, 0, y]);
        break;
      case 'ZSHIFT':
        z += adjustment[1];
        break;
      case 'ROTATE':
        c = Math.cos(Math.PI * adjustment[1] / 180);
        s = Math.sin(Math.PI * adjustment[1] / 180);
        transform = adjustTransform(transform, [c, s, -s, c, 0, 0]);
        break;
      case 'SIZE':
        x = adjustment[1];
        y = adjustment[2];
        transform = adjustTransform(transform, [x, 0, 0, y, 0, 0]);
        zScale *= adjustment[3];
        break;
      case 'SKEW':
        x = Math.tan(Math.PI * adjustment[1] / 180);
        y = Math.tan(Math.PI * adjustment[2] / 180);
        transform = adjustTransform(transform, [1, y, x, 1, 0, 0]);
        break;
      case 'FLIP':
        c = Math.cos(Math.PI * adjustment[1] / 90);
        s = Math.sin(Math.PI * adjustment[1] / 90);
        transform = adjustTransform(transform, [c, s, s, -c, 0, 0]);
        break;
    }
  });

  colorAdjustments.forEach((type: string, i: number) => {
    let adjustment;
    if ((adjustment = adjustmentList[type])) {
      color[i] = adjustment[1];
      if (adjustment[2]) color[4] |= (1 << i);
    }
    if ((adjustment = adjustmentList['TARGET' + type])) {
      targetColor[i] = adjustment[1];
    }
  });

  return {
    transform,
    color,
    targetColor,
    z,
    zScale
  };
}

/**
 * Compile a single replacement into an executable function
 * @param replacement - Replacement statement from parser
 * @returns Compiled replacement function
 */
export function compileReplacement(
  this: CompilerContext,
  replacement: Replacement
): ReplacementFunction {
  const adjustment = compileAdjustment.call(this, replacement[2]);

  if (replacement[0] === 'REPLACEMENT') {
    const rules = this.rules[replacement[1]];
    if (rules == null) {
      throw new Error(`rule '${replacement[1]}' is not defined`);
    }
    
    return function(this: CompilerContext, transform, color, targetColor, z, zScale) {
      const area = Math.abs(transform[0] * transform[3] - transform[1] * transform[2]);
      if (area * this.scale * this.scale < 0.3) return;

      transform = adjustTransform(transform, adjustment.transform);
      if (adjustment.color.length) {
        color = adjustColor(color, adjustment.color, targetColor);
      }
      if (adjustment.targetColor.length) {
        targetColor = adjustColor(targetColor, adjustment.targetColor);
      }
      z += adjustment.z * zScale;
      zScale *= adjustment.zScale;

      let rule: Rule;
      if (rules.length > 1) {
        let p = 0;
        const r = Math.random();
        for (let i = 0, len = rules.length; i < len; i++) {
          p += rules[i].probability!;
          if (r < p) {
            rule = rules[i];
            break;
          }
        }
        rule = rule! || rules[0];
      } else {
        rule = rules[0];
      }

      const modification: [Transform, any, any, number, number] = [transform, color, targetColor, z, zScale];
      Array.prototype.push.apply(
        this.stack,
        rule.replacements.map((replacement) => {
          return function(this: CompilerContext) {
            replacement.call(this, ...modification);
          };
        })
      );
    };
  }

  if (replacement[0] === 'REPLACEMENT_LOOP') {
    const replacements = compileReplacements.call(this, replacement[3]);
    
    return function(this: CompilerContext, transform, color, targetColor, z, zScale) {
      const area = Math.abs(transform[0] * transform[3] - transform[1] * transform[2]);
      if (area * this.scale * this.scale < 0.3) return;

      let n = Number(replacement[1]);
      while (n-- > 0) {
        const modification: [Transform, any, any, number, number] = [transform, color, targetColor, z, zScale];
        Array.prototype.push.apply(
          this.stack,
          replacements.map((replacement) => {
            return function(this: CompilerContext) {
              replacement.call(this, ...modification);
            };
          })
        );

        if (!n) return;

        transform = adjustTransform(transform, adjustment.transform);
        if (adjustment.color.length) {
          color = adjustColor(color, adjustment.color, targetColor);
        }
        if (adjustment.targetColor.length) {
          targetColor = adjustColor(targetColor, adjustment.targetColor);
        }
        z += adjustment.z * zScale;
        zScale *= adjustment.zScale;
      }
    };
  }

  throw new Error(`Unknown replacement type: ${replacement[0]}`);
}

/**
 * Compile multiple replacements
 * @param replacements - Array of replacements from parser
 * @returns Array of compiled replacement functions
 */
export function compileReplacements(
  this: CompilerContext,
  replacements: Replacement[]
): ReplacementFunction[] {
  return replacements
    .map((replacement: Replacement, i: number) => {
      return {
        replacement,
        index: replacement[1] in this.primitives ? replacements.length - i : -1
      };
    })
    .sort((a, b) => a.index - b.index)
    .map((o) => compileReplacement.call(this, o.replacement));
}

/**
 * Compile a path definition (not yet implemented)
 * @param _path - Path statement from parser
 * @returns Compiled path function
 */
export function compilePath(this: CompilerContext, _path: any): any {
  // Path compilation not yet implemented
  return undefined;
}
