/**
 * Expansion module - handles shape expansion and generation
 */

import { ReplacementFunction, Modification } from '../types';

export interface ExpansionContext {
  stack: Array<() => void>;
  shapes: any[];
  startshape: ReplacementFunction | null;
}

/**
 * Initialize and expand shapes from the start shape
 */
export function expandShape(this: ExpansionContext, drawCallback: () => void): void {
  const modification: Modification = [
    [1, 0, 0, 1, 0, 0],
    [0, 0, 0, 1],
    [0, 0, 0, 1],
    0,
    1
  ];
  
  this.stack = [
    function(this: ExpansionContext) {
      this.startshape!.apply(this, modification);
    }
  ];
  this.shapes = [];

  loop(
    function(this: ExpansionContext) {
      this.stack.pop()!.call(this);
      return this.stack.length;
    }.bind(this),
    drawCallback,
    this
  );
}

/**
 * Loop function that processes shapes in batches with timing control
 * @param loopFn - Function to call repeatedly
 * @param callback - Callback when loop completes
 * @param context - Context to bind to loop function
 */
export function loop(
  loopFn: () => boolean | number,
  callback: () => void,
  context: any
): void {
  const intervalContext = {
    intervalID: null as number | null,
    count: 0
  };

  if (intervalContext.intervalID) {
    window.clearInterval(intervalContext.intervalID);
  }

  const intervalID = window.setInterval(() => {
    let shouldContinue: boolean | number = true;
    const start = Date.now();
    
    do {
      let n = 1000;
      while (--n && shouldContinue) {
        shouldContinue = loopFn.call(context);
      }
    } while (Date.now() - start < 30 && shouldContinue);

    if (!shouldContinue) {
      window.clearInterval(intervalID);
      callback.call(context);
    } else if (intervalContext.count++ > 3000) {
      window.clearInterval(intervalID);
      throw new Error('too much shapes');
    }
  }, 30);

  intervalContext.intervalID = intervalID;
}
