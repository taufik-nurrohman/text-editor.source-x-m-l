import {offEventDefault} from '@taufik-nurrohman/event';
import {esc, toPattern} from '@taufik-nurrohman/pattern';

export function onKeyDown(e, $) {
    let charAfter,
        charBefore,
        charIndent = $.state.tab || '\t',
        key = e.key,
        keyIsAlt = e.altKey,
        keyIsCtrl = e.ctrlKey,
        keyIsShift = e.shiftKey;
    let tagName = '[\\w:.-]+',
        tagStart = '<(' + tagName + ')(\\s(?:\'(?:\\\\.|[^\'])*\'|"(?:\\\\.|[^"])*"|[^>\'"])*)?>',
        tagEnd = '</(' + tagName + ')>',
        tagVoid = '<(' + tagName + ')(\\s(?:\'(?:\\\\.|[^\'])*\'|"(?:\\\\.|[^"])*"|[^>\'"])*)?/?>',
        tagContainer = tagStart + '([\\s\\S]*?)</(\\1)>';
    // Do nothing
    if (keyIsAlt || keyIsCtrl) {
        return true;
    }
    if ('ArrowLeft' === key && !keyIsShift) {
        let {before, start, value} = $.$();
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
        let {after, start, value} = $.$();
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
