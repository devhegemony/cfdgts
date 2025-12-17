/**
 * Adjustment module - handles transformations and color adjustments
 */

import { Transform, Color } from '../types';

/**
 * Apply a transformation adjustment to an existing transform
 * @param transform - Current transformation matrix
 * @param adjustment - Adjustment transformation to apply
 * @returns New transformation matrix
 */
export function adjustTransform(transform: Transform, adjustment: Transform): Transform {
  return [
    transform[0] * adjustment[0] + transform[2] * adjustment[1],
    transform[1] * adjustment[0] + transform[3] * adjustment[1],
    transform[0] * adjustment[2] + transform[2] * adjustment[3],
    transform[1] * adjustment[2] + transform[3] * adjustment[3],
    transform[0] * adjustment[4] + transform[2] * adjustment[5] + transform[4],
    transform[1] * adjustment[4] + transform[3] * adjustment[5] + transform[5]
  ];
}

/**
 * Adjust a color based on adjustment values
 * @param color - Current color [h, s, v, a]
 * @param adjustment - Adjustment values
 * @param target - Target color for relative adjustments
 * @returns New adjusted color
 */
export function adjustColor(color: Color, adjustment: number[], target?: Color): Color {
  const result = color.slice() as Color;
  let a: number, t: number | undefined;

  // Adjust hue
  if ((a = adjustment[0])) {
    if (adjustment[4] & 1) {
      t = target![0];
      if (a > 0) {
        if (t < result[0]) t += 360;
        result[0] += (t - result[0]) * a;
      } else {
        if (t > result[0]) t -= 360;
        result[0] += (result[0] - t) * a;
      }
    } else {
      result[0] += adjustment[0];
    }
    result[0] %= 360;
    if (result[0] < 0) result[0] += 360;
  }

  // Adjust saturation, brightness, and alpha
  for (let i = 1; i < 4; i++) {
    if ((a = adjustment[i])) {
      if (adjustment[4] & (1 << i)) {
        if (a > 0) {
          result[i] += (target![i] - result[i]) * a;
        } else {
          result[i] += (result[i] - (result[i] < target![i] ? 0 : 1)) * a;
        }
      } else {
        if (a > 0) {
          result[i] += (1 - result[i]) * a;
        } else {
          result[i] += result[i] * a;
        }
      }
    }
  }

  return result;
}
