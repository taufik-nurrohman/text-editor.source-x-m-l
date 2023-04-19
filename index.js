/*!
 *
 * The MIT License (MIT)
 *
 * Copyright © 2023 Taufik Nurrohman <https://github.com/taufik-nurrohman>
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the “Software”), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED “AS IS”, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 *
 */
(function (g, f) {
    typeof exports === 'object' && typeof module !== 'undefined' ? f(exports) : typeof define === 'function' && define.amd ? define(['exports'], f) : (g = typeof globalThis !== 'undefined' ? globalThis : g || self, f((g.TE = g.TE || {}, g.TE.SourceXML = {})));
})(this, (function (exports) {
    'use strict';
    var hasValue = function hasValue(x, data) {
        return -1 !== data.indexOf(x);
    };
    var isArray = function isArray(x) {
        return Array.isArray(x);
    };
    var isDefined = function isDefined(x) {
        return 'undefined' !== typeof x;
    };
    var isInstance = function isInstance(x, of) {
        return x && isSet(of) && x instanceof of ;
    };
    var isNull = function isNull(x) {
        return null === x;
    };
    var isObject = function isObject(x, isPlain) {
        if (isPlain === void 0) {
            isPlain = true;
        }
        if ('object' !== typeof x) {
            return false;
        }
        return isPlain ? isInstance(x, Object) : true;
    };
    var isSet = function isSet(x) {
        return isDefined(x) && !isNull(x);
    };
    var isString = function isString(x) {
        return 'string' === typeof x;
    };
    var toCount = function toCount(x) {
        return x.length;
    };
    var toObjectKeys = function toObjectKeys(x) {
        return Object.keys(x);
    };
    var fromHTML = function fromHTML(x, quote) {
        x = x.replace(/&/g, '&amp;').replace(/>/g, '&gt;').replace(/</g, '&lt;');
        if (quote) {
            x = x.replace(/'/g, '&apos;').replace(/"/g, '&quot;');
        }
        return x;
    };
    var fromValue = function fromValue(x) {
        if (isArray(x)) {
            return x.map(function (v) {
                return fromValue(x);
            });
        }
        if (isObject(x)) {
            for (var k in x) {
                x[k] = fromValue(x[k]);
            }
            return x;
        }
        if (false === x) {
            return 'false';
        }
        if (null === x) {
            return 'null';
        }
        if (true === x) {
            return 'true';
        }
        return "" + x;
    };
    var W = window;
    var esc = function esc(pattern, extra) {
        if (extra === void 0) {
            extra = "";
        }
        return pattern.replace(toPattern('[' + extra + x.replace(/./g, '\\$&') + ']'), '\\$&');
    };
    var isPattern = function isPattern(pattern) {
        return isInstance(pattern, RegExp);
    };
    var toPattern = function toPattern(pattern, opt) {
        if (isPattern(pattern)) {
            return pattern;
        }
        // No need to escape `/` in the pattern string
        pattern = pattern.replace(/\//g, '\\/');
        return new RegExp(pattern, isSet(opt) ? opt : 'g');
    };
    var x = "!$^*()+=[]{}|:<>,.?/-";
    var tagComment = '<!--([\\s\\S](?!-->)*)-->',
        tagData = '<!((?:\'(?:\\\\.|[^\'])*\'|"(?:\\\\.|[^"])*"|[^>\'"])*)>',
        tagName = '[\\w:.-]+',
        tagStart = function tagStart(name) {
            return '<(' + name + ')(\\s(?:\'(?:\\\\.|[^\'])*\'|"(?:\\\\.|[^"])*"|[^/>\'"])*)?>';
        },
        tagEnd = function tagEnd(name) {
            return '</(' + name + ')>';
        },
        tagVoid = function tagVoid(name) {
            return '<(' + name + ')(\\s(?:\'(?:\\\\.|[^\'])*\'|"(?:\\\\.|[^"])*"|[^/>\'"])*)?/?>';
        },
        tagPreamble = '<\\?((?:\'(?:\\\\.|[^\'])*\'|"(?:\\\\.|[^"])*"|[^>\'"])*)\\?>',
        tagTokens = '(?:' + tagComment + '|' + tagData + '|' + tagEnd(tagName) + '|' + tagPreamble + '|' + tagVoid(tagName) + '|' + tagStart(tagName) + ')';
    var defaults = {
        source: {
            type: 'XML'
        }
    };
    var that = {};

    function toAttributes(attributes) {
        if (!attributes) {
            return "";
        }
        // Sort object by key(s)
        attributes = toObjectKeys(attributes).sort().reduce(function (r, k) {
            return r[k] = attributes[k], r;
        }, {});
        var attribute,
            v,
            out = "";
        for (attribute in attributes) {
            v = attributes[attribute];
            if (false === v || null === v) {
                continue;
            }
            out += ' ' + attribute;
            if (true !== v) {
                out += '="' + fromHTML(fromValue(v), true) + '"';
            }
        }
        return out;
    }

    function toTidy(tidy) {
        if (false !== tidy) {
            if (isString(tidy)) {
                tidy = [tidy, tidy];
            } else if (!isArray(tidy)) {
                tidy = ["", ""];
            }
            if (!isSet(tidy[1])) {
                tidy[1] = tidy[0];
            }
        }
        return tidy; // Return `[…]` or `false`
    }
    that.insert = function (name, content, attributes, tidy) {
        if (content === void 0) {
            content = "";
        }
        if (attributes === void 0) {
            attributes = {};
        }
        if (tidy === void 0) {
            tidy = false;
        }
        var t = this;
        if (false !== (tidy = toTidy(tidy))) {
            t.trim(tidy[0], "");
        }
        return t.insert('<' + name + toAttributes(attributes) + (false !== content ? '>' + content + '</' + name + '>' : ' />') + (false !== tidy ? tidy[1] : ""), -1, true);
    };
    that.toggle = function (name, content, attributes, tidy) {
        if (content === void 0) {
            content = "";
        }
        if (attributes === void 0) {
            attributes = {};
        }
        if (tidy === void 0) {
            tidy = false;
        }
        var t = this,
            _t$$ = t.$(),
            after = _t$$.after,
            before = _t$$.before,
            value = _t$$.value,
            tagStartLocal = tagStart(name),
            tagEndLocal = tagEnd(name),
            tagStartLocalPattern = toPattern(tagStartLocal + '$', ""),
            tagEndLocalPattern = toPattern('^' + tagEndLocal, ""),
            tagStartLocalMatch = tagStartLocalPattern.test(before),
            tagEndLocalMatch = tagEndLocalPattern.test(after);
        if (tagEndLocalMatch && tagStartLocalMatch) {
            return t.replace(tagEndLocalPattern, "", 1).replace(tagStartLocalPattern, "", -1);
        }
        tagStartLocalPattern = toPattern('^' + tagStartLocal, "");
        tagEndLocalPattern = toPattern(tagEndLocal + '$', "");
        tagStartLocalMatch = tagStartLocalPattern.test(value);
        tagEndLocalMatch = tagEndLocalPattern.test(value);
        if (tagEndLocalMatch && tagStartLocalMatch) {
            t.insert(value = value.replace(tagEndLocalPattern, "").replace(tagStartLocalPattern, ""));
        }
        if (!value && content) {
            t.insert(content);
        }
        if (false !== (tidy = toTidy(tidy))) {
            t.trim(tidy[0], tidy[1]);
        }
        return t.wrap('<' + name + toAttributes(attributes) + '>', '</' + name + '>');
    };
    that.wrap = function (name, content, attributes, tidy) {
        if (content === void 0) {
            content = "";
        }
        if (attributes === void 0) {
            attributes = {};
        }
        if (tidy === void 0) {
            tidy = false;
        }
        var t = this,
            _t$$2 = t.$();
        _t$$2.after;
        _t$$2.before;
        var value = _t$$2.value;
        if (!value && content) {
            t.insert(content);
        }
        if (false !== (tidy = toTidy(tidy))) {
            t.trim(tidy[0], tidy[1]);
        }
        return t.wrap('<' + name + toAttributes(attributes) + '>', '</' + name + '>');
    };

    function canKeyDown(map, of) {
        var state = of.state,
            charIndent = state.source.tab || state.tab || '\t',
            key = map.key,
            queue = map.queue,
            keyValue = map + "";
        // Do nothing
        if (queue.Alt || queue.Control) {
            return true;
        }
        if (['-', '>', '/', '?', ' '].includes(key)) {
            var _of$$ = of.$(),
                after = _of$$.after,
                before = _of$$.before,
                value = _of$$.value,
                start = _of$$.start;
            if ('-' === key) {
                // `<!-|`
                if (!value && '<!-' === before.slice(-3)) {
                    of.wrap('- ', ' --' + ('>' === after[0] ? "" : '>')).record();
                    return false;
                }
            }
            if ('>' === key || '/' === key) {
                var tagStartMatch = toPattern(tagStart(tagName) + '$', "").exec(before + '>');
                if (!value && tagStartMatch) {
                    // `<div|`
                    if ('/' === key) {
                        // `<div|>`
                        if ('>' === after[0]) {
                            of.trim("", false).insert(' /', -1).select(of.$().start + 1).record();
                            return false;
                        }
                        of.trim("", false).insert(' />', -1).record();
                        return false;
                    }
                    // `<div|></div>`
                    if (after.startsWith('></' + tagStartMatch[1] + '>')) {
                        of.select(start + 1).record();
                        // `<div|</div>`
                    } else if (after.startsWith('</' + tagStartMatch[1] + '>')) {
                        of.insert('>', -1).record();
                        // `<div|`
                    } else {
                        of.wrap('>', '</' + tagStartMatch[1] + ('>' === after[0] ? "" : '>')).record();
                    }
                    return false;
                }
            }
            if ('?' === key) {
                // `<|`
                if (!value && '<' === before.slice(-1)) {
                    of.wrap('?', '?' + ('>' === after[0] ? "" : '>')).record();
                    return false;
                }
            }
            if (' ' === keyValue) {
                if (!value) {
                    if (
                        // `<!--|-->`
                        '-->' === after.slice(0, 3) && '<!--' === before.slice(-4) ||
                        // `<?foo|?>`
                        '?>' === after.slice(0, 2) && '<?' === before.slice(0, 2) && /<\?\S*$/.test(before)) {
                        of.wrap(' ', ' ').record();
                        return false;
                    }
                }
            }
        }
        if ('ArrowLeft' === keyValue) {
            var _of$$2 = of.$(),
                _before = _of$$2.before,
                _start = _of$$2.start,
                _value = _of$$2.value;
            if (!_value) {
                var tagMatch = toPattern(tagTokens + '$', "").exec(_before);
                // `<foo>|bar`
                if (tagMatch) {
                    of.select(_start - toCount(tagMatch[0]), _start);
                    return false;
                }
            }
        }
        if ('ArrowRight' === keyValue) {
            var _of$$3 = of.$(),
                _after = _of$$3.after,
                _start2 = _of$$3.start,
                _value2 = _of$$3.value;
            if (!_value2) {
                var _tagMatch = toPattern('^' + tagTokens, "").exec(_after);
                // `foo|<bar>`
                if (_tagMatch) {
                    of.select(_start2, _start2 + toCount(_tagMatch[0]));
                    return false;
                }
            }
        }
        if ('Enter' === keyValue) {
            var _of$$4 = of.$(),
                _after2 = _of$$4.after,
                _before2 = _of$$4.before,
                _value3 = _of$$4.value,
                lineBefore = _before2.split('\n').pop(),
                lineMatch = lineBefore.match(/^(\s+)/),
                lineMatchIndent = lineMatch && lineMatch[1] || "",
                _tagStartMatch = _before2.match(toPattern(tagStart(tagName) + '$', ""));
            if (!_value3) {
                if (
                    // `<!--|-->`
                    /^[ \t]*-->/.test(_after2) && /<!--[ \t]*$/.test(_before2) ||
                    // `<?foo|?>`
                    /^[ \t]*\?>/.test(_after2) && /<\?\S*[ \t]*$/.test(_before2)) {
                    of.trim().wrap('\n' + lineMatchIndent, '\n' + lineMatchIndent).record();
                    return false;
                }
                if (_tagStartMatch) {
                    if (_after2.startsWith('</' + _tagStartMatch[1] + '>')) {
                        of.record().trim().wrap('\n' + lineMatchIndent + charIndent, '\n' + lineMatchIndent).record();
                    } else {
                        of.record().wrap('\n' + lineMatchIndent + charIndent, '\n' + lineMatchIndent + '</' + _tagStartMatch[1] + '>').record();
                    }
                    return false;
                }
            }
        }
        if ('Backspace' === keyValue) {
            var _of$$5 = of.$(),
                _after3 = _of$$5.after,
                _before3 = _of$$5.before,
                _value4 = _of$$5.value;
            if (!_value4) {
                // `<!--|`
                if ('<!--' === _before3.slice(-4)) {
                    of.replace(/<!--$/, "", -1);
                    // `<!--|-->`
                    if ('-->' === _after3.slice(0, 3)) {
                        of.replace(/^-->/, "", 1);
                    }
                    of.record();
                    return false;
                }
                if (/^\s+-->/.test(_after3) && /<!--\s+$/.test(_before3)) {
                    of.trim(' ' === _before3.slice(-1) ? "" : ' ', ' ' === _after3[0] ? "" : ' ').record();
                    return false;
                }
                // `<?|`
                if (/<\?\S*$/.test(_before3)) {
                    of.replace(/<\?\S*$/, "", -1);
                    // `<?|?>`
                    if ('?>' === _after3.slice(0, 2)) {
                        of.replace(/^\?>/, "", 1);
                    }
                    of.record();
                    return false;
                }
                if (/^\s+\?>/.test(_after3) && /<\?\S*\s+$/.test(_before3)) {
                    of.trim(' ' === _before3.slice(-1) ? "" : ' ', ' ' === _after3[0] ? "" : ' ').record();
                    return false;
                }
                var tagPattern = toPattern(tagTokens + '$', ""),
                    _tagMatch2 = tagPattern.exec(_before3);
                if (_tagMatch2) {
                    // `<div />|`
                    if (' />' === _before3.slice(-3)) {
                        of.replace(/ \/>$/, '/>', -1).record();
                        return false;
                    }
                    // `<div/>|`
                    if ('/>' === _before3.slice(-2)) {
                        of.replace(/\/>$/, '>', -1).record();
                        return false;
                    }
                    of.replace(tagPattern, "", -1);
                    var name = _tagMatch2[0].slice(1).split(/\s+|>/)[0];
                    if (_tagMatch2[0] && '/' !== _tagMatch2[0][1]) {
                        if (_after3.startsWith('</' + name + '>')) {
                            of.replace(toPattern('^</' + name + '>', ""), "", 1);
                        }
                    }
                    of.record();
                    return false;
                }
                if (toPattern(tagStart(tagName) + '\\n(?:' + esc(charIndent) + ')?$', "").test(_before3) && toPattern('^\\s*' + tagEnd(tagName), "").test(_after3)) {
                    of.trim().record(); // Collapse!
                    return false;
                }
            }
        }
        if ('Delete' === keyValue) {
            var _of$$6 = of.$(),
                _after4 = _of$$6.after,
                _value5 = _of$$6.value;
            if (!_value5) {
                // `|-->`
                if ('-->' === _after4.slice(0, 3)) {
                    of.replace(/^-->/, "", 1).record();
                    return false;
                }
                // `|?>`
                if ('?>' === _after4.slice(0, 2)) {
                    of.replace(/^\?>/, "", 1).record();
                    return false;
                }
                var _tagPattern = toPattern('^' + tagTokens, ""),
                    _tagMatch3 = _tagPattern.exec(_after4);
                if (_tagMatch3) {
                    of.replace(_tagPattern, "", 1).record();
                    return false;
                }
            }
        }
        return true;
    }

    function canMouseDown(map, of) {
        map.key;
        var queue = map.queue;
        if (!queue.Control) {
            W.setTimeout(function () {
                var _of$$7 = of.$(),
                    after = _of$$7.after,
                    end = _of$$7.end,
                    before = _of$$7.before,
                    value = _of$$7.value;
                if (!value) {
                    var caret = "\uFEFF",
                        tagTokensLocal = tagTokens.split('(' + tagName + ')').join('((?:' + tagName + '|' + caret + ')+)'),
                        tagTokensLocalPattern = toPattern(tagTokensLocal),
                        content = before + value + caret + after,
                        m,
                        v;
                    while (m = tagTokensLocalPattern.exec(content)) {
                        if (hasValue(caret, m[0])) {
                            var parts = m[0].split(caret);
                            // `<asdf asdf="asdf"|/>` or `<asdf asdf="asdf" |/>`
                            if ('>' === parts[1] || '/>' === (parts[1] || "").trim()) {
                                of.select(v = m.index, v + toCount(m[0]) - 1);
                                break;
                            }
                            // `<as|df asdf="asdf">`
                            if ('<' !== parts[0] && '</' !== parts[0] && !/\s/.test(parts[0])) {
                                of.select(v = m.index + ('/' === parts[0][1] ? 2 : 1), end + toCount(parts[1].split(/[\s\/>]/).shift()));
                                break;
                            }
                            var mm = void 0;
                            // `<asdf asdf="as|df">` or `<asdf asdf='as|df'>`
                            if (mm = toPattern('=("[^"]*' + caret + '[^"]*"|\'[^\']*' + caret + '[^\']*\')').exec(m[0])) {
                                of.select(v = m.index + mm.index + 2, v + toCount(mm[1]) - 3);
                                break;
                            }
                            // `<asdf asdf=as|df>`
                            if (mm = toPattern('=([^"\'\\s\\/>]*' + caret + '[^"\'\\s\\/>]*)').exec(m[0])) {
                                of.select(v = m.index + mm.index + 1, v + toCount(mm[1]) - 1);
                                break;
                            }
                            // `<asdf as|df="asdf">`
                            if ('<' !== parts[0] && '</' !== parts[0]) {
                                if (mm = toPattern('([^="\'\\s]*' + caret + '[^="\'\\s]*)[=\\s\\/>]').exec(m[0])) {
                                    of.select(v = m.index + mm.index, v + toCount(mm[1]) - 1);
                                    break;
                                }
                            }
                            // Other caret position(s) will select the element
                            of.select(v = m.index, v + toCount(m[0]) - 1);
                            break;
                        }
                    }
                }
            }, 1);
        }
        return true;
    }
    var state = defaults;
    exports.canKeyDown = canKeyDown;
    exports.canMouseDown = canMouseDown;
    exports.state = state;
    exports.that = that;
    exports.toAttributes = toAttributes;
    Object.defineProperty(exports, '__esModule', {
        value: true
    });
}));