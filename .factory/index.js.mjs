import {debounce} from '@taufik-nurrohman/tick';
import {esc, toPattern} from '@taufik-nurrohman/pattern';
import {fromHTML, fromValue} from '@taufik-nurrohman/from';
import {hasValue} from '@taufik-nurrohman/has';
import {isArray, isInteger, isSet, isString} from '@taufik-nurrohman/is';
import {onEvent, offEvent, offEventDefault} from '@taufik-nurrohman/event';
import {toCount, toObjectKeys} from '@taufik-nurrohman/to';

let tagComment = () => '<!--([\\s\\S](?!-->)*)-->',
    tagData = () => '<!((?:\'(?:\\\\.|[^\'])*\'|"(?:\\\\.|[^"])*"|[^>\'"])*)>',
    tagName = () => '[\\w:.-]+',
    tagStart = name => '<(' + name + ')(\\s(?:\'(?:\\\\.|[^\'])*\'|"(?:\\\\.|[^"])*"|[^/>\'"])*)?>',
    tagEnd = name => '</(' + name + ')>',
    tagVoid = name => '<(' + name + ')(\\s(?:\'(?:\\\\.|[^\'])*\'|"(?:\\\\.|[^"])*"|[^/>\'"])*)?/?>',
    tagPreamble = () => '<\\?((?:\'(?:\\\\.|[^\'])*\'|"(?:\\\\.|[^"])*"|[^>\'"])*)\\?>',
    tagTokens = () => '(?:' + tagComment() + '|' + tagData() + '|' + tagEnd(tagName()) + '|' + tagPreamble() + '|' + tagVoid(tagName()) + '|' + tagStart(tagName()) + ')';

const bounce = debounce((e, $) => {
    let {after, before, end, value} = $.$();
    if (value) {
        return;
    }
    let caret = '\ufeff',
        tagTokensOf = tagTokens().split('(' + tagName() + ')').join('((?:' + tagName() + '|' + caret + ')+)'),
        tagTokensPattern = toPattern(tagTokensOf),
        content = before + value + caret + after, m, v;
    while (m = tagTokensPattern.exec(content)) {
        if (hasValue(caret, m[0])) {
            offEventDefault(e);
            let parts = m[0].split(caret);
            // `<asdf asdf="asdf"|/>` or `<asdf asdf="asdf" |/>`
            if ('>' === parts[1] || '/>' === (parts[1] || "").trim()) {
                $.select(v = m.index, v + toCount(m[0]) - 1);
                break;
            }
            // `<as|df asdf="asdf">`
            if ('<' !== parts[0] && '</' !== parts[0] && !/\s/.test(parts[0])) {
                $.select(v = m.index + ('/' === parts[0][1] ? 2 : 1), end + toCount(parts[1].split(/[\s\/>]/).shift()));
                break;
            }
            let mm;
            // `<asdf asdf="as|df">` or `<asdf asdf='as|df'>`
            if (mm = toPattern('=("[^"]*' + caret + '[^"]*"|\'[^\']*' + caret + '[^\']*\')').exec(m[0])) {
                $.select(v = m.index + mm.index + 2, v + toCount(mm[1]) - 3);
                break;
            }
            // `<asdf asdf=as|df>`
            if (mm = toPattern('=([^"\'\\s\\/>]*' + caret + '[^"\'\\s\\/>]*)').exec(m[0])) {
                $.select(v = m.index + mm.index + 1, v + toCount(mm[1]) - 1);
                break;
            }
            // `<asdf as|df="asdf">`
            if ('<' !== parts[0] && '</' !== parts[0]) {
                if (mm = toPattern('([^="\'\\s]*' + caret + '[^="\'\\s]*)[=\\s\\/>]').exec(m[0])) {
                    $.select(v = m.index + mm.index, v + toCount(mm[1]) - 1);
                    break;
                }
            }
            // Other caret position(s) will select the element
            $.select(v = m.index, v + toCount(m[0]) - 1);
            break;
        }
    }
}, 1);

function onKeyDown(e) {
    let $ = this,
        key = $.k(false).pop(),
        keys = $.k();
    if (!$ || e.defaultPrevented) {
        return;
    }
    if ($.keys[keys]) {
        return;
    }
    // Do nothing
    if ('Alt' === keys || 'Control' === keys) {
        return;
    }
    let {after, before, end, start, value} = $.$();
    if (['-', '>', '/', '?', ' '].includes(key)) {
        if ('-' === key) {
            // `<!-|`
            if (!value && '<!-' === before.slice(-3)) {
                offEventDefault(e);
                return $.wrap('- ', ' --' + ('>' === after[0] ? "" : '>')).record();
            }
            return;
        }
        if ('>' === key || '/' === key) {
            let tagStartMatch = toPattern(tagStart(tagName()) + '$', "").exec(before + '>');
            if (!value && tagStartMatch) {
                offEventDefault(e);
                // `<div|`
                if ('/' === key) {
                    // `<div|>`
                    if ('>' === after[0]) {
                        return $.trim("", false).insert(' /', -1).select($.$().start + 1).record();
                    }
                    return $.trim("", false).insert(' />', -1).record();
                }
                // `<div|></div>`
                if (after.startsWith('></' + tagStartMatch[1] + '>')) {
                    $.select(start + 1).record();
                // `<div|</div>`
                } else if (after.startsWith('</' + tagStartMatch[1] + '>')) {
                    $.insert('>', -1).record();
                // `<div|`
                } else {
                    $.wrap('>', '</' + tagStartMatch[1] + ('>' === after[0] ? "" : '>')).record();
                }
            }
            return;
        }
        if ('?' === key) {
            // `<|`
            if (!value && '<' === before.slice(-1)) {
                offEventDefault(e);
                return $.wrap('?', '?' + ('>' === after[0] ? "" : '>')).record();
            }
            return;
        }
        if (' ' === key) {
            if (!value) {
                if (
                    // `<!--|-->`
                    '-->' === after.slice(0, 3) && '<!--' === before.slice(-4) ||
                    // `<?asdf|?>`
                    '?>' === after.slice(0, 2) && '<?' === before.slice(0, 2) && /<\?\S*$/.test(before)
                ) {
                    offEventDefault(e);
                    return $.wrap(' ', ' ').record();
                }
            }
            return;
        }
        return;
    }
    // Update current selection data
    let s = $.$();
    after = s.after;
    before = s.before;
    end = s.end;
    start = s.start;
    value = s.value;
    if ('ArrowLeft' === keys) {
        if (!value) {
            let tagMatch = toPattern(tagTokens() + '$', "").exec(before);
            // `<asdf>|asdf`
            if (tagMatch) {
                offEventDefault(e);
                return $.select(start - toCount(tagMatch[0]), start);
            }
        }
        return;
    }
    if ('ArrowRight' === keys) {
        if (!value) {
            let tagMatch = toPattern('^' + tagTokens(), "").exec(after);
            // `asdf|<asdf>`
            if (tagMatch) {
                offEventDefault(e);
                return $.select(start, start + toCount(tagMatch[0]));
            }
        }
        return;
    }
    let charIndent = $.state.source?.tab || $.state.tab || '\t',
        lineBefore = before.split('\n').pop(),
        lineMatch = lineBefore.match(/^(\s+)/),
        lineMatchIndent = lineMatch && lineMatch[1] || "";
    if (isInteger(charIndent)) {
        charIndent = ' '.repeat(charIndent);
    }
    if ('Enter' === keys) {
        let tagStartMatch = before.match(toPattern(tagStart(tagName()) + '$', ""));
        if (!value) {
            if (tagStartMatch) {
                offEventDefault(e);
                if (after.startsWith('</' + tagStartMatch[1] + '>')) {
                    return $.record().trim().wrap('\n' + lineMatchIndent + charIndent, '\n' + lineMatchIndent).record();
                }
                return $.record().wrap('\n' + lineMatchIndent + charIndent, '\n' + lineMatchIndent + '</' + tagStartMatch[1] + '>').record();
            }
            if (
                // `<!--|-->`
                /^[ \t]*-->/.test(after) && /<!--[ \t]*$/.test(before) ||
                // `<?asdf|?>`
                /^[ \t]*\?>/.test(after) && /<\?\S*[ \t]*$/.test(before)
            ) {
                offEventDefault(e);
                return $.trim().wrap('\n' + lineMatchIndent, '\n' + lineMatchIndent).record();
            }
            if (
                // `<!--\n|\n-->`
                /^\n-->/.test(after) && /<!--\n$/.test(before) ||
                // `<?asdf\n|\n?>`
                /^\n\?>/.test(after) && /<\?\S*\n$/.test(before)
            ) {
                offEventDefault(e);
                return $.trim().wrap('\n\n' + lineMatchIndent, '\n\n' + lineMatchIndent).record();
            }
        }
        return;
    }
    if ('Backspace' === keys) {
        if (!value) {
            // `<!--|`
            if ('<!--' === before.slice(-4)) {
                offEventDefault(e);
                $.replace(/<!--$/, "", -1);
                // `<!--|-->`
                if ('-->' === after.slice(0, 3)) {
                    $.replace(/^-->/, "", 1);
                }
                return $.record();
            }
            if (/^\s+-->/.test(after) && /<!--\s+$/.test(before)) {
                offEventDefault(e);
                return $.trim(' ' === before.slice(-1) ? "" : ' ', ' ' === after[0] ? "" : ' ').record();
            }
            // `<?|`
            if (/<\?\S*$/.test(before)) {
                offEventDefault(e);
                $.replace(/<\?\S*$/, "", -1);
                // `<?|?>`
                if ('?>' === after.slice(0, 2)) {
                    $.replace(/^\?>/, "", 1);
                }
                return $.record();
            }
            if (/^\s+\?>/.test(after) && /<\?\S*\s+$/.test(before)) {
                offEventDefault(e);
                return $.trim(' ' === before.slice(-1) ? "" : ' ', ' ' === after[0] ? "" : ' ').record();
            }
            let tagPattern = toPattern(tagTokens() + '$', ""),
                tagMatch = tagPattern.exec(before);
            if (tagMatch) {
                offEventDefault(e);
                // `<div />|`
                if (' />' === before.slice(-3)) {
                    return $.replace(/ \/>$/, '/>', -1).record();
                }
                // `<div/>|`
                if ('/>' === before.slice(-2)) {
                    return $.replace(/\/>$/, '>', -1).record();
                }
                $.replace(tagPattern, "", -1);
                let name = tagMatch[0].slice(1).split(/\s+|>/)[0];
                if (tagMatch[0] && '/' !== tagMatch[0][1]) {
                    if (after.startsWith('</' + name + '>')) {
                        $.replace(toPattern('^</' + name + '>', ""), "", 1);
                    }
                }
                return $.record();
            }
            if (
                toPattern(tagStart(tagName()) + '\\n(?:' + esc(charIndent) + ')?$', "").test(before) &&
                toPattern('^\\s*' + tagEnd(tagName()), "").test(after)
            ) {
                offEventDefault(e);
                return $.trim().record(); // Collapse!
            }
        }
        return;
    }
    if ('Delete' === keys) {
        if (!value) {
            // `|-->`
            if ('-->' === after.slice(0, 3)) {
                offEventDefault(e);
                return $.replace(/^-->/, "", 1).record();
            }
            // `|?>`
            if ('?>' === after.slice(0, 2)) {
                offEventDefault(e);
                return $.replace(/^\?>/, "", 1).record();
            }
            let tagPattern = toPattern('^' + tagTokens(), ""),
                tagMatch = tagPattern.exec(after);
            if (tagMatch) {
                offEventDefault(e);
                return $.replace(tagPattern, "", 1).record();
            }
        }
    }
}

function onMouseDown(e) {
    let $ = this,
        key = $.k(false).pop(),
        keys = $.k();
    if (!$ || e.defaultPrevented) {
        return;
    }
    if (keys.startsWith('Control-')) {
        return;
    }
    bounce(e, $);
}

function toAttributes(attributes) {
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

function attach() {
    let $ = this;
    $.insertXML = (name, content = "", attributes = {}, tidy = false) => {
        // `<asdf>|</asdf>`
        if (tidy) {
            let {after, before} = $.$(),
                tab = $.state.source?.tab || $.state.tab || '\t';
            if (isInteger(tab)) {
                tab = ' '.repeat(tab);
            }
            if (toPattern('^' + tagEnd(tagName()), "").test(after) && toPattern(tagStart(tagName()) + '$', "").test(before)) {
                let lineBefore = before.split('\n').pop(),
                    lineMatch = lineBefore.match(/^(\s+)/),
                    lineMatchIndent = lineMatch && lineMatch[1] || "";
                $.wrap('\n' + tab + lineMatchIndent, '\n' + lineMatchIndent);
            }
        }
        return $.insert('<' + name + toAttributes(attributes) + (false !== content ? '>' + content + '</' + name + '>' : ' />'), -1, true);
    };
    $.peelXML = (name, content = "", attributes = {}, tidy = false) => {
        // `<asdf> <asdf>|</asdf> </asdf>`
        if (tidy) {
            $.trim("", "");
        }
        return $.replace(toPattern(tagStart(name) + '$', ""), "", -1).replace(toPattern('^' + tagEnd(name)), "", 1);
    };
    $.toggleXML = (name, content = "", attributes = {}, tidy = false) => {
        let {after, before} = $.$(),
            tagStartOf = tagStart(name),
            tagEndOf = tagEnd(name),
            tagStartPattern = toPattern(tagStartOf + '$', ""),
            tagEndPattern = toPattern('^' + tagEndOf, ""),
            tagStartMatch = tagStartPattern.test(before),
            tagEndMatch = tagEndPattern.test(after);
        return $[(tagStartMatch && tagEndMatch ? 'peel' : 'wrap') + 'XML'](name, content, attributes, tidy);
    };
    $.wrapXML = function (name, content = "", attributes = {}, tidy = false) {
        let {after, before, value} = $.$();
        if (!value && content) {
            $.insert(content);
        }
        // `<asdf>|</asdf>`
        if (tidy) {
            let tab = $.state.source?.tab || $.state.tab || '\t';
            if (isInteger(tab)) {
                tab = ' '.repeat(tab);
            }
            if (toPattern('^' + tagEnd(tagName()), "").test(after) && toPattern(tagStart(tagName()) + '$', "").test(before)) {
                let lineBefore = before.split('\n').pop(),
                    lineMatch = lineBefore.match(/^(\s+)/),
                    lineMatchIndent = lineMatch && lineMatch[1] || "";
                $.wrap('\n' + tab + lineMatchIndent, '\n' + lineMatchIndent);
            }
        }
        return $.wrap('<' + name + toAttributes(attributes) + '>', '</' + name + '>');
    };
    if ('XML' === $.state.source?.type) {
        $.on('key.down', onKeyDown);
        $.on('mouse.down', onMouseDown);
    }
    return $;
}

function detach() {
    let $ = this;
    $.off('key.down', onKeyDown);
    $.off('mouse.down', onMouseDown);
    return $;
}

export default {attach, detach};