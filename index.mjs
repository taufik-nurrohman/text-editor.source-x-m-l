import {esc, toPattern} from '@taufik-nurrohman/pattern';
import {fromHTML, fromValue} from '@taufik-nurrohman/from';
import {hasValue} from '@taufik-nurrohman/has';
import {isArray, isSet, isString} from '@taufik-nurrohman/is';
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

function onMouseDown(e) {

}

function onKeyDown(e) {
    let self = this,
        editor = self.TextEditor,
        keys = editor.k();
    if (!editor || e.defaultPrevented) {
        return;
    }
    if (editor.keys[keys]) {
        return;
    }
    // Do nothing
    if ('Alt' === keys || 'Control' === keys) {
        return;
    }
    let key = keys.split('-').pop(),
        {after, before, end, start, value} = editor.$();
    if ("" === key) {
        key = '-';
    }
    if (['-', '>', '/', '?', ' '].includes(key)) {
        if ('-' === key) {
            // `<!-|`
            if (!value && '<!-' === before.slice(-3)) {
                offEventDefault(e);
                return editor.wrap('- ', ' --' + ('>' === after[0] ? "" : '>')).record();
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
                        return editor.trim("", false).insert(' /', -1).select(editor.$().start + 1).record();
                    }
                    return editor.trim("", false).insert(' />', -1).record();
                }
                // `<div|></div>`
                if (after.startsWith('></' + tagStartMatch[1] + '>')) {
                    editor.select(start + 1).record();
                // `<div|</div>`
                } else if (after.startsWith('</' + tagStartMatch[1] + '>')) {
                    editor.insert('>', -1).record();
                // `<div|`
                } else {
                    editor.wrap('>', '</' + tagStartMatch[1] + ('>' === after[0] ? "" : '>')).record();
                }
            }
            return;
        }
        if ('?' === key) {
            // `<|`
            if (!value && '<' === before.slice(-1)) {
                offEventDefault(e);
                return editor.wrap('?', '?' + ('>' === after[0] ? "" : '>')).record();
            }
            return;
        }
        if (' ' === key) {
            if (!value) {
                if (
                    // `<!--|-->`
                    '-->' === after.slice(0, 3) && '<!--' === before.slice(-4) ||
                    // `<?foo|?>`
                    '?>' === after.slice(0, 2) && '<?' === before.slice(0, 2) && /<\?\S*$/.test(before)
                ) {
                    offEventDefault(e);
                    return editor.wrap(' ', ' ').record();
                }
            }
            return;
        }
        return;
    }
    // Update current selection data
    let s = editor.$();
    after = s.after;
    before = s.before;
    end = s.end;
    start = s.start;
    value = s.value;
    if ('ArrowLeft' === keys) {
        if (!value) {
            let tagMatch = toPattern(tagTokens() + '$', "").exec(before);
            // `<foo>|bar`
            if (tagMatch) {
                offEventDefault(e);
                return editor.select(start - toCount(tagMatch[0]), start);
            }
        }
        return;
    }
    if ('ArrowRight' === keys) {
        if (!value) {
            let tagMatch = toPattern('^' + tagTokens(), "").exec(after);
            // `foo|<bar>`
            if (tagMatch) {
                offEventDefault(e);
                return editor.select(start, start + toCount(tagMatch[0]));
            }
        }
        return;
    }
    let charIndent = editor.state.source?.tab || editor.state.tab || '\t',
        lineBefore = before.split('\n').pop(),
        lineMatch = lineBefore.match(/^(\s+)/),
        lineMatchIndent = lineMatch && lineMatch[1] || "";
    if ('Enter' === keys) {
        let tagStartMatch = before.match(toPattern(tagStart(tagName()) + '$', ""));
        if (!value) {
            if (tagStartMatch) {
                offEventDefault(e);
                if (after.startsWith('</' + tagStartMatch[1] + '>')) {
                    return editor.record().trim().wrap('\n' + lineMatchIndent + charIndent, '\n' + lineMatchIndent).record();
                }
                return editor.record().wrap('\n' + lineMatchIndent + charIndent, '\n' + lineMatchIndent + '</' + tagStartMatch[1] + '>').record();
            }
            if (
                // `<!--|-->`
                /^[ \t]*-->/.test(after) && /<!--[ \t]*$/.test(before) ||
                // `<?foo|?>`
                /^[ \t]*\?>/.test(after) && /<\?\S*[ \t]*$/.test(before)
            ) {
                offEventDefault(e);
                return editor.trim().wrap('\n' + lineMatchIndent, '\n' + lineMatchIndent).record();
            }
        }
        return;
    }
    if ('Backspace' === keys) {
        if (!value) {
            // `<!--|`
            if ('<!--' === before.slice(-4)) {
                offEventDefault(e);
                editor.replace(/<!--$/, "", -1);
                // `<!--|-->`
                if ('-->' === after.slice(0, 3)) {
                    editor.replace(/^-->/, "", 1);
                }
                return editor.record();
            }
            if (/^\s+-->/.test(after) && /<!--\s+$/.test(before)) {
                offEventDefault(e);
                return editor.trim(' ' === before.slice(-1) ? "" : ' ', ' ' === after[0] ? "" : ' ').record();
            }
            // `<?|`
            if (/<\?\S*$/.test(before)) {
                offEventDefault(e);
                editor.replace(/<\?\S*$/, "", -1);
                // `<?|?>`
                if ('?>' === after.slice(0, 2)) {
                    editor.replace(/^\?>/, "", 1);
                }
                return editor.record();
            }
            if (/^\s+\?>/.test(after) && /<\?\S*\s+$/.test(before)) {
                offEventDefault(e);
                return editor.trim(' ' === before.slice(-1) ? "" : ' ', ' ' === after[0] ? "" : ' ').record();
            }
            let tagPattern = toPattern(tagTokens() + '$', ""),
                tagMatch = tagPattern.exec(before);
            if (tagMatch) {
                offEventDefault(e);
                // `<div />|`
                if (' />' === before.slice(-3)) {
                    return editor.replace(/ \/>$/, '/>', -1).record();
                }
                // `<div/>|`
                if ('/>' === before.slice(-2)) {
                    return editor.replace(/\/>$/, '>', -1).record();
                }
                editor.replace(tagPattern, "", -1);
                let name = tagMatch[0].slice(1).split(/\s+|>/)[0];
                if (tagMatch[0] && '/' !== tagMatch[0][1]) {
                    if (after.startsWith('</' + name + '>')) {
                        editor.replace(toPattern('^</' + name + '>', ""), "", 1);
                    }
                }
                return editor.record();
            }
            if (
                toPattern(tagStart(tagName()) + '\\n(?:' + esc(charIndent) + ')?$', "").test(before) &&
                toPattern('^\\s*' + tagEnd(tagName()), "").test(after)
            ) {
                offEventDefault(e);
                return editor.trim().record(); // Collapse!
            }
        }
        return;
    }
    if ('Delete' === keys) {
        if (!value) {
            // `|-->`
            if ('-->' === after.slice(0, 3)) {
                offEventDefault(e);
                return editor.replace(/^-->/, "", 1).record();
            }
            // `|?>`
            if ('?>' === after.slice(0, 2)) {
                offEventDefault(e);
                return editor.replace(/^\?>/, "", 1).record();
            }
            let tagPattern = toPattern('^' + tagTokens(), ""),
                tagMatch = tagPattern.exec(after);
            if (tagMatch) {
                offEventDefault(e);
                return editor.replace(tagPattern, "", 1).record();
            }
        }
    }
}

function onKeyUp(e) {

}

function onTouchStart(e) {
    return onMouseDown.call(this, e);
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

function attach(self) {
    let $ = this;
    $.insertXML = (name, content = "", attributes = {}, tidy = false) => {
        // `<asdf>|</asdf>`
        if (tidy) {
            let {after, before} = $.$(),
                tab = $.state.source?.tab || $.state.tab || '\t';
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
        onEvent('keydown', self, onKeyDown);
        onEvent('keyup', self, onKeyUp);
        onEvent('mousedown', self, onMouseDown);
        onEvent('touchstart', self, onTouchStart);
    }
    return $;
}

function detach(self) {
    offEvent('keydown', self, onKeyDown);
    offEvent('keyup', self, onKeyUp);
    offEvent('mousedown', self, onMouseDown);
    offEvent('touchstart', self, onTouchStart);
    return $;
}

export default {attach, detach};