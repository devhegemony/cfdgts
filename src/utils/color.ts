/**
 * Color utility functions
 */

import { RGBAColor } from '../types';

/**
 * Convert HSV color to RGB
 * @param h - Hue (0-360)
 * @param s - Saturation (0-1)
 * @param v - Value/Brightness (0-1)
 * @param a - Alpha (0-1)
 * @returns RGB color with alpha [r, g, b, a]
 */
export function hsv2rgb(h: number, s: number, v: number, a: number): RGBAColor {
  let r: number, g: number, b: number;
  
  if (s === 0) {
    r = g = b = Math.round(v * 0xff);
  } else {
    v *= 0xff;
    h = ((h %= 360) < 0 ? h + 360 : h) / 60;
    const hi = h | 0;
    
    switch (hi) {
      case 0:
        r = Math.round(v);
        g = Math.round(v * (1 - (1 - h + hi) * s));
        b = Math.round(v * (1 - s));
        break;
      case 1:
        r = Math.round(v * (1 - s * h + s * hi));
        g = Math.round(v);
        b = Math.round(v * (1 - s));
        break;
      case 2:
        r = Math.round(v * (1 - s));
        g = Math.round(v);
        b = Math.round(v * (1 - (1 - h + hi) * s));
        break;
      case 3:
        r = Math.round(v * (1 - s));
        g = Math.round(v * (1 - s * h + s * hi));
        b = Math.round(v);
        break;
      case 4:
        r = Math.round(v * (1 - (1 - h + hi) * s));
        g = Math.round(v * (1 - s));
        b = Math.round(v);
        break;
      case 5:
        r = Math.round(v);
        g = Math.round(v * (1 - s));
        b = Math.round(v * (1 - s * h + s * hi));
        break;
      default:
        r = g = b = 0;
    }
  }
  
  return [r, g, b, a];
}
