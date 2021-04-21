import {offEventDefault} from '@taufik-nurrohman/event';
import {esc, toPattern} from '@taufik-nurrohman/pattern';
import {toCount} from '@taufik-nurrohman/to';

export function onKeyDown(e, $) {
    let charAfter,
        charBefore,
        charIndent = $.state.tab || '\t',
        key = e.key,
        keyIsAlt = e.altKey,
        keyIsCtrl = e.ctrlKey,
        keyIsShift = e.shiftKey;
    let tagName = '[\\w:.-]+',
        tagStart = '<(' + tagName + ')(\\s(?:\'(?:\\\\.|[^\'])*\'|"(?:\\\\.|[^"])*"|[^/>\'"])*)?>',
        tagEnd = '</(' + tagName + ')>',
        tagVoid = '<(' + tagName + ')(\\s(?:\'(?:\\\\.|[^\'])*\'|"(?:\\\\.|[^"])*"|[^/>\'"])*)?/?>',
        tagContainer = tagStart + '([\\s\\S]*?)</(\\1)>';
    // Do nothing
    if (keyIsAlt || keyIsCtrl) {
        return true;
    }
    if ('>' === key || '/' === key) {
        let {after, before, start} = $.$(),
            tagStartMatch = toPattern(tagStart + '$', "").exec(before + '>');
        if (tagStartMatch) {
            if ('/' === key) {
                if ('>' === after[0]) {
                    $.trim().insert(' /', -1).select(start + 3).record();
                    offEventDefault(e);
                    return false;
                }
                $.trim().insert(' />', -1).record();
                offEventDefault(e);
                return false;
            }
            // `<div|></div>`
            if ('></' + tagStartMatch[1] + '>' === after.slice(0, toCount(tagStartMatch[1]) + 4)) {
                $.select(start + 1).record();
            // `<div|</div>`
            } else if ('</' + tagStartMatch[1] + '>' === after.slice(0, toCount(tagStartMatch[1]) + 3)) {
                $.insert('>', -1).record();
            // `<div|`
            } else {
                $.wrap('>', '</' + tagStartMatch[1] + ('>' === after[0] ? "" : '>')).record();
            }
            offEventDefault(e);
            return false;
        }
    }
    if ('?' === key) {
        let {after, before} = $.$();
        // `<|`
        if ('<' === before.slice(-1)) {
            $.wrap('?', '?' + ('>' === after[0] ? "" : '>')).record();
            offEventDefault(e);
            return false;
        }
    }
    if ('ArrowLeft' === key && !keyIsShift) {
        let {before, start, value} = $.$();
        if (!value) {
            let tagMatch = toPattern('(?:' + tagEnd + '|' + tagStart + '|' + tagVoid + ')$', "").exec(before);
            if (tagMatch) {
                $.select(tagMatch.index, start);
                offEventDefault(e);
                return false;
            }
        }
    }
    if ('ArrowRight' === key && !keyIsShift) {
        let {after, start, value} = $.$();
        if (!value) {
            let tagMatch = toPattern('^(?:' + tagEnd + '|' + tagStart + '|' + tagVoid + ')', "").exec(after);
            if (tagMatch) {
                $.select(start, start + toCount(tagMatch[0]));
                offEventDefault(e);
                return false;
            }
        }
    }
    if ('Enter' === key && !keyIsShift) {
        let {after, before, value} = $.$(),
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
        let {after, before, value} = $.$();
        if (!value) {
            let tagPattern = toPattern('(?:' + tagEnd + '|' + tagStart + '|' + tagVoid + ')$', ""),
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
            if (
                toPattern(tagStart + '\\n(?:' + esc(charIndent) + ')?$', "").test(before) &&
                toPattern('^\\s*' + tagEnd, "").test(after)
            ) {
                $.trim().record(); // Collapse!
                offEventDefault(e);
                return false;
            }
        }
    }
    if ('Delete' === key && !keyIsShift) {
        let {after, value} = $.$();
        if (!value) {
            let tagPattern = toPattern('^(?:' + tagEnd + '|' + tagStart + '|' + tagVoid + ')', ""),
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
