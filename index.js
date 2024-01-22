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
        tagDeclaration = function tagDeclaration() {
            return '<\\?((?:\'(?:\\\\.|[^\'])*\'|"(?:\\\\.|[^"])*"|[^>\'"])*)\\?>';
        },
        tagEnd = function tagEnd(name) {
            return '</(' + name + ')>';
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
            return '(?:' + tagComment() + '|' + tagData() + '|' + tagEnd(tagName()) + '|' + tagDeclaration() + '|' + tagVoid(tagName()) + '|' + tagStart(tagName()) + ')';
        };

    function onKeyDown(e) {
        var _$$state$source;
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
            charIndent = ((_$$state$source = $.state.source) == null ? void 0 : _$$state$source.tab) || $.state.tab || '\t',
            elements = $.state.elements || {},
            lineMatch = /^\s+/.exec(before.split('\n').pop()),
            lineMatchIndent = lineMatch && lineMatch[0] || "";
        if (isInteger(charIndent)) {
            charIndent = ' '.repeat(charIndent);
        }
        if (value) {
            if ('Enter' === keys) {
                if ('<!-- ' === before.slice(-5) && ' -->' === after.slice(0, 4) && value === elements['#comment']) {
                    offEventDefault(e);
                    return $.insert("");
                }
                if ('<![CDATA[' === before.slice(-9) && ']]>' === after.slice(0, 3) && value === elements['#data']) {
                    offEventDefault(e);
                    return $.insert("");
                }
                m = toPattern(tagStart(tagName()) + '$', "").exec(before);
                if (m && after.startsWith('</' + m[1] + '>')) {
                    if (isSet(elements[m[1]]) && value === elements[m[1]][1]) {
                        offEventDefault(e);
                        return $.insert("");
                    }
                }
            }
            return;
        }
        if ('-' === key) {
            // `<!-|`
            if ('<!-' === before.slice(-3)) {
                offEventDefault(e);
                return $.insert(elements['#comment'] || "").wrap('- ', ' --' + ('>' === after[0] ? "" : '>')).record();
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
            // `<div|></div>`
            if (after.startsWith('></' + m[1] + '>')) {
                return $.select(start + 1).record();
            }
            // `<div|</div>`
            if (after.startsWith('</' + m[1] + '>')) {
                return $.insert('>', -1).record();
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
                return $.insert(elements['#data'] || "");
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
        if ('ArrowLeft' === keys && (m = toPattern(tagTokens() + '$', "").exec(before))) {
            // `<asdf>|asdf`
            offEventDefault(e);
            return $.select(start - toCount(m[0]), start);
        }
        if ('ArrowRight' === keys && (m = toPattern('^' + tagTokens(), "").exec(after))) {
            // `asdf|<asdf>`
            offEventDefault(e);
            return $.select(start, start + toCount(m[0]));
        }
        lineMatch = /^\s+/.exec(before.split('\n').pop());
        lineMatchIndent = lineMatch && lineMatch[0] || "";
        if ('Enter' === keys) {
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
        if ('Backspace' === keys) {
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
                var name = tagMatch[0].slice(1).split(/\s+|>/)[0];
                if (tagMatch[0] && '/' !== tagMatch[0][1]) {
                    if (after.startsWith('</' + name + '>')) {
                        $.replace(toPattern('^</' + name + '>', ""), "", 1);
                    }
                }
                return $.record();
            }
            if (toPattern('(^|\\n)([ \\t]*)' + tagStart(tagName()) + '\\n\\2$', "").test(before) && toPattern('^\\s*' + tagEnd(tagName()), "").test(after)) {
                offEventDefault(e);
                return $.trim().record(); // Collapse!
            }
        }
        if ('Delete' === keys) {
            // `|-->`
            if ('-->' === after.slice(0, 3)) {
                offEventDefault(e);
                return $.replace(/^-->/, "", 1).record();
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
            state,
            any = /^\s*([\s\S]*?)\s*$/,
            anyComment = /^<!--\s*([\s\S]*?)\s*-->$/,
            anyData = /^<!\[CDATA\[\s*([\s\S]*?)\s*\]\]>$/;
        $.state = state = fromStates({
            elements: {
                '#comment': 'Comment goes here…',
                '#data': 'Data goes here…'
            }
        }, $.state);
        $.insertComment = function (value, mode, clear) {
            return $.insert('<!-- ' + (value || state.elements['#comment'] || "") + ' -->', isSet(mode) ? mode : -1, isSet(clear) ? clear : true);
        };
        $.insertData = function (value, mode, clear) {
            return $.insert('<![CDATA[' + (value || state.elements['#data'] || "") + ']]>', isSet(mode) ? mode : -1, isSet(clear) ? clear : true);
        };
        $.insertElement = function (value, mode, clear) {
            // `$.insertElement(['asdf'])`
            if (isArray(value)) {
                if (isSet(state.elements[value[0]])) {
                    var _value$;
                    value[1] = (_value$ = value[1]) != null ? _value$ : state.elements[value[0]][1];
                    value[2] = fromStates({}, state.elements[value[0]][2] || {}, value[2] || {});
                }
                value = '<' + value[0] + toAttributes(value[2]) + (false === value[1] ? ' />' : '>' + (value[1] || "") + '</' + value[0] + '>');
            }
            return $.insert(value, isSet(mode) ? mode : -1, isSet(clear) ? clear : true);
        };
        $.peelComment = function (wrap) {
            if (wrap) {
                return $.replace(anyComment, '$1');
            }
            return $.replace(/<!--\s*$/, "", -1).replace(/^\s*-->/, "", 1);
        };
        $.peelData = function (wrap) {
            if (wrap) {
                return $.replace(anyData, '$1');
            }
            return $.replace(/<!\[CDATA\[\s*$/, "", -1).replace(/^\s*\]\]>/, "", 1);
        };
        $.peelElement = function (open, close, wrap) {
            // `$.peelElement(['asdf'], false)`
            if (isArray(open)) {
                if (isSet(state.elements[open[0]])) {
                    var _open$;
                    open[1] = (_open$ = open[1]) != null ? _open$ : state.elements[open[0]][1];
                    open[2] = fromStates({}, state.elements[open[0]][2] || {}, open[2] || {});
                }
                wrap = close;
                if (wrap) {
                    return $.replace(toPattern('^' + tagStart(open[0]) + '([\\s\\S]*?)' + tagEnd(open[0]) + '$', ""), '$3');
                }
                return $.replace(toPattern(tagStart(open[0]) + '$', ""), "", -1).replace(toPattern('^' + tagEnd(open[0])), "", 1);
            }
            return $.peel(open, close, wrap);
        };
        $.toggleComment = function (wrap) {
            var _$$$2 = $.$(),
                after = _$$$2.after,
                before = _$$$2.before,
                value = _$$$2.value;
            if (wrap) {
                return $[(anyComment.test(value) ? 'peel' : 'wrap') + 'Comment'](wrap);
            }
            return $[(/<!--\s*$/.test(before) && /^\s*-->/.test(after) ? 'peel' : 'wrap') + 'Comment'](wrap);
        };
        $.toggleData = function (wrap) {
            var _$$$3 = $.$(),
                after = _$$$3.after,
                before = _$$$3.before,
                value = _$$$3.value;
            if (wrap) {
                return $[(anyData.test(value) ? 'peel' : 'wrap') + 'Data'](wrap);
            }
            return $[(/<!\[CDATA\[\s*$/.test(before) && /^\s*\]\]>/.test(after) ? 'peel' : 'wrap') + 'Data'](wrap);
        };
        $.toggleElement = function (open, close, wrap) {
            // `$.toggleElement(['asdf'], false)`
            if (isArray(open)) {
                if (isSet(state.elements[open[0]])) {
                    var _open$2;
                    open[1] = (_open$2 = open[1]) != null ? _open$2 : state.elements[open[0]][1];
                    open[2] = fromStates({}, state.elements[open[0]][2] || {}, open[2] || {});
                }
                wrap = close;
                var _$$$4 = $.$(),
                    after = _$$$4.after,
                    before = _$$$4.before,
                    value = _$$$4.value,
                    tagStartOf = tagStart(open[0]),
                    tagEndOf = tagEnd(open[0]);
                if (wrap) {
                    return $[(toPattern('^' + tagStartOf + '[\\s\\S]*?' + tagEndOf + '$', "").test(value) ? 'peel' : 'wrap') + 'Element'](open, close, wrap);
                }
                return $[(toPattern(tagStartOf + '$', "").test(before) && toPattern('^' + tagEndOf, "").test(after) ? 'peel' : 'wrap') + 'Element'](open, close, wrap);
            }
            return $.toggle(open, close, wrap);
        };
        $.wrapComment = function (wrap) {
            var _$$$5 = $.$(),
                value = _$$$5.value,
                placeholder = state.elements['#comment'] || "";
            if (!value && placeholder) {
                $.insert(placeholder);
            }
            if (wrap) {
                return $.replace(any, '<!-- $1 -->');
            }
            return $.trim(false, false).replace(/$/, '<!-- ', -1).replace(/^/, ' -->', 1);
        };
        $.wrapData = function (wrap) {
            var _$$$6 = $.$(),
                value = _$$$6.value,
                placeholder = state.elements['#data'] || "";
            if (!value && placeholder) {
                $.insert(placeholder);
            }
            if (wrap) {
                return $.replace(any, '<![CDATA[$1]]>');
            }
            return $.trim(false, false).replace(/$/, '<![CDATA[', -1).replace(/^/, ']]>', 1);
        };
        $.wrapElement = function (open, close, wrap) {
            // `$.wrapElement(['asdf'], false)`
            if (isArray(open)) {
                if (isSet(state.elements[open[0]])) {
                    var _open$3;
                    open[1] = (_open$3 = open[1]) != null ? _open$3 : state.elements[open[0]][1];
                    open[2] = fromStates({}, state.elements[open[0]][2] || {}, open[2] || {});
                }
                wrap = close;
                var _$$$7 = $.$(),
                    value = _$$$7.value;
                if (wrap) {
                    return $.replace(any, '<' + open[0] + toAttributes(open[2]) + '>' + (value || open[1] || "").trim() + '</' + open[0] + '>');
                }
                return $.trim(false, false).replace(/$/, '<' + open[0] + toAttributes(open[2]) + '>', -1).replace(/^/, '</' + open[0] + '>', 1).insert(value || open[1] || "");
            }
            return $.wrap(open, close, wrap);
        };
        return $.on('key.down', onKeyDown);
    }

    function detach() {
        return this.off('key.down', onKeyDown);
    }
    var index_js = {
        attach: attach,
        detach: detach
    };
    return index_js;
}));