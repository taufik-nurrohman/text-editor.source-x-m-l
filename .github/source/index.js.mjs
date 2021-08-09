import {fromHTML, fromValue} from '@taufik-nurrohman/from';
import {isSet, isString} from '@taufik-nurrohman/is';
import {esc, toPattern} from '@taufik-nurrohman/pattern';
import {toCount} from '@taufik-nurrohman/to';

let tagComment = '<!--([\\s\\S](?!-->)*)-->',
    tagData = '<!((?:\'(?:\\\\.|[^\'])*\'|"(?:\\\\.|[^"])*"|[^>\'"])*)>',
    tagName = '[\\w:.-]+',
    tagStart = name => '<(' + name + ')(\\s(?:\'(?:\\\\.|[^\'])*\'|"(?:\\\\.|[^"])*"|[^/>\'"])*)?>',
    tagEnd = name => '</(' + name + ')>',
    tagVoid = name => '<(' + name + ')(\\s(?:\'(?:\\\\.|[^\'])*\'|"(?:\\\\.|[^"])*"|[^/>\'"])*)?/?>',
    tagPreamble = '<\\?((?:\'(?:\\\\.|[^\'])*\'|"(?:\\\\.|[^"])*"|[^>\'"])*)\\?>',
    tagTokens = '(?:' + tagComment + '|' + tagData + '|' + tagEnd(tagName) + '|' + tagPreamble + '|' + tagStart(tagName) + '|' + tagVoid(tagName) + ')';

let defaults = {
    source: {
        type: 'XML'
    },
    sourceXML: {}
};

export const that = {};

function toAttributes(attributes) {
    if (!attributes) {
        return "";
    }
    let attribute, out = "";
    for (attribute in attributes) {
        out += ' ' + attribute + '="' + fromHTML(fromValue(attributes[attribute])) + '"';
    }
    return out;
}

function toTidy(tidy) {
    if (false !== tidy) {
        if (isString(tidy)) {
            tidy = [tidy, tidy];
        } else {
            tidy = ["", ""];
        }
        if (!isSet(tidy[1])) {
            tidy[1] = tidy[0];
        }
    }
    return tidy; // Return `[…]` or `false`
}

that.toggle = function(name, content = "", attributes = {}, tidy = false) {
    let t = this,
        {after, before, value} = t.$(),
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

export function canKeyDown(key, {a, c, s}, that) {
    let state = that.state,
        charAfter,
        charBefore,
        charIndent = state.sourceXML.tab || state.tab || '\t';
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
            if (!value) {
                // `<!--|-->`
                if ('<!--' === before.slice(-4) && '-->' === after.slice(0, 3)) {
                    that.wrap(' ', ' ').record();
                    return false;
                }
                if (/<\?\S*$/.test(before) && '?>' === after.slice(0, 2)) {
                    that.wrap(' ', ' ').record();
                    return false;
                }
            }
        }
    }
    if ('ArrowLeft' === key && !s) {
        let {before, start, value} = that.$();
        if (!value) {
            let tagMatch = toPattern(tagTokens + '$', "").exec(before);
            // `<foo>|bar`
            if (tagMatch) {
                that.select(start - toCount(tagMatch[0]), start);
                return false;
            }
        }
    }
    if ('ArrowRight' === key && !s) {
        let {after, start, value} = that.$();
        if (!value) {
            let tagMatch = toPattern('^' + tagTokens, "").exec(after);
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
            tagStartMatch = before.match(toPattern(tagStart(tagName) + '$', ""));
        if (!value) {
            // `<!--|-->`
            if (/^[ \t]*-->/.test(after) && /<!--[ \t]*$/.test(before)) {
                that.trim().wrap('\n\n' + lineMatchIndent, '\n\n' + lineMatchIndent).record();
                return false;
            }
            // `<?xml|?>`
            if (/^[ \t]*\?>/.test(after) && /<\?\S*[ \t]*$/.test(before)) {
                that.trim().wrap('\n\n' + lineMatchIndent, '\n\n' + lineMatchIndent).record();
                return false;
            }
            if (tagStartMatch) {
                if (toPattern('^</' + tagStartMatch[1] + '>', "").test(after)) {
                    that.record().trim().wrap('\n' + lineMatchIndent + charIndent, '\n' + lineMatchIndent).record();
                } else {
                    that.record().wrap('\n' + lineMatchIndent + charIndent, '\n' + lineMatchIndent + '</' + tagStartMatch[1] + '>').record();
                }
                return false;
            }
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
            if (/<\?\S*$/.test(before)) {
                that.replace(/<\?\S*$/, "", -1);
                // `<?|?>`
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
                }
                // `<div/>|`
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
            if (
                toPattern(tagStart(tagName) + '\\n(?:' + esc(charIndent) + ')?$', "").test(before) &&
                toPattern('^\\s*' + tagEnd(tagName), "").test(after)
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

export function canMouseDown(that) {
    setTimeout(() => {
        let {after, before, value} = that.$();
        if (!value) {
            let caret = '\ufeff',
                tagTokensLocal = tagTokens.split('(' + tagName + ')').join('((?:[\\w:.-]|' + caret + ')+)'),
                tagTokensLocalPattern = toPattern(tagTokensLocal),
                content = before + value + caret + after, m, v;
            while (m = tagTokensLocalPattern.exec(content)) {
                if (-1 !== m[0].indexOf(caret)) {
                    that.select(v = m.index, v + toCount(m[0]) - 1);
                    break;
                }
            }
        }
    }, 1);
    return true;
}

export let state = defaults;
