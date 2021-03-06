/*!
 *
 * The MIT License (MIT)
 *
 * Copyright © 2021 Taufik Nurrohman <https://github.com/taufik-nurrohman>
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
(function(global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) : typeof define === 'function' && define.amd ? define(['exports'], factory) : (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory((global.TE = global.TE || {}, global.TE.SourceXML = {})));
})(this, function(exports) {
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
    var isInstance = function isInstance(x, of ) {
        return x && isSet( of ) && x instanceof of ;
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
    var fromHTML = function fromHTML(x) {
        return x.replace(/&/g, '&amp;').replace(/>/g, '&gt;').replace(/</g, '&lt;');
    };
    var fromValue = function fromValue(x) {
        if (isArray(x)) {
            return x.map(function(v) {
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
        } // No need to escape `/` in the pattern string
        pattern = pattern.replace(/\//g, '\\/');
        return new RegExp(pattern, isSet(opt) ? opt : 'g');
    };
    var x = "!$^*()+=[]{}|:<>,.?/-";
    let tagComment = '<!--([\\s\\S](?!-->)*)-->',
        tagData = '<!((?:\'(?:\\\\.|[^\'])*\'|"(?:\\\\.|[^"])*"|[^>\'"])*)>',
        tagName = '[\\w:.-]+',
        tagStart = name => '<(' + name + ')(\\s(?:\'(?:\\\\.|[^\'])*\'|"(?:\\\\.|[^"])*"|[^/>\'"])*)?>',
        tagEnd = name => '</(' + name + ')>',
        tagVoid = name => '<(' + name + ')(\\s(?:\'(?:\\\\.|[^\'])*\'|"(?:\\\\.|[^"])*"|[^/>\'"])*)?/?>',
        tagPreamble = '<\\?((?:\'(?:\\\\.|[^\'])*\'|"(?:\\\\.|[^"])*"|[^>\'"])*)\\?>',
        tagTokens = '(?:' + tagComment + '|' + tagData + '|' + tagEnd(tagName) + '|' + tagPreamble + '|' + tagStart(tagName) + '|' + tagVoid(tagName) + ')';
    const defaults = {
        source: {
            type: 'XML'
        },
        sourceXML: {}
    };
    const that = {};

    function toAttributes(attributes) {
        if (!attributes) {
            return "";
        } // Sort object by key(s)
        attributes = toObjectKeys(attributes).sort().reduce((r, k) => (r[k] = attributes[k], r), {});
        let attribute,
            v,
            out = "";
        for (attribute in attributes) {
            v = attributes[attribute];
            if (false === v || null === v) {
                continue;
            }
            out += ' ' + attribute;
            if (true !== v) {
                out += '="' + fromHTML(fromValue(v)) + '"';
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
    that.insert = function(name, content = "", attributes = {}, tidy = false) {
        let t = this;
        if (false !== (tidy = toTidy(tidy))) {
            t.trim(tidy[0], "");
        }
        return t.insert('<' + name + toAttributes(attributes) + (false !== content ? '>' + content + '</' + name + '>' : ' />') + (false !== tidy ? tidy[1] : ""), -1, true);
    };
    that.toggle = function(name, content = "", attributes = {}, tidy = false) {
        let t = this,
            {
                after,
                before,
                value
            } = t.$(),
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
    that.wrap = function(name, content = "", attributes = {}, tidy = false) {
        let t = this,
            {
                after,
                before,
                value
            } = t.$();
        if (!value && content) {
            t.insert(content);
        }
        if (false !== (tidy = toTidy(tidy))) {
            t.trim(tidy[0], tidy[1]);
        }
        return t.wrap('<' + name + toAttributes(attributes) + '>', '</' + name + '>');
    };

    function canKeyDown(map, that) {
        let state = that.state,
            charIndent = state.sourceXML.tab || state.tab || '\t',
            {
                key,
                queue
            } = map,
            keyValue = map + ""; // Do nothing
        if (queue.Alt || queue.Control) {
            return true;
        }
        if (['-', '>', '/', '?', ' '].includes(key)) {
            let {
                after,
                before,
                value,
                start
            } = that.$();
            if ('-' === key) {
                // `<!-|`
                if (!value && '<!-' === before.slice(-3)) {
                    that.wrap('- ', ' --' + ('>' === after[0] ? "" : '>')).record();
                    return false;
                }
            }
            if ('>' === key || '/' === key) {
                let tagStartMatch = toPattern(tagStart(tagName) + '$', "").exec(before + '>');
                if (!value && tagStartMatch) {
                    // `<div|`
                    if ('/' === key) {
                        // `<div|>`
                        if ('>' === after[0]) {
                            that.trim("", false).insert(' /', -1).select(that.$().start + 1).record();
                            return false;
                        }
                        that.trim("", false).insert(' />', -1).record();
                        return false;
                    } // `<div|></div>`
                    if (after.startsWith('></' + tagStartMatch[1] + '>')) {
                        that.select(start + 1).record(); // `<div|</div>`
                    } else if (after.startsWith('</' + tagStartMatch[1] + '>')) {
                        that.insert('>', -1).record(); // `<div|`
                    } else {
                        that.wrap('>', '</' + tagStartMatch[1] + ('>' === after[0] ? "" : '>')).record();
                    }
                    return false;
                }
            }
            if ('?' === key) {
                // `<|`
                if (!value && '<' === before.slice(-1)) {
                    that.wrap('?', '?' + ('>' === after[0] ? "" : '>')).record();
                    return false;
                }
            }
            if (' ' === keyValue) {
                if (!value) {
                    if ( // `<!--|-->`
                        '-->' === after.slice(0, 3) && '<!--' === before.slice(-4) || // `<?foo|?>`
                        '?>' === after.slice(0, 2) && '<?' === before.slice(0, 2) && /<\?\S*$/.test(before)) {
                        that.wrap(' ', ' ').record();
                        return false;
                    }
                }
            }
        }
        if ('ArrowLeft' === keyValue) {
            let {
                before,
                start,
                value
            } = that.$();
            if (!value) {
                let tagMatch = toPattern(tagTokens + '$', "").exec(before); // `<foo>|bar`
                if (tagMatch) {
                    that.select(start - toCount(tagMatch[0]), start);
                    return false;
                }
            }
        }
        if ('ArrowRight' === keyValue) {
            let {
                after,
                start,
                value
            } = that.$();
            if (!value) {
                let tagMatch = toPattern('^' + tagTokens, "").exec(after); // `foo|<bar>`
                if (tagMatch) {
                    that.select(start, start + toCount(tagMatch[0]));
                    return false;
                }
            }
        }
        if ('Enter' === keyValue) {
            let {
                after,
                before,
                value
            } = that.$(),
                lineBefore = before.split('\n').pop(),
                lineMatch = lineBefore.match(/^(\s+)/),
                lineMatchIndent = lineMatch && lineMatch[1] || "",
                tagStartMatch = before.match(toPattern(tagStart(tagName) + '$', ""));
            if (!value) {
                if ( // `<!--|-->`
                    /^[ \t]*-->/.test(after) && /<!--[ \t]*$/.test(before) || // `<?foo|?>`
                    /^[ \t]*\?>/.test(after) && /<\?\S*[ \t]*$/.test(before)) {
                    that.trim().wrap('\n' + lineMatchIndent, '\n' + lineMatchIndent).record();
                    return false;
                }
                if (tagStartMatch) {
                    if (after.startsWith('</' + tagStartMatch[1] + '>')) {
                        that.record().trim().wrap('\n' + lineMatchIndent + charIndent, '\n' + lineMatchIndent).record();
                    } else {
                        that.record().wrap('\n' + lineMatchIndent + charIndent, '\n' + lineMatchIndent + '</' + tagStartMatch[1] + '>').record();
                    }
                    return false;
                }
            }
        }
        if ('Backspace' === keyValue) {
            let {
                after,
                before,
                value
            } = that.$();
            if (!value) {
                // `<!--|`
                if ('<!--' === before.slice(-4)) {
                    that.replace(/<!--$/, "", -1); // `<!--|-->`
                    if ('-->' === after.slice(0, 3)) {
                        that.replace(/^-->/, "", 1);
                    }
                    that.record();
                    return false;
                }
                if (/^\s+-->/.test(after) && /<!--\s+$/.test(before)) {
                    that.trim(' ' === before.slice(-1) ? "" : ' ', ' ' === after[0] ? "" : ' ').record();
                    return false;
                } // `<?|`
                if (/<\?\S*$/.test(before)) {
                    that.replace(/<\?\S*$/, "", -1); // `<?|?>`
                    if ('?>' === after.slice(0, 2)) {
                        that.replace(/^\?>/, "", 1);
                    }
                    that.record();
                    return false;
                }
                if (/^\s+\?>/.test(after) && /<\?\S*\s+$/.test(before)) {
                    that.trim(' ' === before.slice(-1) ? "" : ' ', ' ' === after[0] ? "" : ' ').record();
                    return false;
                }
                let tagPattern = toPattern(tagTokens + '$', ""),
                    tagMatch = tagPattern.exec(before);
                if (tagMatch) {
                    // `<div />|`
                    if (' />' === before.slice(-3)) {
                        that.replace(/ \/>$/, '/>', -1).record();
                        return false;
                    } // `<div/>|`
                    if ('/>' === before.slice(-2)) {
                        that.replace(/\/>$/, '>', -1).record();
                        return false;
                    }
                    that.replace(tagPattern, "", -1);
                    let name = tagMatch[0].slice(1).split(/\s+|>/)[0];
                    if (tagMatch[0] && '/' !== tagMatch[0][1]) {
                        if (after.startsWith('</' + name + '>')) {
                            that.replace(toPattern('^</' + name + '>', ""), "", 1);
                        }
                    }
                    that.record();
                    return false;
                }
                if (toPattern(tagStart(tagName) + '\\n(?:' + esc(charIndent) + ')?$', "").test(before) && toPattern('^\\s*' + tagEnd(tagName), "").test(after)) {
                    that.trim().record(); // Collapse!
                    return false;
                }
            }
        }
        if ('Delete' === keyValue) {
            let {
                after,
                value
            } = that.$();
            if (!value) {
                // `|-->`
                if ('-->' === after.slice(0, 3)) {
                    that.replace(/^-->/, "", 1).record();
                    return false;
                } // `|?>`
                if ('?>' === after.slice(0, 2)) {
                    that.replace(/^\?>/, "", 1).record();
                    return false;
                }
                let tagPattern = toPattern('^' + tagTokens, ""),
                    tagMatch = tagPattern.exec(after);
                if (tagMatch) {
                    that.replace(tagPattern, "", 1).record();
                    return false;
                }
            }
        }
        return true;
    }

    function canMouseDown(map, that) {
        let {
            key,
            queue
        } = map;
        if (!queue.Control) {
            W.setTimeout(() => {
                let {
                    after,
                    before,
                    value
                } = that.$();
                if (!value) {
                    let caret = '\ufeff',
                        tagTokensLocal = tagTokens.split('(' + tagName + ')').join('((?:[\\w:.-]|' + caret + ')+)'),
                        tagTokensLocalPattern = toPattern(tagTokensLocal),
                        content = before + value + caret + after,
                        m,
                        v;
                    while (m = tagTokensLocalPattern.exec(content)) {
                        if (hasValue(caret, m[0])) {
                            that.select(v = m.index, v + toCount(m[0]) - 1);
                            break;
                        }
                    }
                }
            }, 1);
        }
        return true;
    }
    const state = defaults;
    exports.canKeyDown = canKeyDown;
    exports.canMouseDown = canMouseDown;
    exports.state = state;
    exports.that = that;
    exports.toAttributes = toAttributes;
});