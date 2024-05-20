import {esc, toPattern} from '@taufik-nurrohman/pattern';
import {fromHTML, fromStates, fromValue} from '@taufik-nurrohman/from';
import {hasValue} from '@taufik-nurrohman/has';
import {isArray, isFunction, isInteger, isSet, isString} from '@taufik-nurrohman/is';
import {onEvent, offEvent, offEventDefault} from '@taufik-nurrohman/event';
import {toCount, toObjectKeys} from '@taufik-nurrohman/to';

const name = 'TextEditor.SourceXML';

let tagComment = () => '<!--([\\s\\S](?!-->)*)-->',
    tagData = () => '<!((?:\'(?:\\\\.|[^\'])*\'|"(?:\\\\.|[^"])*"|[^>\'"])*)>',
    tagEnd = name => '</(' + name + ')>',
    tagInstruction = () => '<\\?((?:\'(?:\\\\.|[^\'])*\'|"(?:\\\\.|[^"])*"|[^>\'"])*)\\?>',
    tagName = () => '[\\w:.-]+',
    tagStart = name => '<(' + name + ')(\\s(?:\'(?:\\\\.|[^\'])*\'|"(?:\\\\.|[^"])*"|[^/>\'"])*)?>',
    tagVoid = name => '<(' + name + ')(\\s(?:\'(?:\\\\.|[^\'])*\'|"(?:\\\\.|[^"])*"|[^/>\'"])*)?/?>',
    tagTokens = () => '(?:' + tagComment() + '|' + tagData() + '|' + tagEnd(tagName()) + '|' + tagInstruction() + '|' + tagVoid(tagName()) + '|' + tagStart(tagName()) + ')';

function onKeyDown(e) {
    let $ = this, m,
        key = $.k(false).pop(),
        keys = $.k();
    if (e.defaultPrevented || $.keys[keys]) {
        return;
    }
    // Do nothing
    if ('Alt' === keys || 'Control' === keys) {
        return;
    }
    let {after, before, end, start, value} = $.$(),
        charIndent = $.state.tab || '\t',
        elements = $.state.elements || {},
        lineMatch = /^\s+/.exec(before.split('\n').pop()),
        lineMatchIndent = lineMatch && lineMatch[0] || "";
    if (isInteger(charIndent)) {
        charIndent = ' '.repeat(charIndent);
    }
    if (value) {
        if ('Backspace' === keys) {
            if ('<![CDATA[' === before.slice(-9) && ']]>' === after.slice(0, 3) && value === elements['![CDATA[']) {
                offEventDefault(e);
                return $.insert("").record();
            }
            return;
        }
        if ('Delete' === keys) {
            if ('<![CDATA[' === before.slice(-9) && ']]>' === after.slice(0, 3) && value === elements['![CDATA[']) {
                offEventDefault(e);
                return $.insert("").record();
            }
            return;
        }
        if ('Enter' === keys) {
            if ('<!-- ' === before.slice(-5) && ' -->' === after.slice(0, 4) && value === elements['!--']) {
                offEventDefault(e);
                return $.trim('\n' + lineMatchIndent, '\n' + lineMatchIndent).insert("").record();
            }
            if ('<![CDATA[' === before.slice(-9) && ']]>' === after.slice(0, 3) && value === elements['![CDATA[']) {
                offEventDefault(e);
                return $.trim('\n' + lineMatchIndent, '\n' + lineMatchIndent).insert("").record();
            }
            m = toPattern(tagStart(tagName()) + '$', "").exec(before);
            if (m && after.startsWith('</' + m[1] + '>')) {
                if (isSet(elements[m[1]]) && value === elements[m[1]][1]) {
                    offEventDefault(e);
                    return $.trim('\n' + lineMatchIndent + charIndent, '\n' + lineMatchIndent).insert("").record();
                }
            }
        }
        return;
    }
    if ('-' === key) {
        // `<!-|`
        if ('<!-' === before.slice(-3)) {
            offEventDefault(e);
            return $.insert(elements['!--'] || "").wrap('- ', ' --' + ('>' === after[0] ? "" : '>')).record();
        }
        return;
    }
    if ('>' === key || '/' === key) {
        if (!(m = toPattern(tagStart(tagName()) + '$', "").exec(before + '>'))) {
            return;
        }
        offEventDefault(e);
        // `<div|`
        if ('/' === key) {
            // `<div|>`
            if ('>' === after[0]) {
                return $.trim("", false).insert(' /', -1).select($.$().start + 1).record();
            }
            return $.trim("", false).insert(' />', -1).record();
        }
        if (isSet(elements[m[1]])) {
            value = elements[m[1]][1];
            if (false === value) {
                if ('>' === after[0]) {
                    return $.trim("", false).insert(' /', -1).select($.$().start + 1).record();
                }
                return $.trim("", false).insert(' />', -1).record();
            }
            value && $.insert(value);
            return $.wrap('>', '</' + m[1] + ('>' === after[0] ? "" : '>')).record();
        }
        // // `<div|></div>`
        // if (after.startsWith('></' + m[1] + '>')) {
        //     return $.select(start + 1).record();
        // }
        // // `<div|</div>`
        // if (after.startsWith('</' + m[1] + '>')) {
        //     return $.insert('>', -1).record();
        // }
        // `<div|`
        return $.wrap('>', '</' + m[1] + ('>' === after[0] ? "" : '>')).record();
    }
    if ('?' === key) {
        // `<|`
        if ('<' === before.slice(-1)) {
            offEventDefault(e);
            return $.wrap('?', '?' + ('>' === after[0] ? "" : '>')).record();
        }
        return;
    }
    if ('[' === key) {
        if ('<![CDATA' === before.slice(-8) && ']>' === after.slice(0, 2)) {
            return $.insert(elements['![CDATA['] || "");
        }
        return;
    }
    if (' ' === key) {
        if (
            // `<!--|-->`
            '-->' === after.slice(0, 3) && '<!--' === before.slice(-4) ||
            // `<?asdf|?>`
            '?>' === after.slice(0, 2) && /<\?\S*$/.test(before)
        ) {
            offEventDefault(e);
            if ('?>' === after.slice(0, 2)) {
                $.insert(elements['?'] || "");
            }
            return $.wrap(' ', ' ').record();
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
    if (value) {
        return;
    }
    if ('ArrowLeft' === keys && (m = toPattern(tagTokens() + '$', "").exec(before))) {
        // `<asdf>|asdf`
        offEventDefault(e);
        return $.select(start - toCount(m[0]), start);
    }
    if ('ArrowRight' === keys && (m = toPattern('^' + tagTokens(), "").exec(after))) {
        // `asdf|<asdf>`
        offEventDefault(e);
        return $.select(start, start + toCount(m[0]));
    }
    lineMatch = /^\s+/.exec(before.split('\n').pop());
    lineMatchIndent = lineMatch && lineMatch[0] || "";
    if ('Backspace' === keys) {
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
        // `|-->`
        if ('-->' === after.slice(0, 3)) {
            offEventDefault(e);
            return $.replace(/^-->/, "", 1).record();
        }
        // `|]]>`
        if (']]>' === after.slice(0, 3)) {
            offEventDefault(e);
            return $.replace(/^\]\]>/, "", 1).record();
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
    if ('Enter' === keys) {
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
        if (m = toPattern(tagStart(tagName()) + '$', "").exec(before)) {
            offEventDefault(e);
            if (after.startsWith('</' + m[1] + '>')) {
                return $.record().trim('\n' + lineMatchIndent + charIndent, '\n' + lineMatchIndent).record();
            }
            return $.record().wrap('\n' + lineMatchIndent + charIndent, '\n' + lineMatchIndent + '</' + m[1] + '>').record();
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
    let $ = this,
        $$ = $.constructor.prototype,
        any = /^\s*([\s\S]*?)\s*$/,
        anyComment = /^<!--\s*([\s\S]*?)\s*-->$/,
        anyData = /^<!\[CDATA\[\s*([\s\S]*?)\s*\]\]>$/,
        anyInstruction = /^<\?\S*\s*([\s\S]*?)\s*\?>$/;
    $.state = fromStates({
        elements: {
            '!--': 'Comment goes here…',
            '![CDATA[': 'Data goes here…',
            '?': 'Instruction goes here…'
        }
    }, $.state);
    !isFunction($$.insertComment) && ($$.insertComment = function (value, mode, clear) {
        let $ = this;
        return $.insert('<!--' + (value || $.state.elements['!--'] || "") + '-->', isSet(mode) ? mode : -1, isSet(clear) ? clear : true);
    });
    !isFunction($$.insertData) && ($$.insertData = function (value, mode, clear) {
        let $ = this;
        return $.insert('<![CDATA[' + (value || $.state.elements['![CDATA['] || "") + ']]>', isSet(mode) ? mode : -1, isSet(clear) ? clear : true);
    });
    !isFunction($$.insertElement) && ($$.insertElement = function (value, mode, clear) {
        let $ = this,
            elements = $.state.elements;
        // `$.insertElement(['asdf'])`
        if (isArray(value)) {
            if (isSet(elements[value[0]])) {
                value[1] = value[1] ?? elements[value[0]][1];
                value[2] = fromStates({}, elements[value[0]][2] || {}, value[2] || {});
            }
            value = '<' + value[0] + toAttributes(value[2]) + (false === value[1] ? ' />' : '>' + (value[1] || "") + '</' + value[0] + '>');
        }
        return $.insert(value, isSet(mode) ? mode : -1, isSet(clear) ? clear : true);
    });
    !isFunction($$.insertInstruction) && ($$.insertInstruction = function (value, mode, clear, name) {
        let $ = this;
        return $.insert('<?' + (name || "") + (value || $.state.elements['?'] || "") + '?>', isSet(mode) ? mode : -1, isSet(clear) ? clear : true);
    });
    !isFunction($$.peelComment) && ($$.peelComment = function (wrap) {
        let $ = this;
        if (wrap) {
            return $.replace(anyComment, '$1');
        }
        return $.replace(/<!--\s*$/, "", -1).replace(/^\s*-->/, "", 1);
    });
    !isFunction($$.peelData) && ($$.peelData = function (wrap) {
        let $ = this;
        if (wrap) {
            return $.replace(anyData, '$1');
        }
        return $.replace(/<!\[CDATA\[\s*$/, "", -1).replace(/^\s*\]\]>/, "", 1);
    });
    !isFunction($$.peelElement) && ($$.peelElement = function (open, close, wrap) {
        let $ = this,
            elements = $.state.elements;
        // `$.peelElement(['asdf'], false)`
        if (isArray(open)) {
            if (isSet(elements[open[0]])) {
                open[1] = open[1] ?? elements[open[0]][1];
                open[2] = fromStates({}, elements[open[0]][2] || {}, open[2] || {});
            }
            wrap = close;
            if (wrap) {
                return $.replace(toPattern('^' + tagStart(open[0]) + '([\\s\\S]*?)' + tagEnd(open[0]) + '$', ""), '$3');
            }
            return $.replace(toPattern(tagStart(open[0]) + '$', ""), "", -1).replace(toPattern('^' + tagEnd(open[0])), "", 1);
        }
        return $.peel(open, close, wrap);
    });
    !isFunction($$.peelInstruction) && ($$.peelInstruction = function (wrap) {
        let $ = this;
        if (wrap) {
            return $.replace(anyInstruction, '$1');
        }
        return $.replace(/<\?\S*\s*$/, "", -1).replace(/^\s*\?>/, "", 1);
    });
    !isFunction($$.selectComment) && ($$.selectComment = function (wrap) {
        let $ = this,
            {after, before, end, start, value} = $.$();
        while (before && '<!--' !== value.slice(0, 4)) {
            value = before.slice(-1) + value;
            before = before.slice(0, -1);
            start -= 1;
        }
        while (after && '-->' !== value.slice(-3)) {
            value += after.slice(0, 1);
            after = after.slice(1);
            end += 1;
        }
        if (!wrap) {
            let content = value.slice(4, -3),
                spaceAfter = /\s+$/.exec(content),
                spaceBefore = /^\s+/.exec(content);
            if (spaceAfter) {
                end -= (3 + toCount(spaceAfter[0]));
            }
            if (spaceBefore) {
                start += (4 + toCount(spaceBefore[0]));
            }
        }
        return '<!--' === value.slice(0, 4) && '-->' === value.slice(-3) ? $.select(start, end) : $.select();
    });
    !isFunction($$.selectData) && ($$.selectData = function (wrap) {
        let $ = this,
            {after, before, end, start, value} = $.$();
        while (before && '<![CDATA[' !== value.slice(0, 9)) {
            value = before.slice(-1) + value;
            before = before.slice(0, -1);
            start -= 1;
        }
        while (after && ']]>' !== value.slice(-3)) {
            value += after.slice(0, 1);
            after = after.slice(1);
            end += 1;
        }
        if (!wrap) {
            let content = value.slice(9, -3),
                spaceAfter = /\s+$/.exec(content),
                spaceBefore = /^\s+/.exec(content);
            if (spaceAfter) {
                end -= (3 + toCount(spaceAfter[0]));
            }
            if (spaceBefore) {
                start += (9 + toCount(spaceBefore[0]));
            }
        }
        return '<![CDATA[' === value.slice(0, 9) && ']]>' === value.slice(-3) ? $.select(start, end) : $.select();
    });
    !isFunction($$.selectElement) && ($$.selectElement = function (wrap) {
        let $ = this,
            {after, before, end, start, value} = $.$();
        // TODO
        console.log('TODO');
        return $;
    });
    !isFunction($$.selectInstruction) && ($$.selectInstruction = function (wrap, name) {
        let $ = this,
            {after, before, end, start, value} = $.$();
        while (before && '<?' !== value.slice(0, 2)) {
            value = before.slice(-1) + value;
            before = before.slice(0, -1);
            start -= 1;
        }
        while (after && '?>' !== value.slice(-2)) {
            value += after.slice(0, 1);
            after = after.slice(1);
            end += 1;
        }
        if (!isSet(name)) {
            name = value.slice(2).split(/\s+/).shift();
        }
        if (!wrap) {
            let content = value.slice(2 + (name ? toCount(name) : 0), -2),
                spaceAfter = /\s+$/.exec(content),
                spaceBefore = /^\s+/.exec(content);
            if (spaceAfter) {
                end -= (2 + toCount(spaceAfter[0]));
            }
            if (spaceBefore) {
                start += (2 + (name ? toCount(name) : 0) + toCount(spaceBefore[0]));
            }
        }
        return '<?' === value.slice(0, 2) && '?>' === value.slice(-2) ? $.select(start, end) : $.select();
    });
    !isFunction($$.toggleComment) && ($$.toggleComment = function (wrap) {
        let $ = this,
            {after, before, value} = $.$();
        if (wrap) {
            return $[(anyComment.test(value) ? 'peel' : 'wrap') + 'Comment'](wrap);
        }
        return $[(/<!--\s*$/.test(before) && /^\s*-->/.test(after) ? 'peel' : 'wrap') + 'Comment'](wrap);
    });
    !isFunction($$.toggleData) && ($$.toggleData = function (wrap) {
        let $ = this,
            {after, before, value} = $.$();
        if (wrap) {
            return $[(anyData.test(value) ? 'peel' : 'wrap') + 'Data'](wrap);
        }
        return $[(/<!\[CDATA\[\s*$/.test(before) && /^\s*\]\]>/.test(after) ? 'peel' : 'wrap') + 'Data'](wrap);
    });
    !isFunction($$.toggleElement) && ($$.toggleElement = function (open, close, wrap) {
        let $ = this,
            elements = $.state.elements;
        // `$.toggleElement(['asdf'], false)`
        if (isArray(open)) {
            if (isSet(elements[open[0]])) {
                open[1] = open[1] ?? elements[open[0]][1];
                open[2] = fromStates({}, elements[open[0]][2] || {}, open[2] || {});
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
    });
    !isFunction($$.toggleInstruction) && ($$.toggleInstruction = function (wrap, name) {
        let $ = this;
        // TODO
        console.log('TODO');
        return $;
    });
    !isFunction($$.wrapComment) && ($$.wrapComment = function (wrap) {
        let $ = this,
            {value} = $.$(),
            placeholder = $.state.elements['!--'] || "";
        if (!value && placeholder) {
            $.insert(placeholder);
        }
        if (wrap) {
            return $.replace(any, '<!--$1-->');
        }
        return $.trim(false, false).replace(/$/, '<!--', -1).replace(/^/, '-->', 1);
    });
    !isFunction($$.wrapData) && ($$.wrapData = function (wrap) {
        let $ = this,
            {value} = $.$(),
            placeholder = $.state.elements['![CDATA['] || "";
        if (!value && placeholder) {
            $.insert(placeholder);
        }
        if (wrap) {
            return $.replace(any, '<![CDATA[$1]]>');
        }
        return $.trim(false, false).replace(/$/, '<![CDATA[', -1).replace(/^/, ']]>', 1);
    });
    !isFunction($$.wrapElement) && ($$.wrapElement = function (open, close, wrap) {
        let $ = this,
            elements = $.state.elements;
        // `$.wrapElement(['asdf'], false)`
        if (isArray(open)) {
            if (isSet(elements[open[0]])) {
                open[1] = open[1] ?? elements[open[0]][1];
                open[2] = fromStates({}, elements[open[0]][2] || {}, open[2] || {});
            }
            wrap = close;
            let {value} = $.$();
            if (wrap) {
                return $.replace(any, '<' + open[0] + toAttributes(open[2]) + '>' + (value || open[1] || "").trim() + '</' + open[0] + '>');
            }
            return $.trim(false, false).replace(/$/, '<' + open[0] + toAttributes(open[2]) + '>', -1).replace(/^/, '</' + open[0] + '>', 1).insert(value || open[1] || "");
        }
        return $.wrap(open, close, wrap);
    });
    !isFunction($$.wrapInstruction) && ($$.wrapInstruction = function (wrap, name) {
        let $ = this;
        // TODO
        console.log('TODO');
        return $;
    });
    return $.on('key.down', onKeyDown);
}

function detach() {
    return this.off('key.down', onKeyDown);
}

export default {attach, detach, name};