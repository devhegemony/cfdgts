/*
 * contextfree.js v0.1.1
 *
 * Copyright (c) 2011 alpicola
 * Licensed under the MIT license
 */

// Type definitions for the CFDG parser
interface CFDG {
    yy: {
        rand_static: number;
    };
    parse(source: string): Statement[];
}

declare const CFDG: CFDG;

// Statement types from the parser
type Statement = 
    | ['STARTSHAPE', string]
    | ['BACKGROUND', Adjustments]
    | ['SIZE', Modification]
    | ['RULE', string, number, Replacement[]]
    | ['PATH', string, any];

type Replacement = 
    | ['REPLACEMENT', string, Adjustments]
    | ['REPLACEMENT_LOOP', number, Adjustments, Replacement[]];

type Adjustments = ['ADJUSTMENTS', Adjustment[], boolean?];

type Adjustment =
    | ['XSHIFT', number]
    | ['YSHIFT', number]
    | ['ZSHIFT', number]
    | ['ROTATE', number]
    | ['SIZE', number, number, number]
    | ['SKEW', number, number]
    | ['FLIP', number]
    | ['HUE', number, boolean?]
    | ['SATURATION', number, boolean?]
    | ['BRIGHTNESS', number, boolean?]
    | ['ALPHA', number, boolean?]
    | ['TARGETHUE', number]
    | ['TARGETSATURATION', number]
    | ['TARGETBRIGHTNESS', number]
    | ['TARGETALPHA', number];

type Modification = [Adjustments, Adjustments];

// Internal types
type Transform = [number, number, number, number, number, number];
type Color = [number, number, number, number];
type ColorAdjustment = [number?, number?, number?, number?, number?];

interface Shape {
    render: () => void;
    transform: Transform;
    color: Color;
    area: number;
    z: number;
    left?: number;
    right?: number;
    top?: number;
    bottom?: number;
}

interface Rule {
    weight: number;
    probability?: number;
    replacements: ReplacementFunction[];
}

type ReplacementFunction = (
    transform: Transform,
    color: Color,
    targetColor: Color,
    z: number,
    zScale: number
) => void;

type StackFunction = () => void;

interface CompiledAdjustment {
    transform: Transform;
    color: ColorAdjustment;
    targetColor: ColorAdjustment;
    z: number;
    zScale: number;
}

interface ReplacementWithIndex {
    replacement: Replacement;
    index: number;
}

const ContextFree = (function() {

'use strict';

class ContextFree {
    canvas: HTMLCanvasElement;
    context: CanvasRenderingContext2D;
    x: number = 0;
    y: number = 0;
    left: number = 0;
    right: number = 0;
    top: number = 0;
    bottom: number = 0;
    width: number = 1;
    height: number = 1;
    scale: number;
    clip: boolean = false;
    rules: { [key: string]: Rule[] } = {};
    primitives: { [key: string]: () => void };
    background?: Color;
    startshape?: ReplacementFunction;
    callback?: (() => void) | null;
    intervalID?: number | null;
    stack: StackFunction[] = [];
    shapes: Shape[] = [];

    constructor(source: string, canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
            throw new Error('Unable to get 2d context from canvas');
        }
        this.context = ctx;
        this.scale = Math.min(canvas.width, canvas.height);
        this.primitives = {
            SQUARE: () => {
                this.context.fillRect(-0.5, -0.5, 1, 1);
            },
            CIRCLE: () => {
                this.context.beginPath();
                this.context.arc(0, 0, 0.5, 0, Math.PI * 2, false);
                this.context.fill();
            },
            TRIANGLE: () => {
                this.context.beginPath();
                this.context.moveTo(0, 0.57735);
                this.context.lineTo(-0.5, -0.28828);
                this.context.lineTo(0.5, -0.28828);
                this.context.closePath();
                this.context.fill();
            }
        };

        CFDG.yy.rand_static = Math.random();
        CFDG.parse(source).forEach((statement: Statement) => {
            switch (statement[0]) {
                case 'STARTSHAPE':
                    this.startshape = this.compileReplacement([
                        'REPLACEMENT', statement[1], ['ADJUSTMENTS', []]
                    ]);
                    break;
                case 'BACKGROUND':
                    const adjustment = this.compileAdjustment(statement[1]);
                    this.background = this.adjustColor([0, 0, 1, 1], adjustment.color);
                    break;
                case 'SIZE':
                    this.clip = true;
                    (statement[1] as Modification)[1][1].forEach((adjustment: Adjustment) => {
                        switch (adjustment[0]) {
                            case 'XSHIFT':
                                this.x = adjustment[1];
                                break;
                            case 'YSHIFT':
                                this.y = adjustment[1];
                                break;
                            case 'SIZE':
                                this.width = adjustment[1];
                                this.height = adjustment[2];
                                break;
                        }
                    });
                    break;
                case 'RULE':
                    const rule: Rule = {
                        weight: statement[2],
                        replacements: statement[3] as any
                    };
                    if (this.rules[statement[1]] != null) {
                        this.rules[statement[1]].push(rule);
                    } else {
                        this.rules[statement[1]] = [rule];
                    }
                    break;
                case 'PATH':
                    this.primitives[statement[1]] = this.compilePath(statement[2]);
                    break;
            }
        });

        let n = 0;
        for (const name in this.primitives) {
            ((name: string) => {
                const render = this.primitives[name];
                this.rules[name] = [{
                    weight: 1,
                    replacements: [(
                        transform: Transform,
                        color: Color,
                        targetColor: Color,
                        z: number,
                        zScale: number
                    ) => {
                        const area = Math.abs(transform[0] * transform[3] - transform[1] * transform[2]);
                        if (area * this.scale * this.scale < 0.3) return;

                        const shape: Shape = {
                            render: render,
                            transform: transform,
                            color: color,
                            area: area,
                            z: z
                        };
                        this.shapes.push(shape);

                        if (!this.clip) {
                            const size = Math.sqrt(area);
                            if (this.left > (shape.left = transform[4] - size)) {
                                this.left = shape.left;
                            }
                            if (this.right < (shape.right = transform[4] + size)) {
                                this.right = shape.right;
                            }
                            if (this.top > (shape.top = transform[5] - size)) {
                                this.top = shape.top;
                            }
                            if (this.bottom < (shape.bottom = transform[5] + size)) {
                                this.bottom = shape.bottom;
                            }

                            if (this.width < this.right - this.left ||
                                this.height < this.bottom - this.top) {
                                this.width = this.right - this.left;
                                this.height = this.bottom - this.top;
                                this.scale = Math.min(
                                    this.canvas.width / this.width,
                                    this.canvas.height / this.height
                                );
                                if (n++ > 100 && this.shapes.length > 1000) {
                                    n = 0;
                                    this.shapes = this.shapes.filter((shape: Shape) => {
                                        return shape.area * this.scale * this.scale > 0.3;
                                    });
                                }
                            }
                        }
                    }],
                    probability: 1
                }];
            })(name);
        }

        for (const name in this.rules) {
            if (name in this.primitives) continue;

            const sum = this.rules[name].reduce((sum: number, rule: Rule) => {
                return sum + rule.weight;
            }, 0);
            this.rules[name].forEach((rule: Rule) => {
                rule.probability = rule.weight / sum;
                rule.replacements = this.compileReplacements(rule.replacements as any);
            });
        }

        if (this.clip) {
            this.scale = Math.min(
                canvas.width / this.width,
                canvas.height / this.height
            );
        }

        if (!this.startshape) {
            throw new Error('startshape is not defined');
        }
    }

    render(callback?: () => void): void {
        this.callback = callback;

        this.context.setTransform(1, 0, 0, 1, 0, 0);
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
        if (this.background) {
            this.context.fillStyle = 'rgba(' + hsv2rgb(...this.background) + ')';
            this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
        }

        this.expandShape();
    }

    loop(loop: () => boolean, callback: () => void): void {
        if (this.intervalID) {
            window.clearInterval(this.intervalID);
        }

        let c = 0;
        const intervalID = this.intervalID = window.setInterval(() => {
            let v = true;
            const start = Date.now();
            do {
                let n = 1000;
                while (--n && v) {
                    v = loop.call(this);
                }
            } while (Date.now() - start < 30 && v);

            if (!v) {
                window.clearInterval(intervalID);
                callback.call(this);
            } else if (c++ > 3000) {
                window.clearInterval(intervalID);
                throw new Error('too much shapes');
            }
        }, 30);
    }

    stop(): void {
        if (this.intervalID) {
            window.clearInterval(this.intervalID);
            this.intervalID = null;
        }
        if (this.callback) {
            this.callback.call(null);
            this.callback = null;
        }
    }

    expandShape(): void {
        const modification: [Transform, Color, Color, number, number] = [
            [1, 0, 0, 1, 0, 0],
            [0, 0, 0, 1],
            [0, 0, 0, 1],
            0, 1
        ];
        this.stack = [() => { this.startshape!(...modification); }];
        this.shapes = [];

        this.loop(() => {
            const fn = this.stack.pop();
            if (fn) fn.call(this);
            return this.stack.length > 0;
        }, this.drawShape);
    }

    drawShape(): void {
        this.shapes.sort((a: Shape, b: Shape) => b.z - a.z || a.area - b.area);
        let i = 0;
        const len = this.shapes.length;
        while (i < len && this.shapes[i].area * this.scale * this.scale < 0.3) i++;
        this.shapes.splice(0, i);

        if (!this.shapes.length) {
            this.stop();
            return;
        }

        if (!this.clip) {
            this.left = this.right = 0;
            this.top = this.bottom = 0;
            this.shapes.forEach((shape: Shape) => {
                if (this.left > shape.left!) this.left = shape.left!;
                if (this.right < shape.right!) this.right = shape.right!;
                if (this.top > shape.top!) this.top = shape.top!;
                if (this.bottom < shape.bottom!) this.bottom = shape.bottom!;
            });
            this.x = -(this.left + this.right) / 2;
            this.y = -(this.top + this.bottom) / 2;
        }

        this.context.translate(this.canvas.width / 2, this.canvas.height / 2);
        this.context.scale(this.scale, -this.scale);
        this.context.translate(this.x, this.y);

        this.loop(() => {
            const shape = this.shapes.pop();
            if (!shape) return false;
            this.context.save();
            this.context.transform(...shape.transform);
            this.context.fillStyle = 'rgba(' + hsv2rgb(...shape.color) + ')';
            this.context.scale(1.025, 1.025);
            shape.render.call(this);
            this.context.restore();
            return this.shapes.length > 0;
        }, this.stop);
    }

    compileReplacements(replacements: Replacement[]): ReplacementFunction[] {
        return replacements.map((replacement: Replacement, i: number): ReplacementWithIndex => {
            return {
                replacement: replacement,
                index: replacement[1] in this.primitives ? replacements.length - i : -1
            };
        }).sort((a: ReplacementWithIndex, b: ReplacementWithIndex) => a.index - b.index)
          .map((o: ReplacementWithIndex) => {
            return this.compileReplacement(o.replacement);
        });
    }

    compileReplacement(replacement: Replacement): ReplacementFunction {
        const adjustment = this.compileAdjustment(replacement[2]);

        if (replacement[0] === 'REPLACEMENT') {
            const rules = this.rules[replacement[1]];
            if (rules == null) {
                throw new Error('rule \'' + replacement[1] + '\' is not defined');
            }
            return (
                transform: Transform,
                color: Color,
                targetColor: Color,
                z: number,
                zScale: number
            ): void => {
                const area = Math.abs(transform[0] * transform[3] - transform[1] * transform[2]);
                if (area * this.scale * this.scale < 0.3) return;

                transform = this.adjustTransform(transform, adjustment.transform);
                if (adjustment.color.length) {
                    color = this.adjustColor(color, adjustment.color, targetColor);
                }
                if (adjustment.targetColor.length) {
                    targetColor = this.adjustColor(targetColor, adjustment.targetColor);
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
                    rule = rule!;
                } else {
                    rule = rules[0];
                }

                const modification: [Transform, Color, Color, number, number] = 
                    [transform, color, targetColor, z, zScale];
                Array.prototype.push.apply(this.stack, rule.replacements.map((replacement: ReplacementFunction) => {
                    return () => { replacement.call(this, ...modification); };
                }));
            };
        }
        
        if (replacement[0] === 'REPLACEMENT_LOOP') {
            const replacements = this.compileReplacements(replacement[3]);
            return (
                transform: Transform,
                color: Color,
                targetColor: Color,
                z: number,
                zScale: number
            ): void => {
                const area = Math.abs(transform[0] * transform[3] - transform[1] * transform[2]);
                if (area * this.scale * this.scale < 0.3) return;

                let n = replacement[1];
                while (n--) {
                    const modification: [Transform, Color, Color, number, number] = 
                        [transform, color, targetColor, z, zScale];
                    Array.prototype.push.apply(this.stack, replacements.map((replacement: ReplacementFunction) => {
                        return () => { replacement.call(this, ...modification); };
                    }));

                    if (!n) return; 

                    transform = this.adjustTransform(transform, adjustment.transform);
                    if (adjustment.color.length) {
                        color = this.adjustColor(color, adjustment.color, targetColor);
                    }
                    if (adjustment.targetColor.length) {
                        targetColor = this.adjustColor(targetColor, adjustment.targetColor);
                    }
                    z += adjustment.z * zScale;
                    zScale *= adjustment.zScale;
                }
            };
        }

        throw new Error('Unknown replacement type');
    }

    compilePath(path: any): () => void {
        // Path compilation is not yet implemented
        return () => {};
    }

    compileAdjustment(adjustments: Adjustments): CompiledAdjustment {
        const geomAdjustments = ['XSHIFT', 'YSHIFT', 'ZSHIFT', 'ROTATE', 'SIZE', 'SKEW', 'FLIP'];
        const colorAdjustments = ['HUE', 'SATURATION', 'BRIGHTNESS', 'ALPHA'];
        let transform: Transform = [1, 0, 0, 1, 0, 0];
        const color: ColorAdjustment = [];
        const targetColor: ColorAdjustment = [];
        let z = 0;
        let zScale = 1;

        const ordered = adjustments[2];
        const adjustmentList = adjustments[1].slice();
        const adjustmentMap: { [key: string]: Adjustment } = {};
        adjustmentList.forEach((adjustment: Adjustment) => {
            adjustmentMap[adjustment[0]] = adjustment;
        });

        (ordered ? adjustmentList : geomAdjustments.reduce((result: Adjustment[], type: string) => {
            if (type in adjustmentMap) result.push(adjustmentMap[type]);
            return result;
        }, [])).forEach((adjustment: Adjustment) => {
            let x: number, y: number, c: number, s: number;
            switch (adjustment[0]) {
                case 'XSHIFT':
                    x = adjustment[1];
                    transform = this.adjustTransform(transform, [1, 0, 0, 1, x, 0]); 
                    break;
                case 'YSHIFT':
                    y = adjustment[1];
                    transform = this.adjustTransform(transform, [1, 0, 0, 1, 0, y]); 
                    break;
                case 'ZSHIFT':
                    z += adjustment[1];
                    break;
                case 'ROTATE':
                    c = Math.cos(Math.PI * adjustment[1] / 180);
                    s = Math.sin(Math.PI * adjustment[1] / 180);
                    transform = this.adjustTransform(transform, [c, s, -s, c, 0, 0]); 
                    break;
                case 'SIZE':
                    x = adjustment[1];
                    y = adjustment[2];
                    transform = this.adjustTransform(transform, [x, 0, 0, y, 0, 0]); 
                    zScale *= adjustment[3];
                    break;
                case 'SKEW':
                    x = Math.tan(Math.PI * adjustment[1] / 180);
                    y = Math.tan(Math.PI * adjustment[2] / 180);
                    transform = this.adjustTransform(transform, [1, y, x, 1, 0, 0]); 
                    break;
                case 'FLIP':
                    c = Math.cos(Math.PI * adjustment[1] / 90);
                    s = Math.sin(Math.PI * adjustment[1] / 90);
                    transform = this.adjustTransform(transform, [c, s, s, -c, 0, 0]); 
                    break;
            }
        });

        colorAdjustments.forEach((type: string, i: number) => {
            let adjustment: Adjustment | undefined;
            if (adjustment = adjustmentMap[type]) {
                color[i] = (adjustment as any)[1];
                if ((adjustment as any)[2]) color[4] = (color[4] || 0) | (1 << i);
            }
            if (adjustment = adjustmentMap['TARGET' + type]) {
                targetColor[i] = (adjustment as any)[1];
            }
        });

        return {
            transform: transform,
            color: color,
            targetColor: targetColor,
            z: z,
            zScale: zScale
        };
    }

    adjustTransform(transform: Transform, adjustment: Transform): Transform {
        return [
            transform[0] * adjustment[0] + transform[2] * adjustment[1],
            transform[1] * adjustment[0] + transform[3] * adjustment[1],
            transform[0] * adjustment[2] + transform[2] * adjustment[3],
            transform[1] * adjustment[2] + transform[3] * adjustment[3],
            transform[0] * adjustment[4] + transform[2] * adjustment[5] + transform[4],
            transform[1] * adjustment[4] + transform[3] * adjustment[5] + transform[5]
        ];
    }

    adjustColor(color: Color, adjustment: ColorAdjustment, target?: Color): Color {
        const result: Color = color.slice() as Color;
        let a: number | undefined, t: number;

        if (a = adjustment[0]) {
            if (adjustment[4] && (adjustment[4] & 1) && target) {
                t = target[0];
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

        for (let i = 1; i < 4; i++) {
            if (a = adjustment[i]) {
                if (adjustment[4] && (adjustment[4] & (1 << i)) && target) {
                    if (a > 0) {
                        result[i] += (target[i] - result[i]) * a;
                    } else {
                        result[i] += (result[i] - (result[i] < target[i] ? 0 : 1)) * a;
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
}

function hsv2rgb(h: number, s: number, v: number, a: number): [number, number, number, number] {
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

return ContextFree;

})();
