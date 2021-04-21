import {esc, toPattern} from '@taufik-nurrohman/pattern';
import {toCount} from '@taufik-nurrohman/to';

let tagComment = '<!--([\\s\\S]*?)-->',
    tagData = '<!((?:\'(?:\\\\.|[^\'])*\'|"(?:\\\\.|[^"])*"|[^>\'"])*)>',
    tagName = '[\\w:.-]+',
    tagStart = '<(' + tagName + ')(\\s(?:\'(?:\\\\.|[^\'])*\'|"(?:\\\\.|[^"])*"|[^/>\'"])*)?>',
    tagEnd = '</(' + tagName + ')>',
    tagVoid = '<(' + tagName + ')(\\s(?:\'(?:\\\\.|[^\'])*\'|"(?:\\\\.|[^"])*"|[^/>\'"])*)?/?>',
    tagContainer = tagStart + '([\\s\\S]*?)</(\\1)>',
    tagPreamble = '<\\?((?:\'(?:\\\\.|[^\'])*\'|"(?:\\\\.|[^"])*"|[^>\'"])*)\\?>';

function canKeyDown(key, {a, c, s}, that) {
    let charAfter,
        charBefore,
        charIndent = that.state.tab || '\t';
    // Do nothing
    if (a || c) {
        return true;
    }
    if (['-', '>', '/', '?', ' '].includes(key)) {
        let {after, before, value, start} = that.$();
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
                        that.trim().insert(' /', -1).select(start + 3).record();
                        return false;
                    }
                    that.trim().insert(' />', -1).record();
                    return false;
                }
                // `<div|></div>`
                if ('></' + tagStartMatch[1] + '>' === after.slice(0, toCount(tagStartMatch[1]) + 4)) {
                    that.select(start + 1).record();
                // `<div|</div>`
                } else if ('</' + tagStartMatch[1] + '>' === after.slice(0, toCount(tagStartMatch[1]) + 3)) {
                    that.insert('>', -1).record();
                // `<div|`
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
        let {before, start, value} = that.$();
        if (!value) {
            let tagMatch = toPattern('(?:' + tagComment + '|' + tagData + '|' + tagEnd + '|' + tagPreamble + '|' + tagStart + '|' + tagVoid + ')$', "").exec(before);
            // `<foo>|bar`
            if (tagMatch) {
                that.select(tagMatch.index, start);
                return false;
            }
        }
    }
    if ('ArrowRight' === key && !s) {
        let {after, start, value} = that.$();
        if (!value) {
            let tagMatch = toPattern('^(?:' + tagComment + '|' + tagData + '|' + tagEnd + '|' + tagPreamble + '|' + tagStart + '|' + tagVoid + ')', "").exec(after);
            // `foo|<bar>`
            if (tagMatch) {
                that.select(start, start + toCount(tagMatch[0]));
                return false;
            }
        }
    }
    if ('Enter' === key && !s) {
        let {after, before, value} = that.$(),
            lineBefore = before.split('\n').pop(),
            lineMatch = lineBefore.match(/^(\s+)/),
            lineMatchIndent = lineMatch && lineMatch[1] || "",
            tagStartMatch = before.match(toPattern(tagStart + '$', ""));
        // `<!--|-->`
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
        let {after, before, value} = that.$();
        if (!value) {
            // `<!--|`
            if ('<!--' === before.slice(-4)) {
                that.replace(/<!--$/, "", -1);
                // `<!--|-->`
                if ('-->' === after.slice(0, 3)) {
                    that.replace(/^-->/, "", 1);
                }
                that.record();
                return false;
            }
            if (/^\s+-->/.test(after) && /<!--\s+$/.test(before)) {
                that.trim(' ' === before.slice(-1) ? "" : ' ', ' ' === after[0] ? "" : ' ').record();
                return false;
            }
            // `<?|`
            if ('<?' === before.slice(-2)) {
                that.replace(/<\?$/, "", -1);
                // `<?|?>`
                if ('?>' === after.slice(0, 2)) {
                    that.replace(/^\?>/, "", 1);
                }
                that.record();
                return false;
            }
            let tagPattern = toPattern('(?:' + tagComment + '|' + tagData + '|' + tagEnd + '|' + tagPreamble + '|' + tagStart + '|' + tagVoid + ')$', ""),
                tagMatch = tagPattern.exec(before);
            if (tagMatch) {
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
            if (
                toPattern(tagStart + '\\n(?:' + esc(charIndent) + ')?$', "").test(before) &&
                toPattern('^\\s*' + tagEnd, "").test(after)
            ) {
                that.trim().record(); // Collapse!
                return false;
            }
        }
    }
    if ('Delete' === key && !s) {
        let {after, value} = that.$();
        if (!value) {
            // `|-->`
            if ('-->' === after.slice(0, 3)) {
                that.replace(/^-->/, "", 1).record();
                return false;
            }
            // `|?>`
            if ('?>' === after.slice(0, 2)) {
                that.replace(/^\?>/, "", 1).record();
                return false;
            }
            let tagPattern = toPattern('^(?:' + tagComment + '|' + tagData + '|' + tagEnd + '|' + tagPreamble + '|' + tagStart + '|' + tagVoid + ')', ""),
                tagMatch = tagPattern.exec(after);
            if (tagMatch) {
                that.replace(tagPattern, "", 1).record();
                return false;
            }
        }
    }
    return true;
}

export default {canKeyDown};
