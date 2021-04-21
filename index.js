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
        let tagName = '[\\w:.-]+',
            tagStart = '<(' + tagName + ')(\\s(?:\'(?:\\\\.|[^\'])*\'|"(?:\\\\.|[^"])*"|[^>\'"])*)?>',
            tagEnd = '</(' + tagName + ')>'; // Do nothing
        if (keyIsAlt || keyIsCtrl) {
            return true;
        }
        if ('ArrowLeft' === key && !keyIsShift) {
            let {
                before,
                start,
                value
            } = $.$();
            if (!value) {
                let tagMatch = toPattern('(?:' + tagEnd + '|' + tagStart + ')$', "").exec(before);
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
                let tagMatch = toPattern('^(?:' + tagEnd + '|' + tagStart + ')', "").exec(after);
                if (tagMatch) {
                    $.select(start, start + tagMatch[0].length);
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
                tagStartMatch = before.match(toPattern(tagStart + '$', ""));
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
                let tagPattern = toPattern('(?:' + tagEnd + '|' + tagStart + ')$', ""),
                    tagMatch = tagPattern.exec(before);
                if (tagMatch) {
                    $.replace(tagPattern, "", -1);
                    let name = tagMatch[0].slice(1).split(/\s+/)[0];
                    if (tagMatch[0] && '/' !== tagMatch[0][1]) {
                        if ('</' + name + '>' === after.slice(0, tagMatch[0].length)) {
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
                let tagPattern = toPattern('^(?:' + tagEnd + '|' + tagStart + ')', ""),
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