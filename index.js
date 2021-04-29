/*!
 *
 * The MIT License (MIT)
 *
 * Copyright © 2021 Taufik Nurrohman
 *
 * <https://github.com/taufik-nurrohman/text-editor.source-x-m-l>
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
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() : typeof define === 'function' && define.amd ? define(factory) : (global = typeof globalThis !== 'undefined' ? globalThis : global || self, (global.TE = global.TE || {}, global.TE.SourceXML = factory()));
})(this, function() {
    'use strict';
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
    var toCount = function toCount(x) {
        return x.length;
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
        } // No need to escape `/` in the pattern string
        pattern = pattern.replace(/\//g, '\\/');
        return new RegExp(pattern, isSet(opt) ? opt : 'g');
    };
    var x = "!$^*()+=[]{}|:<>,.?/-";
    let tagComment = '<!--([\\s\\S]*?)-->',
        tagData = '<!((?:\'(?:\\\\.|[^\'])*\'|"(?:\\\\.|[^"])*"|[^>\'"])*)>',
        tagName = '[\\w:.-]+',
        tagStart = name => '<(' + name + ')(\\s(?:\'(?:\\\\.|[^\'])*\'|"(?:\\\\.|[^"])*"|[^/>\'"])*)?>',
        tagEnd = name => '</(' + name + ')>',
        tagVoid = name => '<(' + name + ')(\\s(?:\'(?:\\\\.|[^\'])*\'|"(?:\\\\.|[^"])*"|[^/>\'"])*)?/?>',
        tagPreamble = '<\\?((?:\'(?:\\\\.|[^\'])*\'|"(?:\\\\.|[^"])*"|[^>\'"])*)\\?>',
        anyTagToken = '(?:' + tagComment + '|' + tagData + '|' + tagEnd(tagName) + '|' + tagPreamble + '|' + tagStart(tagName) + '|' + tagVoid(tagName) + ')';
    const defaults = {};
    const that = {};

    function toXMLString(name, content, attributes) {
        if (isObject(attributes)) {
            attributes = toXMLAttributeString(attributes);
        }
        return '<' + name + attributes + (false === content ? ' />' : '>' + content + '</' + name + '>');
    }

    function toXMLAttributeString(attributes) {
        let attribute,
            out = "";
        for (attribute in attributes) {
            out += ' ' + attribute + '="' + fromHTML(fromValue(attributes[attribute])) + '"';
        }
        return out;
    }
    that.toggle = function(name, content, attributes = {}) {
        let t = this,
            {
                after,
                before,
                value
            } = t.$(),
            tagStartLocal = tagStart(name),
            tagEndLocal = tagEnd(name),
            tagStartLocalPattern = toPattern(tagStart + '$', ""),
            tagEndLocalPattern = toPattern('^' + tagEnd, ""),
            tagStartLocalMatch = tagStartPattern.test(before),
            tagEndLocalMatch = tagEndPattern.test(after);
        if (tagEndLocalMatch && tagStartLocalMatch) {
            return t.replace(tagEndLocalPattern, "", 1).replace(tagStartLocalPattern, "", -1);
        }
        tagStartLocalPattern = toPattern('^' + tagStartLocal, "");
        tagEndLocalPattern = toPattern(tagEndLocal + '$', "");
        tagStartLocalMatch = tagStartLocalPattern.test(value);
        tagEndLocalMatch = tagEndLocalPattern.test(value);
        if (value && tagEndLocalMatch && tagStartLocalMatch) {
            t.insert(value.replace(tagEndLocalPattern, "").replace(tagStartLocalPattern, ""));
        } else if (content) {
            t.insert(content);
        }
        return t.wrap(toXMLString(name, "", attributes));
    };

    function canKeyDown(key, {
        a,
        c,
        s
    }, that) {
        let state = that.state,
            charIndent = state.tab || '\t'; // Do nothing
        if (a || c) {
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
                let tagStartMatch = toPattern(tagStart + '$', "").exec(before + '>');
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
                    if ('></' + tagStartMatch[1] + '>' === after.slice(0, toCount(tagStartMatch[1]) + 4)) {
                        that.select(start + 1).record(); // `<div|</div>`
                    } else if ('</' + tagStartMatch[1] + '>' === after.slice(0, toCount(tagStartMatch[1]) + 3)) {
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
            if (' ' === key) {
                // `<!--|-->`
                if (!value && '<!--' === before.slice(-4) && '-->' === after.slice(0, 3)) {
                    that.wrap(' ', ' ').record();
                    return false;
                }
            }
        }
        if ('ArrowLeft' === key && !s) {
            let {
                before,
                start,
                value
            } = that.$();
            if (!value) {
                let tagMatch = toPattern(anyTagToken + '$', "").exec(before); // `<foo>|bar`
                if (tagMatch) {
                    that.select(tagMatch.index, start);
                    return false;
                }
            }
        }
        if ('ArrowRight' === key && !s) {
            let {
                after,
                start,
                value
            } = that.$();
            if (!value) {
                let tagMatch = toPattern('^' + anyTagToken, "").exec(after); // `foo|<bar>`
                if (tagMatch) {
                    that.select(start, start + toCount(tagMatch[0]));
                    return false;
                }
            }
        }
        if ('Enter' === key && !s) {
            let {
                after,
                before,
                value
            } = that.$(),
                lineBefore = before.split('\n').pop(),
                lineMatch = lineBefore.match(/^(\s+)/),
                lineMatchIndent = lineMatch && lineMatch[1] || "",
                tagStartMatch = before.match(toPattern(tagStart + '$', "")); // `<!--|-->`
            if (!value && /^[ \t]*-->/.test(after) && /<!--[ \t]*$/.test(before)) {
                that.trim().wrap('\n\n' + lineMatchIndent, '\n\n' + lineMatchIndent).record();
                return false;
            }
            if (!value && tagStartMatch) {
                if (toPattern('^</' + tagStartMatch[1] + '>', "").test(after)) {
                    that.record().trim().wrap('\n' + lineMatchIndent + charIndent, '\n' + lineMatchIndent).record();
                } else {
                    that.record().wrap('\n' + lineMatchIndent + charIndent, '\n' + lineMatchIndent + '</' + tagStartMatch[1] + '>').record();
                }
                return false;
            }
        }
        if ('Backspace' === key && !s) {
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
                if ('<?' === before.slice(-2)) {
                    that.replace(/<\?$/, "", -1); // `<?|?>`
                    if ('?>' === after.slice(0, 2)) {
                        that.replace(/^\?>/, "", 1);
                    }
                    that.record();
                    return false;
                }
                let tagPattern = toPattern(anyTagToken + '$', ""),
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
                        if ('</' + name + '>' === after.slice(0, toCount(name) + 3)) {
                            that.replace(toPattern('^</' + name + '>', ""), "", 1);
                        }
                    }
                    that.record();
                    return false;
                }
                if (toPattern(tagStart + '\\n(?:' + esc(charIndent) + ')?$', "").test(before) && toPattern('^\\s*' + tagEnd, "").test(after)) {
                    that.trim().record(); // Collapse!
                    return false;
                }
            }
        }
        if ('Delete' === key && !s) {
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
                let tagPattern = toPattern('^' + anyTagToken, ""),
                    tagMatch = tagPattern.exec(after);
                if (tagMatch) {
                    that.replace(tagPattern, "", 1).record();
                    return false;
                }
            }
        }
        return true;
    }

    function canMouseDown(that) {
        setTimeout(() => {
            let {
                after,
                before,
                value
            } = that.$();
            if (!value) {
                let caret = '\ufeff',
                    anyTagTokenLocal = anyTagToken.split('(' + tagName + ')').join('((?:[\\w:.-]|' + caret + ')+)'),
                    anyTagTokenLocalPattern = toPattern(anyTagTokenLocal),
                    content = before + value + caret + after,
                    m,
                    v;
                while (m = anyTagTokenLocalPattern.exec(content)) {
                    if (-1 !== m[0].indexOf(caret)) {
                        that.select(v = m.index, v + toCount(m[0]) - 1);
                        break;
                    }
                }
            }
        }, 1);
        return true;
    }
    var _virtual_entry = {
        canKeyDown,
        canMouseDown,
        state: defaults,
        that
    };
    return _virtual_entry;
});