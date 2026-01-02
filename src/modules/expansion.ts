/**
 * Expansion module - handles shape expansion and generation
 */

import { ReplacementFunction, Modification } from '../types';

export interface ExpansionContext {
  stack: Array<() => void>;
  shapes: any[];
  startshape: ReplacementFunction | null;
  renderStartTime?: number;
  maxRenderTime?: number;
  maxShapes?: number;
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
    this,
    this.renderStartTime,
    this.maxRenderTime,
    this.maxShapes
  );
}

/**
 * Loop function that processes shapes in batches with timing control
 * @param loopFn - Function to call repeatedly
 * @param callback - Callback when loop completes
 * @param context - Context to bind to loop function
 * @param startTime - Optional start time for timeout check (milliseconds)
 * @param maxTime - Optional maximum time allowed in milliseconds (default 5000ms)
 * @param maxShapes - Optional maximum number of shapes allowed (default 20000)
 */
export function loop(
  loopFn: () => boolean | number,
  callback: () => void,
  context: any,
  startTime?: number,
  maxTime: number = 5000,
  maxShapes: number = 20000
): void {
  const intervalContext = {
    intervalID: null as number | null,
    count: 0
  };

  if (intervalContext.intervalID) {
    window.clearInterval(intervalContext.intervalID);
  }

  const renderStartTime = startTime || Date.now();

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
    } else {
      // Check timeout (default 5 seconds)
      const elapsed = Date.now() - renderStartTime;
      if (elapsed >= maxTime) {
        window.clearInterval(intervalID);
        callback.call(context);
        return;
      }
      
      // Check shape count limit (default 20000)
      if (context.shapes && context.shapes.length >= maxShapes) {
        window.clearInterval(intervalID);
        callback.call(context);
        return;
      }
      
      intervalContext.count++;
    }
  }, 30);

  intervalContext.intervalID = intervalID;
}
