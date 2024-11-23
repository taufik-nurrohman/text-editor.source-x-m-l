/*!
 *
 * The MIT License (MIT)
 *
 * Copyright © 2024 Taufik Nurrohman <https://github.com/taufik-nurrohman>
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
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = f() : typeof define === 'function' && define.amd ? define(f) : (g = typeof globalThis !== 'undefined' ? globalThis : g || self, (g.TextEditor = g.TextEditor || {}, g.TextEditor.SourceXML = f()));
})(this, (function () {
    'use strict';
    var isArray = function isArray(x) {
        return Array.isArray(x);
    };
    var isDefined = function isDefined(x) {
        return 'undefined' !== typeof x;
    };
    var isFunction = function isFunction(x) {
        return 'function' === typeof x;
    };
    var isInstance = function isInstance(x, of) {
        return x && isSet(of) && x instanceof of ;
    };
    var isInteger = function isInteger(x) {
        return isNumber(x) && 0 === x % 1;
    };
    var isNull = function isNull(x) {
        return null === x;
    };
    var isNumber = function isNumber(x) {
        return 'number' === typeof x;
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
    var toCount = function toCount(x) {
        return x.length;
    };
    var toObjectKeys = function toObjectKeys(x) {
        return Object.keys(x);
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
    var hasValue = function hasValue(x, data) {
        return -1 !== data.indexOf(x);
    };
    var fromHTML = function fromHTML(x, quote) {
        x = x.replace(/&/g, '&amp;').replace(/>/g, '&gt;').replace(/</g, '&lt;');
        if (quote) {
            x = x.replace(/'/g, '&apos;').replace(/"/g, '&quot;');
        }
        return x;
    };
    var fromStates = function fromStates() {
        for (var _len = arguments.length, lot = new Array(_len), _key = 0; _key < _len; _key++) {
            lot[_key] = arguments[_key];
        }
        var out = lot.shift();
        for (var i = 0, j = toCount(lot); i < j; ++i) {
            for (var k in lot[i]) {
                // Assign value
                if (!isSet(out[k])) {
                    out[k] = lot[i][k];
                    continue;
                }
                // Merge array
                if (isArray(out[k]) && isArray(lot[i][k])) {
                    out[k] = [ /* Clone! */ ].concat(out[k]);
                    for (var ii = 0, jj = toCount(lot[i][k]); ii < jj; ++ii) {
                        if (!hasValue(lot[i][k][ii], out[k])) {
                            out[k].push(lot[i][k][ii]);
                        }
                    }
                    // Merge object recursive
                } else if (isObject(out[k]) && isObject(lot[i][k])) {
                    out[k] = fromStates({
                        /* Clone! */ }, out[k], lot[i][k]);
                    // Replace value
                } else {
                    out[k] = lot[i][k];
                }
            }
        }
        return out;
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
    var offEventDefault = function offEventDefault(e) {
        return e && e.preventDefault();
    };
    var tagComment = function tagComment() {
            return '<!--([\\s\\S](?!-->)*)-->';
        },
        tagData = function tagData() {
            return '<!((?:\'(?:\\\\.|[^\'])*\'|"(?:\\\\.|[^"])*"|[^>\'"])*)>';
        },
        tagEnd = function tagEnd(name) {
            return '</(' + name + ')>';
        },
        tagInstruction = function tagInstruction() {
            return '<\\?((?:\'(?:\\\\.|[^\'])*\'|"(?:\\\\.|[^"])*"|[^>\'"])*)\\?>';
        },
        tagName = function tagName() {
            return '[\\w:.-]+';
        },
        tagStart = function tagStart(name) {
            return '<(' + name + ')(\\s(?:\'(?:\\\\.|[^\'])*\'|"(?:\\\\.|[^"])*"|[^/>\'"])*)?>';
        },
        tagVoid = function tagVoid(name) {
            return '<(' + name + ')(\\s(?:\'(?:\\\\.|[^\'])*\'|"(?:\\\\.|[^"])*"|[^/>\'"])*)?/?>';
        },
        tagTokens = function tagTokens() {
            return '(?:' + tagComment() + '|' + tagData() + '|' + tagEnd(tagName()) + '|' + tagInstruction() + '|' + tagVoid(tagName()) + '|' + tagStart(tagName()) + ')';
        };
    var KEY_ARROW_LEFT = 'ArrowLeft';
    var KEY_ARROW_RIGHT = 'ArrowRight';
    var KEY_DELETE_LEFT = 'Backspace';
    var KEY_DELETE_RIGHT = 'Delete';
    var KEY_ENTER = 'Enter';
    var name = 'TextEditor.SourceXML';

    function onKeyDown(e) {
        var $ = this,
            m,
            key = $.k(false).pop(),
            keys = $.k();
        if (e.defaultPrevented || $.keys[keys]) {
            return;
        }
        // Do nothing
        if ('Alt' === keys || 'Control' === keys) {
            return;
        }
        var _$$$ = $.$(),
            after = _$$$.after,
            before = _$$$.before;
        _$$$.end;
        var start = _$$$.start,
            value = _$$$.value,
            charIndent = $.state.tab || '\t',
            elements = $.state.elements || {},
            lineMatch = /^\s+/.exec(before.split('\n').pop()),
            lineMatchIndent = lineMatch && lineMatch[0] || "";
        if (isInteger(charIndent)) {
            charIndent = ' '.repeat(charIndent);
        }
        if (value) {
            if (KEY_DELETE_LEFT === keys) {
                if ('<![CDATA[' === before.slice(-9) && ']]>' === after.slice(0, 3) && value === elements['![CDATA[']) {
                    offEventDefault(e);
                    return $.insert("").record();
                }
                return;
            }
            if (KEY_DELETE_RIGHT === keys) {
                if ('<![CDATA[' === before.slice(-9) && ']]>' === after.slice(0, 3) && value === elements['![CDATA[']) {
                    offEventDefault(e);
                    return $.insert("").record();
                }
                return;
            }
            if (KEY_ENTER === keys) {
                if ('<!-- ' === before.slice(-5) && ' -->' === after.slice(0, 4) && value === elements['!--']) {
                    offEventDefault(e);
                    return $.trim('\n' + lineMatchIndent, '\n' + lineMatchIndent).insert("").record();
                }
                if ('<![CDATA[' === before.slice(-9) && ']]>' === after.slice(0, 3) && value === elements['![CDATA[']) {
                    offEventDefault(e);
                    return $.trim('\n' + lineMatchIndent, '\n' + lineMatchIndent).insert("").record();
                }
                m = toPattern(tagStart(tagName()) + '$', "").exec(before);
                if (m && after.startsWith('</' + m[1] + '>')) {
                    if (isSet(elements[m[1]]) && value === elements[m[1]][1]) {
                        offEventDefault(e);
                        return $.trim('\n' + lineMatchIndent + charIndent, '\n' + lineMatchIndent).insert("").record();
                    }
                }
            }
            return;
        }
        if ('-' === key) {
            // `<!-|`
            if ('<!-' === before.slice(-3)) {
                offEventDefault(e);
                return $.insert(elements['!--'] || "").wrap('- ', ' --' + ('>' === after[0] ? "" : '>')).record();
            }
            return;
        }
        if ('>' === key || '/' === key) {
            if (!(m = toPattern(tagStart(tagName()) + '$', "").exec(before + '>'))) {
                return;
            }
            offEventDefault(e);
            // `<div|`
            if ('/' === key) {
                // `<div|>`
                if ('>' === after[0]) {
                    return $.trim("", false).insert(' /', -1).select($.$().start + 1).record();
                }
                return $.trim("", false).insert(' />', -1).record();
            }
            if (isSet(elements[m[1]])) {
                value = elements[m[1]][1];
                if (false === value) {
                    if ('>' === after[0]) {
                        return $.trim("", false).insert(' /', -1).select($.$().start + 1).record();
                    }
                    return $.trim("", false).insert(' />', -1).record();
                }
                value && $.insert(value);
                return $.wrap('>', '</' + m[1] + ('>' === after[0] ? "" : '>')).record();
            }
            // `<div|`
            return $.wrap('>', '</' + m[1] + ('>' === after[0] ? "" : '>')).record();
        }
        if ('?' === key) {
            // `<|`
            if ('<' === before.slice(-1)) {
                offEventDefault(e);
                return $.wrap('?', '?' + ('>' === after[0] ? "" : '>')).record();
            }
            return;
        }
        if ('[' === key) {
            if ('<![CDATA' === before.slice(-8) && ']>' === after.slice(0, 2)) {
                return $.insert(elements['![CDATA['] || "");
            }
            return;
        }
        if (' ' === key) {
            if (
                // `<!--|-->`
                '-->' === after.slice(0, 3) && '<!--' === before.slice(-4) ||
                // `<?asdf|?>`
                '?>' === after.slice(0, 2) && /<\?\S*$/.test(before)) {
                offEventDefault(e);
                if ('?>' === after.slice(0, 2)) {
                    $.insert(elements['?'] || "");
                }
                return $.wrap(' ', ' ').record();
            }
            return;
        }
        // Update current selection data
        var s = $.$();
        after = s.after;
        before = s.before;
        s.end;
        start = s.start;
        value = s.value;
        if (value) {
            return;
        }
        if (KEY_ARROW_LEFT === keys && (m = toPattern(tagTokens() + '$', "").exec(before))) {
            // `<asdf>|asdf`
            offEventDefault(e);
            return $.select(start - toCount(m[0]), start);
        }
        if (KEY_ARROW_RIGHT === keys && (m = toPattern('^' + tagTokens(), "").exec(after))) {
            // `asdf|<asdf>`
            offEventDefault(e);
            return $.select(start, start + toCount(m[0]));
        }
        lineMatch = /^\s+/.exec(before.split('\n').pop());
        lineMatchIndent = lineMatch && lineMatch[0] || "";
        if (KEY_DELETE_LEFT === keys) {
            // `<!--|`
            if ('<!--' === before.slice(-4)) {
                offEventDefault(e);
                $.replace(/<!--$/, "", -1);
                // `<!--|-->`
                if ('-->' === after.slice(0, 3)) {
                    $.replace(/^-->/, "", 1);
                }
                return $.record();
            }
            if (/^(\n[ \t]*){2,}-->/.test(after) && /<!--(\n[ \t]*){2,}$/.test(before)) {
                offEventDefault(e);
                return $.trim('\n' + lineMatchIndent, '\n' + lineMatchIndent).record();
            }
            if (/^\s+-->/.test(after) && /<!--\s+$/.test(before)) {
                offEventDefault(e);
                var a = after[0],
                    b = before.slice(-1),
                    c = ' ' === a && ' ' === b ? "" : ' ';
                return $.trim(c, c).record();
            }
            // `<![CDATA[|`
            if ('<![CDATA[' === before.slice(-9)) {
                offEventDefault(e);
                $.replace(/<!\[CDATA\[$/, "", -1);
                // `<![CDATA[|]]>`
                if (']]>' === after.slice(0, 3)) {
                    $.replace(/^\]\]>/, "", 1);
                }
                return $.record();
            }
            // `<?|`
            if (/<\?\S*$/.test(before)) {
                offEventDefault(e);
                $.replace(/<\?\S*$/, "", -1);
                // `<?|?>`
                if ('?>' === after.slice(0, 2)) {
                    $.replace(/^\?>/, "", 1);
                }
                return $.record();
            }
            if (/^(\n[ \t]*){2,}\?>/.test(after) && /<\?\S*(\n[ \t]*){2,}$/.test(before)) {
                offEventDefault(e);
                return $.trim('\n' + lineMatchIndent, '\n' + lineMatchIndent).record();
            }
            if (/^\s+\?>/.test(after) && /<\?\S*\s+$/.test(before)) {
                offEventDefault(e);
                var _a = after[0],
                    _b = before.slice(-1),
                    _c = ' ' === _a && ' ' === _b ? "" : ' ';
                return $.trim(_c, _c).record();
            }
            // `<![CDATA[|`
            if ('<![CDATA[' === before.slice(-9)) {
                offEventDefault(e);
                $.replace(/<!\[CDATA\[$/, "", -1);
                // `<![CDATA[|]]>`
                if (']]>' === after.slice(0, 3)) {
                    $.replace(/^\]\]>/, "", 1);
                }
                return $.record();
            }
            if (/^(\n[ \t]*){2,}\]\]>/.test(after) && /<!\[CDATA\[(\n[ \t]*){2,}$/.test(before)) {
                offEventDefault(e);
                return $.trim('\n' + lineMatchIndent, '\n' + lineMatchIndent).record();
            }
            if (/^\s+\]\]>/.test(after) && /<!\[CDATA\[\s+$/.test(before)) {
                offEventDefault(e);
                var _a2 = after[0],
                    _b2 = before.slice(-1),
                    _c2 = ' ' === _a2 && ' ' === _b2 ? "" : ' ';
                return $.trim(_c2, _c2).record();
            }
            var tagPattern = toPattern(tagTokens() + '$', ""),
                tagMatch = tagPattern.exec(before);
            if (tagMatch) {
                offEventDefault(e);
                // `<div />|`
                if (' />' === before.slice(-3)) {
                    return $.replace(/ \/>$/, '/>', -1).record();
                }
                // `<div/>|`
                if ('/>' === before.slice(-2)) {
                    return $.replace(/\/>$/, '>', -1).record();
                }
                $.replace(tagPattern, "", -1);
                var _name = tagMatch[0].slice(1).split(/\s+|>/)[0];
                if (tagMatch[0] && '/' !== tagMatch[0][1]) {
                    if (after.startsWith('</' + _name + '>')) {
                        $.replace(toPattern('^</' + _name + '>', ""), "", 1);
                    }
                }
                return $.record();
            }
            if (toPattern('(^|\\n)([ \\t]*)' + tagStart(tagName()) + '\\n\\2$', "").test(before) && toPattern('^\\s*' + tagEnd(tagName()), "").test(after)) {
                offEventDefault(e);
                return $.trim().record(); // Collapse!
            }
        }
        if (KEY_DELETE_RIGHT === keys) {
            // `|-->`
            if ('-->' === after.slice(0, 3)) {
                offEventDefault(e);
                return $.replace(/^-->/, "", 1).record();
            }
            // `|]]>`
            if (']]>' === after.slice(0, 3)) {
                offEventDefault(e);
                return $.replace(/^\]\]>/, "", 1).record();
            }
            // `|?>`
            if ('?>' === after.slice(0, 2)) {
                offEventDefault(e);
                return $.replace(/^\?>/, "", 1).record();
            }
            var _tagPattern = toPattern('^' + tagTokens(), ""),
                _tagMatch = _tagPattern.exec(after);
            if (_tagMatch) {
                offEventDefault(e);
                return $.replace(_tagPattern, "", 1).record();
            }
        }
        if (KEY_ENTER === keys) {
            if (
                // `<!--|-->`
                /^[ \t]*-->/.test(after) && /<!--[ \t]*$/.test(before) ||
                // `<?asdf|?>`
                /^[ \t]*\?>/.test(after) && /<\?\S*[ \t]*$/.test(before) ||
                // `<![CDATA[|]]>`
                /^[ \t]*\]\]>/.test(after) && /<!\[CDATA\[[ \t]*$/.test(before)) {
                offEventDefault(e);
                return $.trim('\n' + lineMatchIndent, '\n' + lineMatchIndent).record();
            }
            if (
                // `<!--\n|\n-->`
                /^(\n[ \t]*)-->/.test(after) && /<!--(\n[ \t]*)$/.test(before) ||
                // `<?asdf\n|\n?>`
                /^(\n[ \t]*)\?>/.test(after) && /<\?\S*(\n[ \t]*)$/.test(before) ||
                // `<![CDATA[\n|\n]]>`
                /^(\n[ \t]*)\]\]>/.test(after) && /<!\[CDATA\[(\n[ \t]*)$/.test(before)) {
                offEventDefault(e);
                return $.trim('\n\n' + lineMatchIndent, '\n\n' + lineMatchIndent).record();
            }
            if (m = toPattern(tagStart(tagName()) + '$', "").exec(before)) {
                offEventDefault(e);
                if (after.startsWith('</' + m[1] + '>')) {
                    return $.record().trim('\n' + lineMatchIndent + charIndent, '\n' + lineMatchIndent).record();
                }
                return $.record().wrap('\n' + lineMatchIndent + charIndent, '\n' + lineMatchIndent + '</' + m[1] + '>').record();
            }
        }
    }

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

    function attach() {
        var $ = this,
            $$ = $.constructor._,
            any = /^\s*([\s\S]*?)\s*$/,
            anyComment = /^<!--\s*([\s\S]*?)\s*-->$/,
            anyData = /^<!\[CDATA\[\s*([\s\S]*?)\s*\]\]>$/,
            anyInstruction = /^<\?\S*\s*([\s\S]*?)\s*\?>$/;
        $.state = fromStates({
            elements: {
                '!--': 'Comment goes here…',
                '![CDATA[': 'Data goes here…',
                '?': 'Instruction goes here…'
            }
        }, $.state);
        !isFunction($$.insertComment) && ($$.insertComment = function (value, mode, clear) {
            var $ = this;
            value = value || $.state.elements['!--'] || "";
            if ('\n' !== value[0] && '\n' !== value.slice(-1)) {
                value = ' ' + value + ' ';
            }
            return $.insert('<!--' + value + '-->', isSet(mode) ? mode : -1, isSet(clear) ? clear : true);
        });
        !isFunction($$.insertData) && ($$.insertData = function (value, mode, clear) {
            var $ = this;
            return $.insert('<![CDATA[' + (value || $.state.elements['![CDATA['] || "") + ']]>', isSet(mode) ? mode : -1, isSet(clear) ? clear : true);
        });
        !isFunction($$.insertElement) && ($$.insertElement = function (value, mode, clear) {
            var $ = this,
                elements = $.state.elements;
            // `$.insertElement(['asdf'])`
            if (isArray(value)) {
                if (isSet(elements[value[0]])) {
                    var _value$;
                    value[1] = (_value$ = value[1]) != null ? _value$ : elements[value[0]][1];
                    value[2] = fromStates({}, elements[value[0]][2] || {}, value[2] || {});
                }
                value = '<' + value[0] + toAttributes(value[2]) + (false === value[1] ? ' />' : '>' + (value[1] || "") + '</' + value[0] + '>');
            }
            return $.insert(value, isSet(mode) ? mode : -1, isSet(clear) ? clear : true);
        });
        !isFunction($$.insertInstruction) && ($$.insertInstruction = function (value, mode, clear, name) {
            if (name === void 0) {
                name = 'xml';
            }
            var $ = this;
            value = value || $.state.elements['?'] || "";
            if ('\n' !== value[0] && '\n' !== value.slice(-1)) {
                value = ' ' + value + ' ';
            }
            return $.insert('<?' + (name || "") + value + '?>', isSet(mode) ? mode : -1, isSet(clear) ? clear : true);
        });
        !isFunction($$.peelComment) && ($$.peelComment = function (wrap) {
            var $ = this;
            if (wrap) {
                return $.replace(anyComment, '$1');
            }
            return $.replace(/<!--\s*$/, "", -1).replace(/^\s*-->/, "", 1);
        });
        !isFunction($$.peelData) && ($$.peelData = function (wrap) {
            var $ = this;
            if (wrap) {
                return $.replace(anyData, '$1');
            }
            return $.replace(/<!\[CDATA\[\s*$/, "", -1).replace(/^\s*\]\]>/, "", 1);
        });
        !isFunction($$.peelElement) && ($$.peelElement = function (open, close, wrap) {
            var $ = this,
                elements = $.state.elements;
            // `$.peelElement(['asdf'], false)`
            if (isArray(open)) {
                if (isSet(elements[open[0]])) {
                    var _open$;
                    open[1] = (_open$ = open[1]) != null ? _open$ : elements[open[0]][1];
                    open[2] = fromStates({}, elements[open[0]][2] || {}, open[2] || {});
                }
                wrap = close;
                if (wrap) {
                    return $.replace(toPattern('^' + tagStart(open[0]) + '([\\s\\S]*?)' + tagEnd(open[0]) + '$', ""), '$3');
                }
                return $.replace(toPattern(tagStart(open[0]) + '$', ""), "", -1).replace(toPattern('^' + tagEnd(open[0])), "", 1);
            }
            return $.peel(open, close, wrap);
        });
        !isFunction($$.peelInstruction) && ($$.peelInstruction = function (wrap) {
            var $ = this;
            if (wrap) {
                return $.replace(anyInstruction, '$1');
            }
            return $.replace(/<\?\S*\s*$/, "", -1).replace(/^\s*\?>/, "", 1);
        });
        !isFunction($$.selectComment) && ($$.selectComment = function (wrap) {
            var $ = this,
                _$$$2 = $.$(),
                after = _$$$2.after,
                before = _$$$2.before,
                end = _$$$2.end,
                start = _$$$2.start,
                value = _$$$2.value;
            while (before && '<!--' !== value.slice(0, 4)) {
                value = before.slice(-1) + value;
                before = before.slice(0, -1);
                start -= 1;
            }
            while (after && '-->' !== value.slice(-3)) {
                value += after.slice(0, 1);
                after = after.slice(1);
                end += 1;
            }
            if (!wrap) {
                var content = value.slice(4, -3),
                    spaceAfter = /\s+$/.exec(content),
                    spaceBefore = /^\s+/.exec(content);
                if (spaceAfter) {
                    end -= 3 + toCount(spaceAfter[0]);
                }
                if (spaceBefore) {
                    start += 4 + toCount(spaceBefore[0]);
                }
            }
            return '<!--' === value.slice(0, 4) && '-->' === value.slice(-3) ? $.select(start, end) : $.select();
        });
        !isFunction($$.selectData) && ($$.selectData = function (wrap) {
            var $ = this,
                _$$$3 = $.$(),
                after = _$$$3.after,
                before = _$$$3.before,
                end = _$$$3.end,
                start = _$$$3.start,
                value = _$$$3.value;
            while (before && '<![CDATA[' !== value.slice(0, 9)) {
                value = before.slice(-1) + value;
                before = before.slice(0, -1);
                start -= 1;
            }
            while (after && ']]>' !== value.slice(-3)) {
                value += after.slice(0, 1);
                after = after.slice(1);
                end += 1;
            }
            if (!wrap) {
                var content = value.slice(9, -3),
                    spaceAfter = /\s+$/.exec(content),
                    spaceBefore = /^\s+/.exec(content);
                if (spaceAfter) {
                    end -= 3 + toCount(spaceAfter[0]);
                }
                if (spaceBefore) {
                    start += 9 + toCount(spaceBefore[0]);
                }
            }
            return '<![CDATA[' === value.slice(0, 9) && ']]>' === value.slice(-3) ? $.select(start, end) : $.select();
        });
        !isFunction($$.selectElement) && ($$.selectElement = function () {
            var $ = this,
                _$$$4 = $.$(),
                after = _$$$4.after,
                before = _$$$4.before,
                end = _$$$4.end,
                start = _$$$4.start,
                value = _$$$4.value;
            while (before && '<' !== value.slice(0, 1)) {
                value = before.slice(-1) + value;
                before = before.slice(0, -1);
                start -= 1;
            }
            while (after && '>' !== value.slice(-1)) {
                value += after.slice(0, 1);
                after = after.slice(1);
                end += 1;
            }
            return toPattern('^(' + tagEnd(tagName()) + '|' + tagStart(tagName()) + '|' + tagVoid(tagName()) + ')$').test(value) ? $.select(start, end) : $.select();
        });
        !isFunction($$.selectInstruction) && ($$.selectInstruction = function (wrap, name) {
            if (name === void 0) {
                name = 'xml';
            }
            var $ = this,
                _$$$5 = $.$(),
                after = _$$$5.after,
                before = _$$$5.before,
                end = _$$$5.end,
                start = _$$$5.start,
                value = _$$$5.value;
            while (before && '<?' !== value.slice(0, 2)) {
                value = before.slice(-1) + value;
                before = before.slice(0, -1);
                start -= 1;
            }
            while (after && '?>' !== value.slice(-2)) {
                value += after.slice(0, 1);
                after = after.slice(1);
                end += 1;
            }
            if (!isSet(name)) {
                name = value.slice(2).split(/\s+/).shift();
            }
            if (!wrap) {
                var content = value.slice(2 + (name ? toCount(name) : 0), -2),
                    spaceAfter = /\s+$/.exec(content),
                    spaceBefore = /^\s+/.exec(content);
                if (spaceAfter) {
                    end -= 2 + toCount(spaceAfter[0]);
                }
                if (spaceBefore) {
                    start += 2 + (name ? toCount(name) : 0) + toCount(spaceBefore[0]);
                }
            }
            return '<?' === value.slice(0, 2) && '?>' === value.slice(-2) ? $.select(start, end) : $.select();
        });
        !isFunction($$.toggleComment) && ($$.toggleComment = function (wrap) {
            var $ = this,
                _$$$6 = $.$(),
                after = _$$$6.after,
                before = _$$$6.before,
                value = _$$$6.value;
            if (wrap) {
                return $[(anyComment.test(value) ? 'peel' : 'wrap') + 'Comment'](wrap);
            }
            return $[(/<!--\s*$/.test(before) && /^\s*-->/.test(after) ? 'peel' : 'wrap') + 'Comment'](wrap);
        });
        !isFunction($$.toggleData) && ($$.toggleData = function (wrap) {
            var $ = this,
                _$$$7 = $.$(),
                after = _$$$7.after,
                before = _$$$7.before,
                value = _$$$7.value;
            if (wrap) {
                return $[(anyData.test(value) ? 'peel' : 'wrap') + 'Data'](wrap);
            }
            return $[(/<!\[CDATA\[\s*$/.test(before) && /^\s*\]\]>/.test(after) ? 'peel' : 'wrap') + 'Data'](wrap);
        });
        !isFunction($$.toggleElement) && ($$.toggleElement = function (open, close, wrap) {
            var $ = this,
                elements = $.state.elements;
            // `$.toggleElement(['asdf'], false)`
            if (isArray(open)) {
                if (isSet(elements[open[0]])) {
                    var _open$2;
                    open[1] = (_open$2 = open[1]) != null ? _open$2 : elements[open[0]][1];
                    open[2] = fromStates({}, elements[open[0]][2] || {}, open[2] || {});
                }
                wrap = close;
                var _$$$8 = $.$(),
                    after = _$$$8.after,
                    before = _$$$8.before,
                    value = _$$$8.value,
                    tagStartOf = tagStart(open[0]),
                    tagEndOf = tagEnd(open[0]);
                if (wrap) {
                    return $[(toPattern('^' + tagStartOf + '[\\s\\S]*?' + tagEndOf + '$', "").test(value) ? 'peel' : 'wrap') + 'Element'](open, close, wrap);
                }
                return $[(toPattern(tagStartOf + '$', "").test(before) && toPattern('^' + tagEndOf, "").test(after) ? 'peel' : 'wrap') + 'Element'](open, close, wrap);
            }
            return $.toggle(open, close, wrap);
        });
        !isFunction($$.toggleInstruction) && ($$.toggleInstruction = function (wrap, name) {
            if (name === void 0) {
                name = 'xml';
            }
            var $ = this,
                _$$$9 = $.$(),
                after = _$$$9.after,
                before = _$$$9.before,
                value = _$$$9.value;
            if (wrap) {
                return $[(anyInstruction.test(value) ? 'peel' : 'wrap') + 'Instruction'](wrap, name);
            }
            return $[(/<\?\S*\s*$/.test(before) && /^\s*\?>/.test(after) ? 'peel' : 'wrap') + 'Instruction'](wrap, name);
        });
        !isFunction($$.wrapComment) && ($$.wrapComment = function (wrap) {
            var $ = this,
                _$$$10 = $.$(),
                value = _$$$10.value,
                placeholder = $.state.elements['!--'] || "";
            if (!value && placeholder) {
                $.insert(placeholder);
            }
            if (wrap) {
                return $.replace(any, '<!-- $1 -->');
            }
            return $.trim(false, false).replace(/$/, '<!-- ', -1).replace(/^/, ' -->', 1);
        });
        !isFunction($$.wrapData) && ($$.wrapData = function (wrap) {
            var $ = this,
                _$$$11 = $.$(),
                value = _$$$11.value,
                placeholder = $.state.elements['![CDATA['] || "";
            if (!value && placeholder) {
                $.insert(placeholder);
            }
            if (wrap) {
                return $.replace(any, '<![CDATA[$1]]>');
            }
            return $.trim(false, false).replace(/$/, '<![CDATA[', -1).replace(/^/, ']]>', 1);
        });
        !isFunction($$.wrapElement) && ($$.wrapElement = function (open, close, wrap) {
            var $ = this,
                elements = $.state.elements;
            // `$.wrapElement(['asdf'], false)`
            if (isArray(open)) {
                if (isSet(elements[open[0]])) {
                    var _open$3;
                    open[1] = (_open$3 = open[1]) != null ? _open$3 : elements[open[0]][1];
                    open[2] = fromStates({}, elements[open[0]][2] || {}, open[2] || {});
                }
                wrap = close;
                var _$$$12 = $.$(),
                    value = _$$$12.value;
                if (wrap) {
                    return $.replace(any, '<' + open[0] + toAttributes(open[2]) + '>' + (value || open[1] || "").trim() + '</' + open[0] + '>');
                }
                return $.trim(false, false).replace(/$/, '<' + open[0] + toAttributes(open[2]) + '>', -1).replace(/^/, '</' + open[0] + '>', 1).insert(value || open[1] || "");
            }
            return $.wrap(open, close, wrap);
        });
        !isFunction($$.wrapInstruction) && ($$.wrapInstruction = function (wrap, name) {
            if (name === void 0) {
                name = 'xml';
            }
            var $ = this,
                _$$$13 = $.$(),
                value = _$$$13.value,
                placeholder = $.state.elements['?'] || "";
            if (!value && placeholder) {
                $.insert(placeholder);
            }
            if (wrap) {
                return $.replace(any, '<?' + name + ' $1 ?>');
            }
            return $.trim(false, false).replace(/$/, '<?' + name + ' ', -1).replace(/^/, ' ?>', 1);
        });
        return $.on('key.down', onKeyDown);
    }

    function detach() {
        return this.off('key.down', onKeyDown);
    }
    var index_js = {
        attach: attach,
        detach: detach,
        name: name
    };
    return index_js;
}));