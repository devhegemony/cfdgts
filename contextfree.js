"use strict";
/*
 * contextfree.js v0.1.1
 *
 * Copyright (c) 2011 alpicola
 * Licensed under the MIT license
 */
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
var ContextFree = (function () {
    'use strict';
    var ContextFree = /** @class */ (function () {
        function ContextFree(source, canvas) {
            var _this = this;
            this.x = 0;
            this.y = 0;
            this.left = 0;
            this.right = 0;
            this.top = 0;
            this.bottom = 0;
            this.width = 1;
            this.height = 1;
            this.clip = false;
            this.rules = {};
            this.stack = [];
            this.shapes = [];
            this.canvas = canvas;
            var ctx = canvas.getContext('2d');
            if (!ctx) {
                throw new Error('Unable to get 2d context from canvas');
            }
            this.context = ctx;
            this.scale = Math.min(canvas.width, canvas.height);
            this.primitives = {
                SQUARE: function () {
                    _this.context.fillRect(-0.5, -0.5, 1, 1);
                },
                CIRCLE: function () {
                    _this.context.beginPath();
                    _this.context.arc(0, 0, 0.5, 0, Math.PI * 2, false);
                    _this.context.fill();
                },
                TRIANGLE: function () {
                    _this.context.beginPath();
                    _this.context.moveTo(0, 0.57735);
                    _this.context.lineTo(-0.5, -0.28828);
                    _this.context.lineTo(0.5, -0.28828);
                    _this.context.closePath();
                    _this.context.fill();
                }
            };
            CFDG.yy.rand_static = Math.random();
            CFDG.parse(source).forEach(function (statement) {
                switch (statement[0]) {
                    case 'STARTSHAPE':
                        _this.startshape = _this.compileReplacement([
                            'REPLACEMENT', statement[1], ['ADJUSTMENTS', []]
                        ]);
                        break;
                    case 'BACKGROUND':
                        var adjustment = _this.compileAdjustment(statement[1]);
                        _this.background = _this.adjustColor([0, 0, 1, 1], adjustment.color);
                        break;
                    case 'SIZE':
                        _this.clip = true;
                        statement[1][1][1].forEach(function (adjustment) {
                            switch (adjustment[0]) {
                                case 'XSHIFT':
                                    _this.x = adjustment[1];
                                    break;
                                case 'YSHIFT':
                                    _this.y = adjustment[1];
                                    break;
                                case 'SIZE':
                                    _this.width = adjustment[1];
                                    _this.height = adjustment[2];
                                    break;
                            }
                        });
                        break;
                    case 'RULE':
                        var rule = {
                            weight: statement[2],
                            replacements: statement[3]
                        };
                        if (_this.rules[statement[1]] != null) {
                            _this.rules[statement[1]].push(rule);
                        }
                        else {
                            _this.rules[statement[1]] = [rule];
                        }
                        break;
                    case 'PATH':
                        _this.primitives[statement[1]] = _this.compilePath(statement[2]);
                        break;
                }
            });
            var n = 0;
            for (var name_1 in this.primitives) {
                (function (name) {
                    var render = _this.primitives[name];
                    _this.rules[name] = [{
                            weight: 1,
                            replacements: [function (transform, color, targetColor, z, zScale) {
                                    var area = Math.abs(transform[0] * transform[3] - transform[1] * transform[2]);
                                    if (area * _this.scale * _this.scale < 0.3)
                                        return;
                                    var shape = {
                                        render: render,
                                        transform: transform,
                                        color: color,
                                        area: area,
                                        z: z
                                    };
                                    _this.shapes.push(shape);
                                    if (!_this.clip) {
                                        var size = Math.sqrt(area);
                                        if (_this.left > (shape.left = transform[4] - size)) {
                                            _this.left = shape.left;
                                        }
                                        if (_this.right < (shape.right = transform[4] + size)) {
                                            _this.right = shape.right;
                                        }
                                        if (_this.top > (shape.top = transform[5] - size)) {
                                            _this.top = shape.top;
                                        }
                                        if (_this.bottom < (shape.bottom = transform[5] + size)) {
                                            _this.bottom = shape.bottom;
                                        }
                                        if (_this.width < _this.right - _this.left ||
                                            _this.height < _this.bottom - _this.top) {
                                            _this.width = _this.right - _this.left;
                                            _this.height = _this.bottom - _this.top;
                                            _this.scale = Math.min(_this.canvas.width / _this.width, _this.canvas.height / _this.height);
                                            if (n++ > 100 && _this.shapes.length > 1000) {
                                                n = 0;
                                                _this.shapes = _this.shapes.filter(function (shape) {
                                                    return shape.area * _this.scale * _this.scale > 0.3;
                                                });
                                            }
                                        }
                                    }
                                }],
                            probability: 1
                        }];
                })(name_1);
            }
            var _loop_1 = function (name_2) {
                if (name_2 in this_1.primitives)
                    return "continue";
                var sum = this_1.rules[name_2].reduce(function (sum, rule) {
                    return sum + rule.weight;
                }, 0);
                this_1.rules[name_2].forEach(function (rule) {
                    rule.probability = rule.weight / sum;
                    rule.replacements = _this.compileReplacements(rule.replacements);
                });
            };
            var this_1 = this;
            for (var name_2 in this.rules) {
                _loop_1(name_2);
            }
            if (this.clip) {
                this.scale = Math.min(canvas.width / this.width, canvas.height / this.height);
            }
            if (!this.startshape) {
                throw new Error('startshape is not defined');
            }
        }
        ContextFree.prototype.render = function (callback) {
            this.callback = callback;
            this.context.setTransform(1, 0, 0, 1, 0, 0);
            this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
            if (this.background) {
                this.context.fillStyle = 'rgba(' + hsv2rgb.apply(void 0, this.background) + ')';
                this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
            }
            this.expandShape();
        };
        ContextFree.prototype.loop = function (loop, callback) {
            var _this = this;
            if (this.intervalID) {
                window.clearInterval(this.intervalID);
            }
            var c = 0;
            var intervalID = this.intervalID = window.setInterval(function () {
                var v = true;
                var start = Date.now();
                do {
                    var n = 1000;
                    while (--n && v) {
                        v = loop.call(_this);
                    }
                } while (Date.now() - start < 30 && v);
                if (!v) {
                    window.clearInterval(intervalID);
                    callback.call(_this);
                }
                else if (c++ > 3000) {
                    window.clearInterval(intervalID);
                    throw new Error('too much shapes');
                }
            }, 30);
        };
        ContextFree.prototype.stop = function () {
            if (this.intervalID) {
                window.clearInterval(this.intervalID);
                this.intervalID = null;
            }
            if (this.callback) {
                this.callback.call(null);
                this.callback = null;
            }
        };
        ContextFree.prototype.expandShape = function () {
            var _this = this;
            var modification = [
                [1, 0, 0, 1, 0, 0],
                [0, 0, 0, 1],
                [0, 0, 0, 1],
                0, 1
            ];
            this.stack = [function () { _this.startshape.apply(_this, modification); }];
            this.shapes = [];
            this.loop(function () {
                var fn = _this.stack.pop();
                if (fn)
                    fn.call(_this);
                return _this.stack.length > 0;
            }, this.drawShape);
        };
        ContextFree.prototype.drawShape = function () {
            var _this = this;
            this.shapes.sort(function (a, b) { return b.z - a.z || a.area - b.area; });
            var i = 0;
            var len = this.shapes.length;
            while (i < len && this.shapes[i].area * this.scale * this.scale < 0.3)
                i++;
            this.shapes.splice(0, i);
            if (!this.shapes.length) {
                this.stop();
                return;
            }
            if (!this.clip) {
                this.left = this.right = 0;
                this.top = this.bottom = 0;
                this.shapes.forEach(function (shape) {
                    if (_this.left > shape.left)
                        _this.left = shape.left;
                    if (_this.right < shape.right)
                        _this.right = shape.right;
                    if (_this.top > shape.top)
                        _this.top = shape.top;
                    if (_this.bottom < shape.bottom)
                        _this.bottom = shape.bottom;
                });
                this.x = -(this.left + this.right) / 2;
                this.y = -(this.top + this.bottom) / 2;
            }
            this.context.translate(this.canvas.width / 2, this.canvas.height / 2);
            this.context.scale(this.scale, -this.scale);
            this.context.translate(this.x, this.y);
            this.loop(function () {
                var _a;
                var shape = _this.shapes.pop();
                if (!shape)
                    return false;
                _this.context.save();
                (_a = _this.context).transform.apply(_a, shape.transform);
                _this.context.fillStyle = 'rgba(' + hsv2rgb.apply(void 0, shape.color) + ')';
                _this.context.scale(1.025, 1.025);
                shape.render.call(_this);
                _this.context.restore();
                return _this.shapes.length > 0;
            }, this.stop);
        };
        ContextFree.prototype.compileReplacements = function (replacements) {
            var _this = this;
            return replacements.map(function (replacement, i) {
                return {
                    replacement: replacement,
                    index: replacement[1] in _this.primitives ? replacements.length - i : -1
                };
            }).sort(function (a, b) { return a.index - b.index; })
                .map(function (o) {
                return _this.compileReplacement(o.replacement);
            });
        };
        ContextFree.prototype.compileReplacement = function (replacement) {
            var _this = this;
            var adjustment = this.compileAdjustment(replacement[2]);
            if (replacement[0] === 'REPLACEMENT') {
                var rules_1 = this.rules[replacement[1]];
                if (rules_1 == null) {
                    throw new Error('rule \'' + replacement[1] + '\' is not defined');
                }
                return function (transform, color, targetColor, z, zScale) {
                    var area = Math.abs(transform[0] * transform[3] - transform[1] * transform[2]);
                    if (area * _this.scale * _this.scale < 0.3)
                        return;
                    transform = _this.adjustTransform(transform, adjustment.transform);
                    if (adjustment.color.length) {
                        color = _this.adjustColor(color, adjustment.color, targetColor);
                    }
                    if (adjustment.targetColor.length) {
                        targetColor = _this.adjustColor(targetColor, adjustment.targetColor);
                    }
                    z += adjustment.z * zScale;
                    zScale *= adjustment.zScale;
                    var rule;
                    if (rules_1.length > 1) {
                        var p = 0;
                        var r = Math.random();
                        for (var i = 0, len = rules_1.length; i < len; i++) {
                            p += rules_1[i].probability;
                            if (r < p) {
                                rule = rules_1[i];
                                break;
                            }
                        }
                        rule = rule;
                    }
                    else {
                        rule = rules_1[0];
                    }
                    var modification = [transform, color, targetColor, z, zScale];
                    Array.prototype.push.apply(_this.stack, rule.replacements.map(function (replacement) {
                        return function () { replacement.call.apply(replacement, __spreadArray([_this], modification, false)); };
                    }));
                };
            }
            if (replacement[0] === 'REPLACEMENT_LOOP') {
                var replacements_1 = this.compileReplacements(replacement[3]);
                return function (transform, color, targetColor, z, zScale) {
                    var area = Math.abs(transform[0] * transform[3] - transform[1] * transform[2]);
                    if (area * _this.scale * _this.scale < 0.3)
                        return;
                    var n = replacement[1];
                    var _loop_2 = function () {
                        var modification = [transform, color, targetColor, z, zScale];
                        Array.prototype.push.apply(_this.stack, replacements_1.map(function (replacement) {
                            return function () { replacement.call.apply(replacement, __spreadArray([_this], modification, false)); };
                        }));
                        if (!n)
                            return { value: void 0 };
                        transform = _this.adjustTransform(transform, adjustment.transform);
                        if (adjustment.color.length) {
                            color = _this.adjustColor(color, adjustment.color, targetColor);
                        }
                        if (adjustment.targetColor.length) {
                            targetColor = _this.adjustColor(targetColor, adjustment.targetColor);
                        }
                        z += adjustment.z * zScale;
                        zScale *= adjustment.zScale;
                    };
                    while (n--) {
                        var state_1 = _loop_2();
                        if (typeof state_1 === "object")
                            return state_1.value;
                    }
                };
            }
            throw new Error('Unknown replacement type');
        };
        ContextFree.prototype.compilePath = function (path) {
            // Path compilation is not yet implemented
            return function () { };
        };
        ContextFree.prototype.compileAdjustment = function (adjustments) {
            var _this = this;
            var geomAdjustments = ['XSHIFT', 'YSHIFT', 'ZSHIFT', 'ROTATE', 'SIZE', 'SKEW', 'FLIP'];
            var colorAdjustments = ['HUE', 'SATURATION', 'BRIGHTNESS', 'ALPHA'];
            var transform = [1, 0, 0, 1, 0, 0];
            var color = [];
            var targetColor = [];
            var z = 0;
            var zScale = 1;
            var ordered = adjustments[2];
            var adjustmentList = adjustments[1].slice();
            var adjustmentMap = {};
            adjustmentList.forEach(function (adjustment) {
                adjustmentMap[adjustment[0]] = adjustment;
            });
            (ordered ? adjustmentList : geomAdjustments.reduce(function (result, type) {
                if (type in adjustmentMap)
                    result.push(adjustmentMap[type]);
                return result;
            }, [])).forEach(function (adjustment) {
                var x, y, c, s;
                switch (adjustment[0]) {
                    case 'XSHIFT':
                        x = adjustment[1];
                        transform = _this.adjustTransform(transform, [1, 0, 0, 1, x, 0]);
                        break;
                    case 'YSHIFT':
                        y = adjustment[1];
                        transform = _this.adjustTransform(transform, [1, 0, 0, 1, 0, y]);
                        break;
                    case 'ZSHIFT':
                        z += adjustment[1];
                        break;
                    case 'ROTATE':
                        c = Math.cos(Math.PI * adjustment[1] / 180);
                        s = Math.sin(Math.PI * adjustment[1] / 180);
                        transform = _this.adjustTransform(transform, [c, s, -s, c, 0, 0]);
                        break;
                    case 'SIZE':
                        x = adjustment[1];
                        y = adjustment[2];
                        transform = _this.adjustTransform(transform, [x, 0, 0, y, 0, 0]);
                        zScale *= adjustment[3];
                        break;
                    case 'SKEW':
                        x = Math.tan(Math.PI * adjustment[1] / 180);
                        y = Math.tan(Math.PI * adjustment[2] / 180);
                        transform = _this.adjustTransform(transform, [1, y, x, 1, 0, 0]);
                        break;
                    case 'FLIP':
                        c = Math.cos(Math.PI * adjustment[1] / 90);
                        s = Math.sin(Math.PI * adjustment[1] / 90);
                        transform = _this.adjustTransform(transform, [c, s, s, -c, 0, 0]);
                        break;
                }
            });
            colorAdjustments.forEach(function (type, i) {
                var adjustment;
                if (adjustment = adjustmentMap[type]) {
                    color[i] = adjustment[1];
                    if (adjustment[2])
                        color[4] = (color[4] || 0) | (1 << i);
                }
                if (adjustment = adjustmentMap['TARGET' + type]) {
                    targetColor[i] = adjustment[1];
                }
            });
            return {
                transform: transform,
                color: color,
                targetColor: targetColor,
                z: z,
                zScale: zScale
            };
        };
        ContextFree.prototype.adjustTransform = function (transform, adjustment) {
            return [
                transform[0] * adjustment[0] + transform[2] * adjustment[1],
                transform[1] * adjustment[0] + transform[3] * adjustment[1],
                transform[0] * adjustment[2] + transform[2] * adjustment[3],
                transform[1] * adjustment[2] + transform[3] * adjustment[3],
                transform[0] * adjustment[4] + transform[2] * adjustment[5] + transform[4],
                transform[1] * adjustment[4] + transform[3] * adjustment[5] + transform[5]
            ];
        };
        ContextFree.prototype.adjustColor = function (color, adjustment, target) {
            var result = color.slice();
            var a, t;
            if (a = adjustment[0]) {
                if (adjustment[4] && (adjustment[4] & 1) && target) {
                    t = target[0];
                    if (a > 0) {
                        if (t < result[0])
                            t += 360;
                        result[0] += (t - result[0]) * a;
                    }
                    else {
                        if (t > result[0])
                            t -= 360;
                        result[0] += (result[0] - t) * a;
                    }
                }
                else {
                    result[0] += adjustment[0];
                }
                result[0] %= 360;
                if (result[0] < 0)
                    result[0] += 360;
            }
            for (var i = 1; i < 4; i++) {
                if (a = adjustment[i]) {
                    if (adjustment[4] && (adjustment[4] & (1 << i)) && target) {
                        if (a > 0) {
                            result[i] += (target[i] - result[i]) * a;
                        }
                        else {
                            result[i] += (result[i] - (result[i] < target[i] ? 0 : 1)) * a;
                        }
                    }
                    else {
                        if (a > 0) {
                            result[i] += (1 - result[i]) * a;
                        }
                        else {
                            result[i] += result[i] * a;
                        }
                    }
                }
            }
            return result;
        };
        return ContextFree;
    }());
    function hsv2rgb(h, s, v, a) {
        var r, g, b;
        if (s === 0) {
            r = g = b = Math.round(v * 0xff);
        }
        else {
            v *= 0xff;
            h = ((h %= 360) < 0 ? h + 360 : h) / 60;
            var hi = h | 0;
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
//# sourceMappingURL=contextfree.js.map