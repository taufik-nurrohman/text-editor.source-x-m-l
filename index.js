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
    var toCount = function toCount(x) {
        return x.length;
    };
    var toObjectKeys = function toObjectKeys(x) {
        return Object.keys(x);
    };
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
    var offEvent = function offEvent(name, node, then) {
        node.removeEventListener(name, then);
    };
    var offEventDefault = function offEventDefault(e) {
        return e && e.preventDefault();
    };
    var onEvent = function onEvent(name, node, then, options) {
        if (options === void 0) {
            options = false;
        }
        node.addEventListener(name, then, options);
    };
    var tagComment = function tagComment() {
            return '<!--([\\s\\S](?!-->)*)-->';
        },
        tagData = function tagData() {
            return '<!((?:\'(?:\\\\.|[^\'])*\'|"(?:\\\\.|[^"])*"|[^>\'"])*)>';
        },
        tagName = function tagName() {
            return '[\\w:.-]+';
        },
        tagStart = function tagStart(name) {
            return '<(' + name + ')(\\s(?:\'(?:\\\\.|[^\'])*\'|"(?:\\\\.|[^"])*"|[^/>\'"])*)?>';
        },
        tagEnd = function tagEnd(name) {
            return '</(' + name + ')>';
        },
        tagVoid = function tagVoid(name) {
            return '<(' + name + ')(\\s(?:\'(?:\\\\.|[^\'])*\'|"(?:\\\\.|[^"])*"|[^/>\'"])*)?/?>';
        },
        tagPreamble = function tagPreamble() {
            return '<\\?((?:\'(?:\\\\.|[^\'])*\'|"(?:\\\\.|[^"])*"|[^>\'"])*)\\?>';
        },
        tagTokens = function tagTokens() {
            return '(?:' + tagComment() + '|' + tagData() + '|' + tagEnd(tagName()) + '|' + tagPreamble() + '|' + tagVoid(tagName()) + '|' + tagStart(tagName()) + ')';
        };

    function onMouseDown(e) {}

    function onKeyDown(e) {
        var _editor$state$source;
        var self = this,
            editor = self.TextEditor,
            keys = editor.k();
        if (!editor || e.defaultPrevented) {
            return;
        }
        if (editor.keys[keys]) {
            return;
        }
        // Do nothing
        if ('Alt' === keys || 'Control' === keys) {
            return;
        }
        var key = keys.split('-').pop(),
            _editor$$ = editor.$(),
            after = _editor$$.after,
            before = _editor$$.before;
        _editor$$.end;
        var start = _editor$$.start,
            value = _editor$$.value;
        if ("" === key) {
            key = '-';
        }
        if (['-', '>', '/', '?', ' '].includes(key)) {
            if ('-' === key) {
                // `<!-|`
                if (!value && '<!-' === before.slice(-3)) {
                    offEventDefault(e);
                    return editor.wrap('- ', ' --' + ('>' === after[0] ? "" : '>')).record();
                }
                return;
            }
            if ('>' === key || '/' === key) {
                var tagStartMatch = toPattern(tagStart(tagName()) + '$', "").exec(before + '>');
                if (!value && tagStartMatch) {
                    offEventDefault(e);
                    // `<div|`
                    if ('/' === key) {
                        // `<div|>`
                        if ('>' === after[0]) {
                            return editor.trim("", false).insert(' /', -1).select(editor.$().start + 1).record();
                        }
                        return editor.trim("", false).insert(' />', -1).record();
                    }
                    // `<div|></div>`
                    if (after.startsWith('></' + tagStartMatch[1] + '>')) {
                        editor.select(start + 1).record();
                        // `<div|</div>`
                    } else if (after.startsWith('</' + tagStartMatch[1] + '>')) {
                        editor.insert('>', -1).record();
                        // `<div|`
                    } else {
                        editor.wrap('>', '</' + tagStartMatch[1] + ('>' === after[0] ? "" : '>')).record();
                    }
                }
                return;
            }
            if ('?' === key) {
                // `<|`
                if (!value && '<' === before.slice(-1)) {
                    offEventDefault(e);
                    return editor.wrap('?', '?' + ('>' === after[0] ? "" : '>')).record();
                }
                return;
            }
            if (' ' === key) {
                if (!value) {
                    if (
                        // `<!--|-->`
                        '-->' === after.slice(0, 3) && '<!--' === before.slice(-4) ||
                        // `<?foo|?>`
                        '?>' === after.slice(0, 2) && '<?' === before.slice(0, 2) && /<\?\S*$/.test(before)) {
                        offEventDefault(e);
                        return editor.wrap(' ', ' ').record();
                    }
                }
                return;
            }
            return;
        }
        // Update current selection data
        var s = editor.$();
        after = s.after;
        before = s.before;
        s.end;
        start = s.start;
        value = s.value;
        if ('ArrowLeft' === keys) {
            if (!value) {
                var tagMatch = toPattern(tagTokens() + '$', "").exec(before);
                // `<foo>|bar`
                if (tagMatch) {
                    offEventDefault(e);
                    return editor.select(start - toCount(tagMatch[0]), start);
                }
            }
            return;
        }
        if ('ArrowRight' === keys) {
            if (!value) {
                var _tagMatch = toPattern('^' + tagTokens(), "").exec(after);
                // `foo|<bar>`
                if (_tagMatch) {
                    offEventDefault(e);
                    return editor.select(start, start + toCount(_tagMatch[0]));
                }
            }
            return;
        }
        var charIndent = ((_editor$state$source = editor.state.source) == null ? void 0 : _editor$state$source.tab) || editor.state.tab || '\t',
            lineBefore = before.split('\n').pop(),
            lineMatch = lineBefore.match(/^(\s+)/),
            lineMatchIndent = lineMatch && lineMatch[1] || "";
        if ('Enter' === keys) {
            var _tagStartMatch = before.match(toPattern(tagStart(tagName()) + '$', ""));
            if (!value) {
                if (_tagStartMatch) {
                    offEventDefault(e);
                    if (after.startsWith('</' + _tagStartMatch[1] + '>')) {
                        return editor.record().trim().wrap('\n' + lineMatchIndent + charIndent, '\n' + lineMatchIndent).record();
                    }
                    return editor.record().wrap('\n' + lineMatchIndent + charIndent, '\n' + lineMatchIndent + '</' + _tagStartMatch[1] + '>').record();
                }
                if (
                    // `<!--|-->`
                    /^[ \t]*-->/.test(after) && /<!--[ \t]*$/.test(before) ||
                    // `<?foo|?>`
                    /^[ \t]*\?>/.test(after) && /<\?\S*[ \t]*$/.test(before)) {
                    offEventDefault(e);
                    return editor.trim().wrap('\n' + lineMatchIndent, '\n' + lineMatchIndent).record();
                }
            }
            return;
        }
        if ('Backspace' === keys) {
            if (!value) {
                // `<!--|`
                if ('<!--' === before.slice(-4)) {
                    offEventDefault(e);
                    editor.replace(/<!--$/, "", -1);
                    // `<!--|-->`
                    if ('-->' === after.slice(0, 3)) {
                        editor.replace(/^-->/, "", 1);
                    }
                    return editor.record();
                }
                if (/^\s+-->/.test(after) && /<!--\s+$/.test(before)) {
                    offEventDefault(e);
                    return editor.trim(' ' === before.slice(-1) ? "" : ' ', ' ' === after[0] ? "" : ' ').record();
                }
                // `<?|`
                if (/<\?\S*$/.test(before)) {
                    offEventDefault(e);
                    editor.replace(/<\?\S*$/, "", -1);
                    // `<?|?>`
                    if ('?>' === after.slice(0, 2)) {
                        editor.replace(/^\?>/, "", 1);
                    }
                    return editor.record();
                }
                if (/^\s+\?>/.test(after) && /<\?\S*\s+$/.test(before)) {
                    offEventDefault(e);
                    return editor.trim(' ' === before.slice(-1) ? "" : ' ', ' ' === after[0] ? "" : ' ').record();
                }
                var tagPattern = toPattern(tagTokens() + '$', ""),
                    _tagMatch2 = tagPattern.exec(before);
                if (_tagMatch2) {
                    offEventDefault(e);
                    // `<div />|`
                    if (' />' === before.slice(-3)) {
                        return editor.replace(/ \/>$/, '/>', -1).record();
                    }
                    // `<div/>|`
                    if ('/>' === before.slice(-2)) {
                        return editor.replace(/\/>$/, '>', -1).record();
                    }
                    editor.replace(tagPattern, "", -1);
                    var name = _tagMatch2[0].slice(1).split(/\s+|>/)[0];
                    if (_tagMatch2[0] && '/' !== _tagMatch2[0][1]) {
                        if (after.startsWith('</' + name + '>')) {
                            editor.replace(toPattern('^</' + name + '>', ""), "", 1);
                        }
                    }
                    return editor.record();
                }
                if (toPattern(tagStart(tagName()) + '\\n(?:' + esc(charIndent) + ')?$', "").test(before) && toPattern('^\\s*' + tagEnd(tagName()), "").test(after)) {
                    offEventDefault(e);
                    return editor.trim().record(); // Collapse!
                }
            }
            return;
        }
        if ('Delete' === keys) {
            if (!value) {
                // `|-->`
                if ('-->' === after.slice(0, 3)) {
                    offEventDefault(e);
                    return editor.replace(/^-->/, "", 1).record();
                }
                // `|?>`
                if ('?>' === after.slice(0, 2)) {
                    offEventDefault(e);
                    return editor.replace(/^\?>/, "", 1).record();
                }
                var _tagPattern = toPattern('^' + tagTokens(), ""),
                    _tagMatch3 = _tagPattern.exec(after);
                if (_tagMatch3) {
                    offEventDefault(e);
                    return editor.replace(_tagPattern, "", 1).record();
                }
            }
        }
    }

    function onKeyUp(e) {}

    function onTouchStart(e) {
        return onMouseDown.call(this, e);
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

    function attach(self) {
        var _$$state$source3;
        var $ = this;
        $.insertXML = function (name, content, attributes, tidy) {
            if (content === void 0) {
                content = "";
            }
            if (attributes === void 0) {
                attributes = {};
            }
            if (tidy === void 0) {
                tidy = false;
            }
            // `<asdf>|</asdf>`
            if (tidy) {
                var _$$state$source;
                var _$$$ = $.$(),
                    after = _$$$.after,
                    before = _$$$.before,
                    tab = ((_$$state$source = $.state.source) == null ? void 0 : _$$state$source.tab) || $.state.tab || '\t';
                if (toPattern('^' + tagEnd(tagName()), "").test(after) && toPattern(tagStart(tagName()) + '$', "").test(before)) {
                    var lineBefore = before.split('\n').pop(),
                        lineMatch = lineBefore.match(/^(\s+)/),
                        lineMatchIndent = lineMatch && lineMatch[1] || "";
                    $.wrap('\n' + tab + lineMatchIndent, '\n' + lineMatchIndent);
                }
            }
            return $.insert('<' + name + toAttributes(attributes) + (false !== content ? '>' + content + '</' + name + '>' : ' />'), -1, true);
        };
        $.peelXML = function (name, content, attributes, tidy) {
            if (tidy === void 0) {
                tidy = false;
            }
            // `<asdf> <asdf>|</asdf> </asdf>`
            if (tidy) {
                $.trim("", "");
            }
            return $.replace(toPattern(tagStart(name) + '$', ""), "", -1).replace(toPattern('^' + tagEnd(name)), "", 1);
        };
        $.toggleXML = function (name, content, attributes, tidy) {
            if (content === void 0) {
                content = "";
            }
            if (attributes === void 0) {
                attributes = {};
            }
            if (tidy === void 0) {
                tidy = false;
            }
            var _$$$2 = $.$(),
                after = _$$$2.after,
                before = _$$$2.before,
                tagStartOf = tagStart(name),
                tagEndOf = tagEnd(name),
                tagStartPattern = toPattern(tagStartOf + '$', ""),
                tagEndPattern = toPattern('^' + tagEndOf, ""),
                tagStartMatch = tagStartPattern.test(before),
                tagEndMatch = tagEndPattern.test(after);
            return $[(tagStartMatch && tagEndMatch ? 'peel' : 'wrap') + 'XML'](name, content, attributes, tidy);
        };
        $.wrapXML = function (name, content, attributes, tidy) {
            if (content === void 0) {
                content = "";
            }
            if (attributes === void 0) {
                attributes = {};
            }
            if (tidy === void 0) {
                tidy = false;
            }
            var _$$$3 = $.$(),
                after = _$$$3.after,
                before = _$$$3.before,
                value = _$$$3.value;
            if (!value && content) {
                $.insert(content);
            }
            // `<asdf>|</asdf>`
            if (tidy) {
                var _$$state$source2;
                var tab = ((_$$state$source2 = $.state.source) == null ? void 0 : _$$state$source2.tab) || $.state.tab || '\t';
                if (toPattern('^' + tagEnd(tagName()), "").test(after) && toPattern(tagStart(tagName()) + '$', "").test(before)) {
                    var lineBefore = before.split('\n').pop(),
                        lineMatch = lineBefore.match(/^(\s+)/),
                        lineMatchIndent = lineMatch && lineMatch[1] || "";
                    $.wrap('\n' + tab + lineMatchIndent, '\n' + lineMatchIndent);
                }
            }
            return $.wrap('<' + name + toAttributes(attributes) + '>', '</' + name + '>');
        };
        if ('XML' === ((_$$state$source3 = $.state.source) == null ? void 0 : _$$state$source3.type)) {
            onEvent('keydown', self, onKeyDown);
            onEvent('keyup', self, onKeyUp);
            onEvent('mousedown', self, onMouseDown);
            onEvent('touchstart', self, onTouchStart);
        }
        return $;
    }

    function detach(self) {
        offEvent('keydown', self, onKeyDown);
        offEvent('keyup', self, onKeyUp);
        offEvent('mousedown', self, onMouseDown);
        offEvent('touchstart', self, onTouchStart);
        return $;
    }
    var index_js = {
        attach: attach,
        detach: detach
    };
    return index_js;
}));