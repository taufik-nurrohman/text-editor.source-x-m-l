import {esc, toPattern} from '@taufik-nurrohman/pattern';
import {fromHTML, fromStates, fromValue} from '@taufik-nurrohman/from';
import {hasValue} from '@taufik-nurrohman/has';
import {isArray, isInteger, isSet, isString} from '@taufik-nurrohman/is';
import {onEvent, offEvent, offEventDefault} from '@taufik-nurrohman/event';
import {toCount, toObjectKeys} from '@taufik-nurrohman/to';

let tagComment = () => '<!--([\\s\\S](?!-->)*)-->',
    tagData = () => '<!((?:\'(?:\\\\.|[^\'])*\'|"(?:\\\\.|[^"])*"|[^>\'"])*)>',
    tagDeclaration = () => '<\\?((?:\'(?:\\\\.|[^\'])*\'|"(?:\\\\.|[^"])*"|[^>\'"])*)\\?>',
    tagEnd = name => '</(' + name + ')>',
    tagName = () => '[\\w:.-]+',
    tagStart = name => '<(' + name + ')(\\s(?:\'(?:\\\\.|[^\'])*\'|"(?:\\\\.|[^"])*"|[^/>\'"])*)?>',
    tagVoid = name => '<(' + name + ')(\\s(?:\'(?:\\\\.|[^\'])*\'|"(?:\\\\.|[^"])*"|[^/>\'"])*)?/?>',
    tagTokens = () => '(?:' + tagComment() + '|' + tagData() + '|' + tagEnd(tagName()) + '|' + tagDeclaration() + '|' + tagVoid(tagName()) + '|' + tagStart(tagName()) + ')';

function onKeyDown(e) {
    let $ = this,
        key = $.k(false).pop(),
        keys = $.k();
    if (e.defaultPrevented || $.keys[keys]) {
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
                    '?>' === after.slice(0, 2) && /<\?\S*$/.test(before)
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
        if (value) {
            return;
        }
        if (
            // `<!--|-->`
            /^[ \t]*-->/.test(after) && /<!--[ \t]*$/.test(before) ||
            // `<?asdf|?>`
            /^[ \t]*\?>/.test(after) && /<\?\S*[ \t]*$/.test(before) ||
            // `<![CDATA[|]]>`
            /^[ \t]*\]\]>/.test(after) && /<!\[CDATA\[[ \t]*$/.test(before)
        ) {
            offEventDefault(e);
            return $.trim('\n' + lineMatchIndent, '\n' + lineMatchIndent).record();
        }
        if (
            // `<!--\n|\n-->`
            /^(\n[ \t]*)-->/.test(after) && /<!--(\n[ \t]*)$/.test(before) ||
            // `<?asdf\n|\n?>`
            /^(\n[ \t]*)\?>/.test(after) && /<\?\S*(\n[ \t]*)$/.test(before) ||
            // `<![CDATA[\n|\n]]>`
            /^(\n[ \t]*)\]\]>/.test(after) && /<!\[CDATA\[(\n[ \t]*)$/.test(before)
        ) {
            offEventDefault(e);
            return $.trim('\n\n' + lineMatchIndent, '\n\n' + lineMatchIndent).record();
        }
        let tagStartMatch = before.match(toPattern(tagStart(tagName()) + '$', ""));
        if (tagStartMatch) {
            offEventDefault(e);
            if (after.startsWith('</' + tagStartMatch[1] + '>')) {
                return $.record().trim('\n' + lineMatchIndent + charIndent, '\n' + lineMatchIndent).record();
            }
            return $.record().wrap('\n' + lineMatchIndent + charIndent, '\n' + lineMatchIndent + '</' + tagStartMatch[1] + '>').record();
        }
    }
    if ('Backspace' === keys) {
        if (value) {
            return;
        }
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
        if (/^(\n[ \t]*){2,}-->/.test(after) && /<!--(\n[ \t]*){2,}$/.test(before)) {
            offEventDefault(e);
            return $.trim('\n' + lineMatchIndent, '\n' + lineMatchIndent).record();
        }
        if (/^\s+-->/.test(after) && /<!--\s+$/.test(before)) {
            offEventDefault(e);
            let a = after[0],
                b = before.slice(-1),
                c = ' ' === a && ' ' === b ? "" : ' ';
            return $.trim(c, c).record();
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
        if (/^(\n[ \t]*){2,}\?>/.test(after) && /<\?\S*(\n[ \t]*){2,}$/.test(before)) {
            offEventDefault(e);
            return $.trim('\n' + lineMatchIndent, '\n' + lineMatchIndent).record();
        }
        if (/^\s+\?>/.test(after) && /<\?\S*\s+$/.test(before)) {
            offEventDefault(e);
            let a = after[0],
                b = before.slice(-1),
                c = ' ' === a && ' ' === b ? "" : ' ';
            return $.trim(c, c).record();
        }
        // `<![CDATA[|`
        if ('<![CDATA[' === before.slice(-9)) {
            offEventDefault(e);
            $.replace(/<!\[CDATA\[$/, "", -1);
            // `<![CDATA[|]]>`
            if (']]>' === after.slice(0, 3)) {
                $.replace(/^\]\]>/, "", 1);
            }
            return $.record();
        }
        if (/^(\n[ \t]*){2,}\]\]>/.test(after) && /<!\[CDATA\[(\n[ \t]*){2,}$/.test(before)) {
            offEventDefault(e);
            return $.trim('\n' + lineMatchIndent, '\n' + lineMatchIndent).record();
        }
        if (/^\s+\]\]>/.test(after) && /<!\[CDATA\[\s+$/.test(before)) {
            offEventDefault(e);
            let a = after[0],
                b = before.slice(-1),
                c = ' ' === a && ' ' === b ? "" : ' ';
            return $.trim(c, c).record();
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
            toPattern('(^|\\n)([ \\t]*)' + tagStart(tagName()) + '\\n\\2$', "").test(before) &&
            toPattern('^\\s*' + tagEnd(tagName()), "").test(after)
        ) {
            offEventDefault(e);
            return $.trim().record(); // Collapse!
        }
    }
    if ('Delete' === keys) {
        if (value) {
            return;
        }
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
    let $ = this, state,
        any = /^\s*([\s\S]*?)\s*$/,
        anyComment = /^<!--\s*([\s\S]*?)\s*-->$/,
        anyData = /^<!\[CDATA\[\s*([\s\S]*?)\s*\]\]>$/,
        anyDeclaration = /^<\?\s*([\s\S]*?)\s*\?>$/;
    $.state = state = fromStates({
        elements: {}
    }, $.state);
    $.insertComment = (value, mode, clear) => {
        return $.insert('<!-- ' + value + ' -->', isSet(mode) ? mode : -1, isSet(clear) ? clear : true);
    };
    $.insertData = (value, mode, clear) => {
        return $.insert('<![CDATA[' + value + ']]>', isSet(mode) ? mode : -1, isSet(clear) ? clear : true);
    };
    $.insertElement = (value, mode, clear) => {
        // `$.insertElement(['asdf'])`
        if (isArray(value)) {
            if (isSet(state.elements[value[0]])) {
                value[0] = value[0] ?? state.elements[value[0]][0];
                value[1] = value[1] ?? state.elements[value[0]][1];
                value[2] = fromStates({}, state.elements[value[0]][2] || {}, value[2] || {});
            }
            value = '<' + value[0] + toAttributes(value[2]) + (false === value[1] ? ' />' : '>' + (value[1] || "") + '</' + value[0] + '>');
        }
        return $.insert(value, isSet(mode) ? mode : -1, isSet(clear) ? clear : true);
    };
    $.peelComment = wrap => {
        if (wrap) {
            return $.replace(anyComment, '$1');
        }
        return $.replace(/<!--\s*$/, "", -1).replace(/^\s*-->/, "", 1);
    };
    $.peelData = wrap => {
        if (wrap) {
            return $.replace(anyData, '$1');
        }
        return $.replace(/<!\[CDATA\[\s*$/, "", -1).replace(/^\s*\]\]>/, "", 1);
    };
    $.peelElement = (open, close, wrap) => {
        // `$.peelElement(['asdf'], false)`
        if (isArray(open)) {
            if (isSet(state.elements[open[0]])) {
                open[0] = open[0] ?? state.elements[open[0]][0];
                open[1] = open[1] ?? state.elements[open[0]][1];
                open[2] = fromStates({}, state.elements[open[0]][2] || {}, open[2] || {});
            }
            wrap = close;
            if (wrap) {
                return $.replace(toPattern('^' + tagStart(open[0]) + '([\\s\\S]*?)' + tagEnd(open[0]) + '$', ""), '$3');
            }
            return $.replace(toPattern(tagStart(open[0]) + '$', ""), "", -1).replace(toPattern('^' + tagEnd(open[0])), "", 1);
        }
        return $.peel(open, close, wrap);
    };
    $.toggleComment = wrap => {
        let {after, before, value} = $.$();
        if (wrap) {
            return $[(anyComment.test(value) ? 'peel' : 'wrap') + 'Comment'](wrap);
        }
        return $[(/<!--\s*$/.test(before) && /^\s*-->/.test(after) ? 'peel' : 'wrap') + 'Comment'](wrap);
    };
    $.toggleData = wrap => {
        let {after, before, value} = $.$();
        if (wrap) {
            return $[(anyData.test(value) ? 'peel' : 'wrap') + 'Data'](wrap);
        }
        return $[(/<!\[CDATA\[\s*$/.test(before) && /^\s*\]\]>/.test(after) ? 'peel' : 'wrap') + 'Data'](wrap);
    };
    $.toggleElement = (open, close, wrap) => {
        // `$.toggleElement(['asdf'], false)`
        if (isArray(open)) {
            if (isSet(state.elements[open[0]])) {
                open[0] = open[0] ?? state.elements[open[0]][0];
                open[1] = open[1] ?? state.elements[open[0]][1];
                open[2] = fromStates({}, state.elements[open[0]][2] || {}, open[2] || {});
            }
            wrap = close;
            let {after, before, value} = $.$(),
                tagStartOf = tagStart(open[0]),
                tagEndOf = tagEnd(open[0]);
            if (wrap) {
                return $[(toPattern('^' + tagStartOf + '[\\s\\S]*?' + tagEndOf + '$', "").test(value) ? 'peel' : 'wrap') + 'Element'](open, close, wrap);
            }
            return $[(toPattern(tagStartOf + '$', "").test(before) && toPattern('^' + tagEndOf, "").test(after) ? 'peel' : 'wrap') + 'Element'](open, close, wrap);
        }
        return $.toggle(open, close, wrap);
    };
    $.wrapComment = wrap => {
        if (wrap) {
            return $.replace(any, '<!-- $1 -->');
        }
        return $.trim(false, false).replace(/$/, '<!-- ', -1).replace(/^/, ' -->', 1);
    };
    $.wrapData = wrap => {
        if (wrap) {
            return $.replace(any, '<![CDATA[$1]]>');
        }
        return $.trim(false, false).replace(/$/, '<![CDATA[', -1).replace(/^/, ']]>', 1);
    };
    $.wrapElement = (open, close, wrap) => {
        // `$.wrapElement(['asdf'], false)`
        if (isArray(open)) {
            if (isSet(state.elements[open[0]])) {
                open[0] = open[0] ?? state.elements[open[0]][0];
                open[1] = open[1] ?? state.elements[open[0]][1];
                open[2] = fromStates({}, state.elements[open[0]][2] || {}, open[2] || {});
            }
            wrap = close;
            let {value} = $.$();
            if (wrap) {
                return $.replace(any, '<' + open[0] + toAttributes(open[2]) + '>' + (value || open[1] || "").trim() + '</' + open[0] + '>');
            }
            return $.trim(false, false).replace(/$/, '<' + open[0] + toAttributes(open[2]) + '>', -1).replace(/^/, '</' + open[0] + '>', 1).insert(value || open[1] || "");
        }
        return $.wrap(open, close, wrap);
    };
    if ('XML' === $.state.source?.type) {
        $.on('key.down', onKeyDown);
    }
    return $;
}

function detach() {
    return this.off('key.down', onKeyDown);
}

export default {attach, detach};