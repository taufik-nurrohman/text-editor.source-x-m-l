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
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) : typeof define === 'function' && define.amd ? define(['exports'], factory) : (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory((global.TE = global.TE || {}, global.TE.SourceXML = {})));
})(this, function(exports) {
    'use strict';
    var isDefined = function isDefined(x) {
        return 'undefined' !== typeof x;
    };
    var isInstance = function isInstance(x, of ) {
        return x && isSet( of ) && x instanceof of ;
    };
    var isNull = function isNull(x) {
        return null === x;
    };
    var isSet = function isSet(x) {
        return isDefined(x) && !isNull(x);
    };
    var offEventDefault = function offEventDefault(e) {
        return e && e.preventDefault();
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

    function onKeyDown(e, $) {
        let charIndent = $.state.tab || '\t',
            key = e.key,
            keyIsAlt = e.altKey,
            keyIsCtrl = e.ctrlKey,
            keyIsShift = e.shiftKey;
        let tagComment = '<!--([\\s\\S]*?)-->',
            tagData = '<!((?:\'(?:\\\\.|[^\'])*\'|"(?:\\\\.|[^"])*"|[^>\'"])*)>',
            tagName = '[\\w:.-]+',
            tagStart = '<(' + tagName + ')(\\s(?:\'(?:\\\\.|[^\'])*\'|"(?:\\\\.|[^"])*"|[^/>\'"])*)?>',
            tagEnd = '</(' + tagName + ')>',
            tagVoid = '<(' + tagName + ')(\\s(?:\'(?:\\\\.|[^\'])*\'|"(?:\\\\.|[^"])*"|[^/>\'"])*)?/?>',
            tagPreamble = '<\\?((?:\'(?:\\\\.|[^\'])*\'|"(?:\\\\.|[^"])*"|[^>\'"])*)\\?>'; // Do nothing
        if (keyIsAlt || keyIsCtrl) {
            return true;
        }
        if (['-', '>', '/', '?', ' '].includes(key)) {
            let {
                after,
                before,
                value,
                start
            } = $.$();
            if ('-' === key) {
                // `<!-|`
                if (!value && '<!-' === before.slice(-3)) {
                    $.wrap('- ', ' --' + ('>' === after[0] ? "" : '>')).record();
                    offEventDefault(e);
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
                            $.trim().insert(' /', -1).select(start + 3).record();
                            offEventDefault(e);
                            return false;
                        }
                        $.trim().insert(' />', -1).record();
                        offEventDefault(e);
                        return false;
                    } // `<div|></div>`
                    if ('></' + tagStartMatch[1] + '>' === after.slice(0, toCount(tagStartMatch[1]) + 4)) {
                        $.select(start + 1).record(); // `<div|</div>`
                    } else if ('</' + tagStartMatch[1] + '>' === after.slice(0, toCount(tagStartMatch[1]) + 3)) {
                        $.insert('>', -1).record(); // `<div|`
                    } else {
                        $.wrap('>', '</' + tagStartMatch[1] + ('>' === after[0] ? "" : '>')).record();
                    }
                    offEventDefault(e);
                    return false;
                }
            }
            if ('?' === key) {
                // `<|`
                if (!value && '<' === before.slice(-1)) {
                    $.wrap('?', '?' + ('>' === after[0] ? "" : '>')).record();
                    offEventDefault(e);
                    return false;
                }
            }
            if (' ' === key) {
                // `<!--|-->`
                if (!value && '<!--' === before.slice(-4) && '-->' === after.slice(0, 3)) {
                    $.wrap(' ', ' ').record();
                    offEventDefault(e);
                    return false;
                }
            }
        }
        if ('ArrowLeft' === key && !keyIsShift) {
            let {
                before,
                start,
                value
            } = $.$();
            if (!value) {
                let tagMatch = toPattern('(?:' + tagComment + '|' + tagData + '|' + tagEnd + '|' + tagPreamble + '|' + tagStart + '|' + tagVoid + ')$', "").exec(before); // `<foo>|bar`
                if (tagMatch) {
                    $.select(tagMatch.index, start);
                    offEventDefault(e);
                    return false;
                }
            }
        }
        if ('ArrowRight' === key && !keyIsShift) {
            let {
                after,
                start,
                value
            } = $.$();
            if (!value) {
                let tagMatch = toPattern('^(?:' + tagComment + '|' + tagData + '|' + tagEnd + '|' + tagPreamble + '|' + tagStart + '|' + tagVoid + ')', "").exec(after); // `foo|<bar>`
                if (tagMatch) {
                    $.select(start, start + toCount(tagMatch[0]));
                    offEventDefault(e);
                    return false;
                }
            }
        }
        if ('Enter' === key && !keyIsShift) {
            let {
                after,
                before,
                value
            } = $.$(),
                lineBefore = before.split('\n').pop(),
                lineMatch = lineBefore.match(/^(\s+)/),
                lineMatchIndent = lineMatch && lineMatch[1] || "",
                tagStartMatch = before.match(toPattern(tagStart + '$', "")); // `<!--|-->`
            if (!value && /^[ \t]*-->/.test(after) && /<!--[ \t]*$/.test(before)) {
                $.trim().wrap('\n\n' + lineMatchIndent, '\n\n' + lineMatchIndent).record();
                offEventDefault(e);
                return false;
            }
            if (!value && tagStartMatch) {
                if (toPattern('^</' + tagStartMatch[1] + '>', "").test(after)) {
                    $.record().trim().wrap('\n' + lineMatchIndent + charIndent, '\n' + lineMatchIndent).record();
                } else {
                    $.record().wrap('\n' + lineMatchIndent + charIndent, '\n' + lineMatchIndent + '</' + tagStartMatch[1] + '>').record();
                }
                offEventDefault(e);
                return false;
            }
        }
        if ('Backspace' === key && !keyIsShift) {
            let {
                after,
                before,
                value
            } = $.$();
            if (!value) {
                // `<!--|`
                if ('<!--' === before.slice(-4)) {
                    $.replace(/<!--$/, "", -1); // `<!--|-->`
                    if ('-->' === after.slice(0, 3)) {
                        $.replace(/^-->/, "", 1);
                    }
                    $.record();
                    offEventDefault(e);
                    return false;
                }
                if (/^\s+-->/.test(after) && /<!--\s+$/.test(before)) {
                    $.trim(' ' === before.slice(-1) ? "" : ' ', ' ' === after[0] ? "" : ' ').record();
                    offEventDefault(e);
                    return false;
                } // `<?|`
                if ('<?' === before.slice(-2)) {
                    $.replace(/<\?$/, "", -1); // `<?|?>`
                    if ('?>' === after.slice(0, 2)) {
                        $.replace(/^\?>/, "", 1);
                    }
                    $.record();
                    offEventDefault(e);
                    return false;
                }
                let tagPattern = toPattern('(?:' + tagComment + '|' + tagData + '|' + tagEnd + '|' + tagPreamble + '|' + tagStart + '|' + tagVoid + ')$', ""),
                    tagMatch = tagPattern.exec(before);
                if (tagMatch) {
                    $.replace(tagPattern, "", -1);
                    let name = tagMatch[0].slice(1).split(/\s+|>/)[0];
                    if (tagMatch[0] && '/' !== tagMatch[0][1]) {
                        if ('</' + name + '>' === after.slice(0, toCount(name) + 3)) {
                            $.replace(toPattern('^</' + name + '>', ""), "", 1);
                        }
                    }
                    $.record();
                    offEventDefault(e);
                    return false;
                }
                if (toPattern(tagStart + '\\n(?:' + esc(charIndent) + ')?$', "").test(before) && toPattern('^\\s*' + tagEnd, "").test(after)) {
                    $.trim().record(); // Collapse!
                    offEventDefault(e);
                    return false;
                }
            }
        }
        if ('Delete' === key && !keyIsShift) {
            let {
                after,
                value
            } = $.$();
            if (!value) {
                // `|-->`
                if ('-->' === after.slice(0, 3)) {
                    $.replace(/^-->/, "", 1).record();
                    offEventDefault(e);
                    return false;
                } // `|?>`
                if ('?>' === after.slice(0, 2)) {
                    $.replace(/^\?>/, "", 1).record();
                    offEventDefault(e);
                    return false;
                }
                let tagPattern = toPattern('^(?:' + tagComment + '|' + tagData + '|' + tagEnd + '|' + tagPreamble + '|' + tagStart + '|' + tagVoid + ')', ""),
                    tagMatch = tagPattern.exec(after);
                if (tagMatch) {
                    $.replace(tagPattern, "", 1).record();
                    offEventDefault(e);
                    return false;
                }
            }
        }
        return true;
    }
    exports.onKeyDown = onKeyDown;
});