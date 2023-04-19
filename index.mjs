import {W} from '@taufik-nurrohman/document';
import {esc, toPattern} from '@taufik-nurrohman/pattern';
import {fromHTML, fromValue} from '@taufik-nurrohman/from';
import {hasValue} from '@taufik-nurrohman/has';
import {isArray, isSet, isString} from '@taufik-nurrohman/is';
import {toCount, toObjectKeys} from '@taufik-nurrohman/to';

let tagComment = '<!--([\\s\\S](?!-->)*)-->',
    tagData = '<!((?:\'(?:\\\\.|[^\'])*\'|"(?:\\\\.|[^"])*"|[^>\'"])*)>',
    tagName = '[\\w:.-]+',
    tagStart = name => '<(' + name + ')(\\s(?:\'(?:\\\\.|[^\'])*\'|"(?:\\\\.|[^"])*"|[^/>\'"])*)?>',
    tagEnd = name => '</(' + name + ')>',
    tagVoid = name => '<(' + name + ')(\\s(?:\'(?:\\\\.|[^\'])*\'|"(?:\\\\.|[^"])*"|[^/>\'"])*)?/?>',
    tagPreamble = '<\\?((?:\'(?:\\\\.|[^\'])*\'|"(?:\\\\.|[^"])*"|[^>\'"])*)\\?>',
    tagTokens = '(?:' + tagComment + '|' + tagData + '|' + tagEnd(tagName) + '|' + tagPreamble + '|' + tagVoid(tagName) + '|' + tagStart(tagName) + ')';

const defaults = {
    source: {
        type: 'XML'
    }
};

export const that = {};

export function toAttributes(attributes) {
    if (!attributes) {
        return "";
    }
    // Sort object by key(s)
    attributes = toObjectKeys(attributes).sort().reduce((r, k) => (r[k] = attributes[k], r), {});
    let attribute, v, out = "";
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

that.insert = function (name, content = "", attributes = {}, tidy = false) {
    let t = this;
    if (false !== (tidy = toTidy(tidy))) {
        t.trim(tidy[0], "");
    }
    return t.insert('<' + name + toAttributes(attributes) + (false !== content ? '>' + content + '</' + name + '>' : ' />') + (false !== tidy ? tidy[1] : ""), -1, true);
};

that.toggle = function (name, content = "", attributes = {}, tidy = false) {
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

that.wrap = function (name, content = "", attributes = {}, tidy = false) {
    let t = this,
        {after, before, value} = t.$();
    if (!value && content) {
        t.insert(content);
    }
    if (false !== (tidy = toTidy(tidy))) {
        t.trim(tidy[0], tidy[1]);
    }
    return t.wrap('<' + name + toAttributes(attributes) + '>', '</' + name + '>');
};

export function canKeyDown(map, of) {
    let state = of.state,
        charAfter,
        charBefore,
        charIndent = state.source.tab || state.tab || '\t',
        {key, queue} = map,
        keyValue = map + "";
    // Do nothing
    if (queue.Alt || queue.Control) {
        return true;
    }
    if (['-', '>', '/', '?', ' '].includes(key)) {
        let {after, before, value, start} = of.$();
        if ('-' === key) {
            // `<!-|`
            if (!value && '<!-' === before.slice(-3)) {
                of.wrap('- ', ' --' + ('>' === after[0] ? "" : '>')).record();
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
                        of.trim("", false).insert(' /', -1).select(of.$().start + 1).record();
                        return false;
                    }
                    of.trim("", false).insert(' />', -1).record();
                    return false;
                }
                // `<div|></div>`
                if (after.startsWith('></' + tagStartMatch[1] + '>')) {
                    of.select(start + 1).record();
                // `<div|</div>`
                } else if (after.startsWith('</' + tagStartMatch[1] + '>')) {
                    of.insert('>', -1).record();
                // `<div|`
                } else {
                    of.wrap('>', '</' + tagStartMatch[1] + ('>' === after[0] ? "" : '>')).record();
                }
                return false;
            }
        }
        if ('?' === key) {
            // `<|`
            if (!value && '<' === before.slice(-1)) {
                of.wrap('?', '?' + ('>' === after[0] ? "" : '>')).record();
                return false;
            }
        }
        if (' ' === keyValue) {
            if (!value) {
                if (
                    // `<!--|-->`
                    '-->' === after.slice(0, 3) && '<!--' === before.slice(-4) ||
                    // `<?foo|?>`
                    '?>' === after.slice(0, 2) && '<?' === before.slice(0, 2) && /<\?\S*$/.test(before)
                ) {
                    of.wrap(' ', ' ').record();
                    return false;
                }
            }
        }
    }
    if ('ArrowLeft' === keyValue) {
        let {before, start, value} = of.$();
        if (!value) {
            let tagMatch = toPattern(tagTokens + '$', "").exec(before);
            // `<foo>|bar`
            if (tagMatch) {
                of.select(start - toCount(tagMatch[0]), start);
                return false;
            }
        }
    }
    if ('ArrowRight' === keyValue) {
        let {after, start, value} = of.$();
        if (!value) {
            let tagMatch = toPattern('^' + tagTokens, "").exec(after);
            // `foo|<bar>`
            if (tagMatch) {
                of.select(start, start + toCount(tagMatch[0]));
                return false;
            }
        }
    }
    if ('Enter' === keyValue) {
        let {after, before, value} = of.$(),
            lineBefore = before.split('\n').pop(),
            lineMatch = lineBefore.match(/^(\s+)/),
            lineMatchIndent = lineMatch && lineMatch[1] || "",
            tagStartMatch = before.match(toPattern(tagStart(tagName) + '$', ""));
        if (!value) {
            if (
                // `<!--|-->`
                /^[ \t]*-->/.test(after) && /<!--[ \t]*$/.test(before) ||
                // `<?foo|?>`
                /^[ \t]*\?>/.test(after) && /<\?\S*[ \t]*$/.test(before)
            ) {
                of.trim().wrap('\n' + lineMatchIndent, '\n' + lineMatchIndent).record();
                return false;
            }
            if (tagStartMatch) {
                if (after.startsWith('</' + tagStartMatch[1] + '>')) {
                    of.record().trim().wrap('\n' + lineMatchIndent + charIndent, '\n' + lineMatchIndent).record();
                } else {
                    of.record().wrap('\n' + lineMatchIndent + charIndent, '\n' + lineMatchIndent + '</' + tagStartMatch[1] + '>').record();
                }
                return false;
            }
        }
    }
    if ('Backspace' === keyValue) {
        let {after, before, value} = of.$();
        if (!value) {
            // `<!--|`
            if ('<!--' === before.slice(-4)) {
                of.replace(/<!--$/, "", -1);
                // `<!--|-->`
                if ('-->' === after.slice(0, 3)) {
                    of.replace(/^-->/, "", 1);
                }
                of.record();
                return false;
            }
            if (/^\s+-->/.test(after) && /<!--\s+$/.test(before)) {
                of.trim(' ' === before.slice(-1) ? "" : ' ', ' ' === after[0] ? "" : ' ').record();
                return false;
            }
            // `<?|`
            if (/<\?\S*$/.test(before)) {
                of.replace(/<\?\S*$/, "", -1);
                // `<?|?>`
                if ('?>' === after.slice(0, 2)) {
                    of.replace(/^\?>/, "", 1);
                }
                of.record();
                return false;
            }
            if (/^\s+\?>/.test(after) && /<\?\S*\s+$/.test(before)) {
                of.trim(' ' === before.slice(-1) ? "" : ' ', ' ' === after[0] ? "" : ' ').record();
                return false;
            }
            let tagPattern = toPattern(tagTokens + '$', ""),
                tagMatch = tagPattern.exec(before);
            if (tagMatch) {
                // `<div />|`
                if (' />' === before.slice(-3)) {
                    of.replace(/ \/>$/, '/>', -1).record();
                    return false;
                }
                // `<div/>|`
                if ('/>' === before.slice(-2)) {
                    of.replace(/\/>$/, '>', -1).record();
                    return false;
                }
                of.replace(tagPattern, "", -1);
                let name = tagMatch[0].slice(1).split(/\s+|>/)[0];
                if (tagMatch[0] && '/' !== tagMatch[0][1]) {
                    if (after.startsWith('</' + name + '>')) {
                        of.replace(toPattern('^</' + name + '>', ""), "", 1);
                    }
                }
                of.record();
                return false;
            }
            if (
                toPattern(tagStart(tagName) + '\\n(?:' + esc(charIndent) + ')?$', "").test(before) &&
                toPattern('^\\s*' + tagEnd(tagName), "").test(after)
            ) {
                of.trim().record(); // Collapse!
                return false;
            }
        }
    }
    if ('Delete' === keyValue) {
        let {after, value} = of.$();
        if (!value) {
            // `|-->`
            if ('-->' === after.slice(0, 3)) {
                of.replace(/^-->/, "", 1).record();
                return false;
            }
            // `|?>`
            if ('?>' === after.slice(0, 2)) {
                of.replace(/^\?>/, "", 1).record();
                return false;
            }
            let tagPattern = toPattern('^' + tagTokens, ""),
                tagMatch = tagPattern.exec(after);
            if (tagMatch) {
                of.replace(tagPattern, "", 1).record();
                return false;
            }
        }
    }
    return true;
}

export function canMouseDown(map, of) {
    let {key, queue} = map;
    if (!queue.Control) {
        W.setTimeout(() => {
            let {after, end, before, value} = of.$();
            if (!value) {
                let caret = '\ufeff',
                    tagTokensLocal = tagTokens.split('(' + tagName + ')').join('((?:' + tagName + '|' + caret + ')+)'),
                    tagTokensLocalPattern = toPattern(tagTokensLocal),
                    content = before + value + caret + after, m, v;
                while (m = tagTokensLocalPattern.exec(content)) {
                    if (hasValue(caret, m[0])) {
                        let parts = m[0].split(caret);
                        // `<asdf asdf="asdf"|/>` or `<asdf asdf="asdf" |/>`
                        if ('>' === parts[1] || '/>' === (parts[1] || "").trim()) {
                            of.select(v = m.index, v + toCount(m[0]) - 1);
                            break;
                        }
                        // `<as|df asdf="asdf">`
                        if ('<' !== parts[0] && '</' !== parts[0] && !/\s/.test(parts[0])) {
                            of.select(v = m.index + ('/' === parts[0][1] ? 2 : 1), end + toCount(parts[1].split(/[\s\/>]/).shift()));
                            break;
                        }
                        let mm;
                        // `<asdf asdf="as|df">` or `<asdf asdf='as|df'>`
                        if (mm = toPattern('=("[^"]*' + caret + '[^"]*"|\'[^\']*' + caret + '[^\']*\')').exec(m[0])) {
                            of.select(v = m.index + mm.index + 2, v + toCount(mm[1]) - 3);
                            break;
                        }
                        // `<asdf asdf=as|df>`
                        if (mm = toPattern('=([^"\'\\s\\/>]*' + caret + '[^"\'\\s\\/>]*)').exec(m[0])) {
                            of.select(v = m.index + mm.index + 1, v + toCount(mm[1]) - 1);
                            break;
                        }
                        // `<asdf as|df="asdf">`
                        if ('<' !== parts[0] && '</' !== parts[0]) {
                            if (mm = toPattern('([^="\'\\s]*' + caret + '[^="\'\\s]*)[=\\s\\/>]').exec(m[0])) {
                                of.select(v = m.index + mm.index, v + toCount(mm[1]) - 1);
                                break;
                            }
                        }
                        // Other caret position(s) will select the element
                        of.select(v = m.index, v + toCount(m[0]) - 1);
                        break;
                    }
                }
            }
        }, 1);
    }
    return true;
}

export const state = defaults;