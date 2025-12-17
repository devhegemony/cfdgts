/**
 * CFDG Parser using Chevrotain
 * Migrated from Jison grammar in cfdg.jison
 */

var CFDG = (function() {
    'use strict';
    
    const { createToken, Lexer, CstParser } = chevrotain;
    
    // ============= Lexer (Token Definitions) =============
    const allTokens = [];

    function defineToken(options) {
        const token = createToken(options);
        allTokens.push(token);
        return token;
    }

    // Whitespace and Comments (skipped)
    defineToken({
        name: 'WhiteSpace',
        pattern: /\s+/,
        group: Lexer.SKIPPED
    });

    defineToken({
        name: 'LineComment',
        pattern: /\/\/.*/,
        group: Lexer.SKIPPED
    });

    defineToken({
        name: 'BlockComment',
        pattern: /\/\*[\w\W]*?\*\//,
        group: Lexer.SKIPPED
    });

    // Literals (NUMBER before keywords to avoid ambiguity)
    const NUMBER = defineToken({
        name: 'NUMBER',
        pattern: /([0-9]+(\.[0-9]*)?|\.[0-9]+)/
    });

    // Keywords (must come before STRING identifier to have priority)
    const STARTSHAPE = defineToken({ name: 'STARTSHAPE', pattern: /startshape\b/ });
    const BACKGROUND = defineToken({ name: 'BACKGROUND', pattern: /background\b/ });
    const RULE = defineToken({ name: 'RULE', pattern: /rule\b/ });
    const ROTATE = defineToken({ name: 'ROTATE', pattern: /rotate\b/ });
    const FLIP = defineToken({ name: 'FLIP', pattern: /flip\b/ });
    const HUE = defineToken({ name: 'HUE', pattern: /hue\b/ });
    const SATURATION = defineToken({ name: 'SATURATION', pattern: /saturation\b/ });
    const SAT = defineToken({ name: 'SAT', pattern: /sat\b/ });
    const BRIGHTNESS = defineToken({ name: 'BRIGHTNESS', pattern: /brightness\b/ });
    const ALPHA = defineToken({ name: 'ALPHA', pattern: /alpha\b/ });
    const SIZE = defineToken({ name: 'SIZE', pattern: /size\b/ });
    const SKEW = defineToken({ name: 'SKEW', pattern: /skew\b/ });

    // Short single-letter forms
    const R = defineToken({ name: 'R', pattern: /r\b/ });
    const F = defineToken({ name: 'F', pattern: /f\b/ });
    const H = defineToken({ name: 'H', pattern: /h\b/ });
    const B = defineToken({ name: 'B', pattern: /b\b/ });
    const A = defineToken({ name: 'A', pattern: /a\b/ });
    const S = defineToken({ name: 'S', pattern: /s\b/ });
    const X = defineToken({ name: 'X', pattern: /x\b/ });
    const Y = defineToken({ name: 'Y', pattern: /y\b/ });
    const Z = defineToken({ name: 'Z', pattern: /z\b/ });

    // Target adjustments (with pipe prefix)
    const TARGETHUE = defineToken({ name: 'TARGETHUE', pattern: /\|(hue|h)\b/ });
    const TARGETSATURATION = defineToken({ name: 'TARGETSATURATION', pattern: /\|(saturation|sat)\b/ });
    const TARGETBRIGHTNESS = defineToken({ name: 'TARGETBRIGHTNESS', pattern: /\|(brightness|b)\b/ });
    const TARGETALPHA = defineToken({ name: 'TARGETALPHA', pattern: /\|(alpha|a)\b/ });

    // Operators and punctuation
    const Pipe = defineToken({ name: 'Pipe', pattern: /\|/ });
    const LCurly = defineToken({ name: 'LCurly', pattern: /\{/ });
    const RCurly = defineToken({ name: 'RCurly', pattern: /\}/ });
    const LSquare = defineToken({ name: 'LSquare', pattern: /\[/ });
    const RSquare = defineToken({ name: 'RSquare', pattern: /\]/ });
    const LParen = defineToken({ name: 'LParen', pattern: /\(/ });
    const RParen = defineToken({ name: 'RParen', pattern: /\)/ });
    const Comma = defineToken({ name: 'Comma', pattern: /,/ });
    const Caret = defineToken({ name: 'Caret', pattern: /\^/ });
    const Star = defineToken({ name: 'Star', pattern: /\*/ });
    const Slash = defineToken({ name: 'Slash', pattern: /\// });
    const Plus = defineToken({ name: 'Plus', pattern: /\+/ });
    const Minus = defineToken({ name: 'Minus', pattern: /-/ });

    // Identifiers (must come after all keywords)
    const STRING = defineToken({
        name: 'STRING',
        pattern: /[a-zA-Z_]+[a-zA-Z0-9_]*/
    });

    const CFDGLexer = new Lexer(allTokens);

    // ============= Parser =============
    class CFDGParser extends CstParser {
        constructor() {
            super(allTokens);
            const $ = this;

            // Entry point
            $.RULE('contextfree', () => {
                $.SUBRULE($.statements);
            });

            $.RULE('statements', () => {
                $.MANY(() => {
                    $.SUBRULE($.statement);
                });
            });

            $.RULE('statement', () => {
                $.OR([
                    { ALT: () => $.SUBRULE($.startshape) },
                    { ALT: () => $.SUBRULE($.background) },
                    { ALT: () => $.SUBRULE($.size) },
                    { ALT: () => $.SUBRULE($.rule) }
                ]);
            });

            $.RULE('startshape', () => {
                $.CONSUME(STARTSHAPE);
                $.SUBRULE($.id);
            });

            $.RULE('background', () => {
                $.CONSUME(BACKGROUND);
                $.CONSUME(LCurly);
                $.SUBRULE($.color_adjustments);
                $.CONSUME(RCurly);
            });

            $.RULE('size', () => {
                $.CONSUME(SIZE);
                $.SUBRULE($.modification);
            });

            $.RULE('rule', () => {
                $.CONSUME(RULE);
                $.SUBRULE($.id);
                $.OPTION(() => {
                    $.SUBRULE($.n);
                });
                $.CONSUME(LCurly);
                $.SUBRULE($.replacements);
                $.CONSUME(RCurly);
            });

            $.RULE('replacements', () => {
                $.MANY(() => {
                    $.SUBRULE($.replacement_loop);
                });
            });

            $.RULE('replacement_loop', () => {
                $.OR([
                    { ALT: () => $.SUBRULE($.replacement) },
                    {
                        ALT: () => {
                            $.SUBRULE($.n);
                            $.CONSUME(Star);
                            $.SUBRULE($.modification);
                            $.OR2([
                                { ALT: () => $.SUBRULE2($.replacement) },
                                {
                                    ALT: () => {
                                        $.CONSUME(LCurly);
                                        $.SUBRULE($.replacements);
                                        $.CONSUME(RCurly);
                                    }
                                }
                            ]);
                        }
                    }
                ]);
            });

            $.RULE('replacement', () => {
                $.SUBRULE($.id);
                $.SUBRULE($.modification);
            });

            $.RULE('modification', () => {
                $.OR([
                    {
                        ALT: () => {
                            $.CONSUME(LCurly);
                            $.SUBRULE($.adjustments);
                            $.CONSUME(RCurly);
                        }
                    },
                    {
                        ALT: () => {
                            $.CONSUME(LSquare);
                            $.SUBRULE2($.adjustments);
                            $.CONSUME(RSquare);
                        }
                    }
                ]);
            });

            $.RULE('adjustments', () => {
                $.MANY(() => {
                    $.SUBRULE($.adjustment);
                });
            });

            $.RULE('color_adjustments', () => {
                $.MANY(() => {
                    $.SUBRULE($.color_adjustment);
                });
            });

            $.RULE('adjustment', () => {
                $.OR([
                    { ALT: () => $.SUBRULE($.geom_adjustment) },
                    { ALT: () => $.SUBRULE($.color_adjustment) }
                ]);
            });

            $.RULE('geom_adjustment', () => {
                $.OR([
                    {
                        ALT: () => {
                            $.CONSUME(X);
                            $.SUBRULE($.num);
                        }
                    },
                    {
                        ALT: () => {
                            $.CONSUME(Y);
                            $.SUBRULE2($.num);
                        }
                    },
                    {
                        ALT: () => {
                            $.CONSUME(Z);
                            $.SUBRULE3($.num);
                        }
                    },
                    {
                        ALT: () => {
                            $.OR2([
                                { ALT: () => $.CONSUME(ROTATE) },
                                { ALT: () => $.CONSUME(R) }
                            ]);
                            $.SUBRULE4($.num);
                        }
                    },
                    {
                        ALT: () => {
                            $.SUBRULE($.size_adjustment);
                        }
                    },
                    {
                        ALT: () => {
                            $.CONSUME(SKEW);
                            $.SUBRULE5($.num);
                            $.SUBRULE6($.num);
                        }
                    },
                    {
                        ALT: () => {
                            $.OR3([
                                { ALT: () => $.CONSUME(FLIP) },
                                { ALT: () => $.CONSUME(F) }
                            ]);
                            $.SUBRULE7($.num);
                        }
                    }
                ]);
            });

            $.RULE('size_adjustment', () => {
                $.OR([
                    { ALT: () => $.CONSUME(SIZE) },
                    { ALT: () => $.CONSUME(S) }
                ]);
                $.SUBRULE($.num);
                $.OPTION(() => {
                    $.SUBRULE2($.num);
                    $.OPTION2(() => {
                        $.SUBRULE3($.num);
                    });
                });
            });

            $.RULE('color_adjustment', () => {
                $.OR([
                    {
                        ALT: () => {
                            $.OR2([
                                { ALT: () => $.CONSUME(HUE) },
                                { ALT: () => $.CONSUME(H) }
                            ]);
                            $.SUBRULE($.num);
                            $.OPTION(() => {
                                $.CONSUME(Pipe);
                            });
                        }
                    },
                    {
                        ALT: () => {
                            $.OR3([
                                { ALT: () => $.CONSUME(SATURATION) },
                                { ALT: () => $.CONSUME(SAT) }
                            ]);
                            $.SUBRULE2($.num);
                            $.OPTION2(() => {
                                $.CONSUME2(Pipe);
                            });
                        }
                    },
                    {
                        ALT: () => {
                            $.OR4([
                                { ALT: () => $.CONSUME(BRIGHTNESS) },
                                { ALT: () => $.CONSUME(B) }
                            ]);
                            $.SUBRULE3($.num);
                            $.OPTION3(() => {
                                $.CONSUME3(Pipe);
                            });
                        }
                    },
                    {
                        ALT: () => {
                            $.OR5([
                                { ALT: () => $.CONSUME(ALPHA) },
                                { ALT: () => $.CONSUME(A) }
                            ]);
                            $.SUBRULE4($.num);
                            $.OPTION4(() => {
                                $.CONSUME4(Pipe);
                            });
                        }
                    },
                    {
                        ALT: () => {
                            $.CONSUME(TARGETHUE);
                            $.SUBRULE5($.num);
                        }
                    },
                    {
                        ALT: () => {
                            $.CONSUME(TARGETSATURATION);
                            $.SUBRULE6($.num);
                        }
                    },
                    {
                        ALT: () => {
                            $.CONSUME(TARGETBRIGHTNESS);
                            $.SUBRULE7($.num);
                        }
                    },
                    {
                        ALT: () => {
                            $.CONSUME(TARGETALPHA);
                            $.SUBRULE8($.num);
                        }
                    }
                ]);
            });

            $.RULE('num', () => {
                $.OR([
                    { ALT: () => $.SUBRULE($.n) },
                    {
                        ALT: () => {
                            $.CONSUME(Plus);
                            $.SUBRULE2($.n);
                        }
                    },
                    {
                        ALT: () => {
                            $.CONSUME(Minus);
                            $.SUBRULE3($.n);
                        }
                    },
                    {
                        ALT: () => {
                            $.CONSUME(LParen);
                            $.SUBRULE($.e);
                            $.CONSUME(RParen);
                        }
                    },
                    { ALT: () => $.SUBRULE($.function) }
                ]);
            });

            $.RULE('e', () => {
                $.SUBRULE($.additionExpression);
            });

            $.RULE('additionExpression', () => {
                $.SUBRULE($.multiplicationExpression);
                $.MANY(() => {
                    $.OR([
                        { ALT: () => $.CONSUME(Plus) },
                        { ALT: () => $.CONSUME(Minus) }
                    ]);
                    $.SUBRULE2($.multiplicationExpression);
                });
            });

            $.RULE('multiplicationExpression', () => {
                $.SUBRULE($.exponentiationExpression);
                $.MANY(() => {
                    $.OR([
                        { ALT: () => $.CONSUME(Star) },
                        { ALT: () => $.CONSUME(Slash) }
                    ]);
                    $.SUBRULE2($.exponentiationExpression);
                });
            });

            $.RULE('exponentiationExpression', () => {
                $.SUBRULE($.unaryExpression);
                $.MANY(() => {
                    $.CONSUME(Caret);
                    $.SUBRULE2($.unaryExpression);
                });
            });

            $.RULE('unaryExpression', () => {
                $.OR([
                    {
                        ALT: () => {
                            $.CONSUME(Plus);
                            $.SUBRULE($.unaryExpression);
                        }
                    },
                    {
                        ALT: () => {
                            $.CONSUME(Minus);
                            $.SUBRULE2($.unaryExpression);
                        }
                    },
                    {
                        ALT: () => {
                            $.CONSUME(LParen);
                            $.SUBRULE($.e);
                            $.CONSUME(RParen);
                        }
                    },
                    { ALT: () => $.SUBRULE($.function) },
                    { ALT: () => $.SUBRULE($.n) }
                ]);
            });

            $.RULE('function', () => {
                $.SUBRULE($.id);
                $.CONSUME(LParen);
                $.OPTION(() => {
                    $.SUBRULE($.e);
                    $.MANY(() => {
                        $.CONSUME(Comma);
                        $.SUBRULE2($.e);
                    });
                });
                $.CONSUME(RParen);
            });

            $.RULE('n', () => {
                $.CONSUME(NUMBER);
            });

            $.RULE('id', () => {
                $.CONSUME(STRING);
            });

            this.performSelfAnalysis();
        }
    }

    // ============= Visitor for AST generation =============
    const parserInstance = new CFDGParser();
    const BaseCstVisitor = parserInstance.getBaseCstVisitorConstructor();

    class CFDGVisitor extends BaseCstVisitor {
        constructor() {
            super();
            this.validateVisitor();
            this.randStatic = Math.random();
        }

        contextfree(ctx) {
            return this.visit(ctx.statements);
        }

        statements(ctx) {
            if (!ctx.statement) return [];
            return ctx.statement.map(stmt => this.visit(stmt));
        }

        statement(ctx) {
            if (ctx.startshape) return this.visit(ctx.startshape);
            if (ctx.background) return this.visit(ctx.background);
            if (ctx.size) return this.visit(ctx.size);
            if (ctx.rule) return this.visit(ctx.rule);
        }

        startshape(ctx) {
            const id = this.visit(ctx.id);
            return ['STARTSHAPE', id];
        }

        background(ctx) {
            const adjustments = this.visit(ctx.color_adjustments);
            return ['BACKGROUND', adjustments];
        }

        size(ctx) {
            const modification = this.visit(ctx.modification);
            return ['SIZE', modification];
        }

        rule(ctx) {
            const id = this.visit(ctx.id);
            const weight = ctx.n ? this.visit(ctx.n) : 1;
            const replacements = this.visit(ctx.replacements);
            return ['RULE', id, weight, replacements];
        }

        replacements(ctx) {
            if (!ctx.replacement_loop) return [];
            return ctx.replacement_loop.map(rl => this.visit(rl));
        }

        replacement_loop(ctx) {
            if (ctx.replacement && !ctx.n) {
                return this.visit(ctx.replacement[0]);
            } else {
                const count = this.visit(ctx.n);
                const modification = this.visit(ctx.modification);
                if (ctx.replacement && ctx.replacement.length > 1) {
                    const replacement = this.visit(ctx.replacement[1]);
                    return ['REPLACEMENT_LOOP', count, modification, [replacement]];
                } else if (ctx.replacements) {
                    const replacements = this.visit(ctx.replacements);
                    return ['REPLACEMENT_LOOP', count, modification, replacements];
                }
            }
        }

        replacement(ctx) {
            const id = this.visit(ctx.id);
            const modification = this.visit(ctx.modification);
            return ['REPLACEMENT', id, modification];
        }

        modification(ctx) {
            const adjustments = this.visit(ctx.adjustments);
            if (ctx.LSquare) {
                adjustments.push(true);
            }
            return adjustments;
        }

        adjustments(ctx) {
            const result = ['ADJUSTMENTS', []];
            if (ctx.adjustment) {
                result[1] = ctx.adjustment.map(adj => this.visit(adj));
            }
            return result;
        }

        color_adjustments(ctx) {
            const result = ['ADJUSTMENTS', []];
            if (ctx.color_adjustment) {
                result[1] = ctx.color_adjustment.map(adj => this.visit(adj));
            }
            return result;
        }

        adjustment(ctx) {
            if (ctx.geom_adjustment) return this.visit(ctx.geom_adjustment);
            if (ctx.color_adjustment) return this.visit(ctx.color_adjustment);
        }

        geom_adjustment(ctx) {
            if (ctx.X) {
                const value = this.visit(ctx.num);
                return ['XSHIFT', value];
            }
            if (ctx.Y) {
                const value = this.visit(ctx.num);
                return ['YSHIFT', value];
            }
            if (ctx.Z) {
                const value = this.visit(ctx.num);
                return ['ZSHIFT', value];
            }
            if (ctx.ROTATE || ctx.R) {
                const value = this.visit(ctx.num);
                return ['ROTATE', value];
            }
            if (ctx.size_adjustment) {
                return this.visit(ctx.size_adjustment);
            }
            if (ctx.SKEW) {
                const nums = ctx.num.map(n => this.visit(n));
                return ['SKEW', nums[0], nums[1]];
            }
            if (ctx.FLIP || ctx.F) {
                const value = this.visit(ctx.num);
                return ['FLIP', value];
            }
        }

        size_adjustment(ctx) {
            const nums = ctx.num.map(n => this.visit(n));
            if (nums.length === 1) {
                return ['SIZE', nums[0], nums[0], 1];
            } else if (nums.length === 2) {
                return ['SIZE', nums[0], nums[1], 1];
            } else {
                return ['SIZE', nums[0], nums[1], nums[2]];
            }
        }

        color_adjustment(ctx) {
            if (ctx.HUE || ctx.H) {
                const value = this.visit(ctx.num);
                if (ctx.Pipe) {
                    return ['HUE', value, true];
                }
                return ['HUE', value];
            }
            if (ctx.SATURATION || ctx.SAT) {
                const value = this.visit(ctx.num);
                if (ctx.Pipe) {
                    return ['SATURATION', value, true];
                }
                return ['SATURATION', value];
            }
            if (ctx.BRIGHTNESS || ctx.B) {
                const value = this.visit(ctx.num);
                if (ctx.Pipe) {
                    return ['BRIGHTNESS', value, true];
                }
                return ['BRIGHTNESS', value];
            }
            if (ctx.ALPHA || ctx.A) {
                const value = this.visit(ctx.num);
                if (ctx.Pipe) {
                    return ['ALPHA', value, true];
                }
                return ['ALPHA', value];
            }
            if (ctx.TARGETHUE) {
                const value = this.visit(ctx.num);
                return ['TARGETHUE', value];
            }
            if (ctx.TARGETSATURATION) {
                const value = this.visit(ctx.num);
                return ['TARGETSATURATION', value];
            }
            if (ctx.TARGETBRIGHTNESS) {
                const value = this.visit(ctx.num);
                return ['TARGETBRIGHTNESS', value];
            }
            if (ctx.TARGETALPHA) {
                const value = this.visit(ctx.num);
                return ['TARGETALPHA', value];
            }
        }

        num(ctx) {
            if (ctx.n && !ctx.Plus && !ctx.Minus && !ctx.LParen && !ctx.function) {
                return this.visit(ctx.n);
            }
            if (ctx.Plus && ctx.n) {
                return this.visit(ctx.n);
            }
            if (ctx.Minus && ctx.n) {
                return -this.visit(ctx.n);
            }
            if (ctx.LParen) {
                return this.visit(ctx.e);
            }
            if (ctx.function) {
                return this.visit(ctx.function);
            }
        }

        e(ctx) {
            return this.visit(ctx.additionExpression);
        }

        additionExpression(ctx) {
            let result = this.visit(ctx.multiplicationExpression[0]);
            if (ctx.multiplicationExpression.length > 1) {
                for (let i = 1; i < ctx.multiplicationExpression.length; i++) {
                    const right = this.visit(ctx.multiplicationExpression[i]);
                    if (ctx.Plus && ctx.Plus[i - 1]) {
                        result = result + right;
                    } else if (ctx.Minus && ctx.Minus[i - 1]) {
                        result = result - right;
                    }
                }
            }
            return result;
        }

        multiplicationExpression(ctx) {
            let result = this.visit(ctx.exponentiationExpression[0]);
            if (ctx.exponentiationExpression.length > 1) {
                for (let i = 1; i < ctx.exponentiationExpression.length; i++) {
                    const right = this.visit(ctx.exponentiationExpression[i]);
                    if (ctx.Star && ctx.Star[i - 1]) {
                        result = result * right;
                    } else if (ctx.Slash && ctx.Slash[i - 1]) {
                        result = result / right;
                    }
                }
            }
            return result;
        }

        exponentiationExpression(ctx) {
            let result = this.visit(ctx.unaryExpression[ctx.unaryExpression.length - 1]);
            if (ctx.unaryExpression.length > 1) {
                for (let i = ctx.unaryExpression.length - 2; i >= 0; i--) {
                    const left = this.visit(ctx.unaryExpression[i]);
                    result = Math.pow(left, result);
                }
            }
            return result;
        }

        unaryExpression(ctx) {
            if (ctx.Plus && ctx.unaryExpression) {
                return this.visit(ctx.unaryExpression);
            }
            if (ctx.Minus && ctx.unaryExpression) {
                return -this.visit(ctx.unaryExpression);
            }
            if (ctx.LParen) {
                return this.visit(ctx.e);
            }
            if (ctx.function) {
                return this.visit(ctx.function);
            }
            if (ctx.n) {
                return this.visit(ctx.n);
            }
        }

        function(ctx) {
            const name = this.visit(ctx.id);
            const args = [];
            if (ctx.e) {
                args.push(...ctx.e.map(e => this.visit(e)));
            }

            switch (name) {
                case 'rand_static':
                    if (args.length === 0) return this.randStatic;
                    if (args.length === 1) return args[0] * this.randStatic;
                    if (args.length === 2) {
                        return Math.min(args[0], args[1]) + Math.abs(args[0] - args[1]) * this.randStatic;
                    }
                    break;
                case 'cos':
                case 'sin':
                case 'tan':
                    return Math[name](args[0] * Math.PI / 180);
                case 'acos':
                case 'asin':
                case 'atan':
                    return Math[name](args[0]) / Math.PI * 180;
                case 'log':
                case 'exp':
                case 'sqrt':
                case 'abs':
                    return Math[name](args[0]);
                case 'log10':
                    return Math.log(args[0]) * Math.LOG10E;
                case 'atan2':
                    return Math.atan2(args[0], args[1]) / Math.PI * 180;
                case 'mod':
                    return args[0] % args[1];
                default:
                    throw new Error("function '" + name + "' is not defined");
            }
        }

        n(ctx) {
            return parseFloat(ctx.NUMBER[0].image);
        }

        id(ctx) {
            return ctx.STRING[0].image;
        }
    }

    // Create shared instances
    const visitor = new CFDGVisitor();

    // Export API compatible with the old Jison parser
    return {
        parse: function(text) {
            visitor.randStatic = Math.random();
            
            const lexResult = CFDGLexer.tokenize(text);
            
            if (lexResult.errors.length > 0) {
                const error = lexResult.errors[0];
                throw new Error('Lexical error on line ' + error.line + '. ' + error.message);
            }

            parserInstance.input = lexResult.tokens;
            const cst = parserInstance.contextfree();

            if (parserInstance.errors.length > 0) {
                const error = parserInstance.errors[0];
                throw new Error('Parse error on line ' + error.token.startLine + ': ' + error.message);
            }

            return visitor.visit(cst);
        },
        yy: { 
            get rand_static() { return visitor.randStatic; },
            set rand_static(val) { visitor.randStatic = val; }
        }
    };
})();
