import { graphemeClusters } from './graphemes.js';
const SPECIAL_CHAR_REG = /[[\]\\^$.|?*+(){}/]/g;
function isHighSurrogate(code) {
    return code >= 0xD800 && code <= 0xDBFF;
}
function isLowSurrogate(code) {
    return code >= 0xDC00 && code <= 0xDFFF;
}
function splitsSurrogatePair(text, index) {
    return isHighSurrogate(text.charCodeAt(index - 1)) && isLowSurrogate(text.charCodeAt(index));
}
function execAll(regexp, text) {
    const matches = [];
    let result;
    while ((result = regexp.exec(text)) !== null) {
        const [match, ...subMatches] = result;
        const { index } = result;
        // A zero-width match leaves lastIndex in place; step forward by hand or
        // exec would return it forever. In Unicode mode step over a whole pair.
        if (match === '')
            regexp.lastIndex = index + (regexp.unicode && splitsSurrogatePair(text, index + 1) ? 2 : 1);
        matches.push({ match, subMatches, index });
    }
    return matches;
}
// Below U+0300 (combining marks) every character except the CR of a CR LF
// pair is its own cluster, so the segmenter can be skipped.
function mayHaveMultiUnitClusters(text) {
    for (let i = 0; i < text.length; i++) {
        const code = text.charCodeAt(i);
        if (code >= 0x300 || code === 0x0D)
            return true;
    }
    return false;
}
/**
 * Snap matches to grapheme cluster boundaries. A literal match covering only
 * part of a cluster did not find that character and is dropped; a regexp match
 * reaching into one (`.`, `[^a-z]`) takes the whole cluster. Zero-width matches
 * inside a cluster are dropped. Overlapping expanded matches are merged.
 */
function alignToGraphemeClusters(text, matches, expand) {
    if (!matches.length || !mayHaveMultiUnitClusters(text))
        return matches;
    const isBoundary = Array.from({ length: text.length + 1 }).fill(false);
    for (const { start } of graphemeClusters(text))
        isBoundary[start] = true;
    isBoundary[text.length] = true;
    const aligned = [];
    for (const match of matches) {
        let start = match.index;
        let end = start + match.match.length;
        if (!isBoundary[start] || !isBoundary[end]) {
            if (!expand || start === end)
                continue;
            while (!isBoundary[start])
                start--;
            while (!isBoundary[end])
                end++;
        }
        const previous = aligned[aligned.length - 1];
        const previousEnd = previous ? previous.index + previous.match.length : 0;
        if (previous && start < previousEnd) {
            if (end > previousEnd)
                previous.match = text.slice(previous.index, end);
            continue;
        }
        aligned.push({ ...match, match: text.slice(start, end), index: start });
    }
    return aligned;
}
// User patterns get the Unicode flag so `.` matches an emoji whole; patterns
// only valid without it (e.g. `\-`) fall back to the plain flags.
function createSearchRegExp(source, flags, isRegexp) {
    for (const candidate of isRegexp ? [`${flags}u`, flags] : [flags]) {
        try {
            return new RegExp(source, candidate);
        }
        catch {
            // invalid with these flags; try the next set
        }
    }
    return null;
}
/** Find every match of `query` in `text`. An invalid regexp yields no matches. */
export function findMatches(text, query, options = {}) {
    const { isCaseSensitive, isWholeWord, isRegexp } = options;
    let source = query;
    let flags = 'g';
    if (!isCaseSensitive)
        flags += 'i';
    if (!isRegexp)
        source = query.replace(SPECIAL_CHAR_REG, p => (p === '\\' ? '\\\\' : `\\${p}`));
    if (isWholeWord)
        source = `\\b${source}\\b`;
    const regexp = createSearchRegExp(source, flags, !!isRegexp);
    if (!regexp)
        return [];
    return alignToGraphemeClusters(text, execAll(regexp, text), !!isRegexp)
        .map(({ index, match, subMatches }) => ({ start: index, end: index + match.length, match, subMatches }));
}
/**
 * Expand `$0`..`$99` as in VS Code's find widget: group nn when the pattern has
 * one, otherwise group n followed by a literal digit. `\$1` stays literal.
 * Uses a replacer function so `$$` and `$&` in captured text are not special.
 */
export function expandReplacement(match, replacement) {
    const groups = [match.match, ...match.subMatches];
    return replacement.replace(/(?<!\\)\$(0|[1-9]\d?)/g, (reference, digits) => {
        const index = Number(digits);
        if (index < groups.length)
            return groups[index] ?? '';
        const leading = Number(digits[0]);
        if (leading < groups.length)
            return (groups[leading] ?? '') + digits.slice(1);
        return reference;
    });
}
/** Replace the given matches (sorted, non-overlapping, as returned by findMatches). */
export function replaceMatches(text, matches, replacementOf) {
    let out = '';
    let last = 0;
    for (const m of matches) {
        out += text.slice(last, m.start) + replacementOf(m);
        last = m.end;
    }
    return out + text.slice(last);
}
/** Find `query` in `text` and replace; `$n` references expand only when `isRegexp`. */
export function replaceText(text, query, replacement, options = {}) {
    const { only, ...searchOptions } = options;
    const all = findMatches(text, query, searchOptions);
    const chosen = only === undefined ? all : all.filter((_, i) => i === only);
    return replaceMatches(text, chosen, m => (searchOptions.isRegexp ? expandReplacement(m, replacement) : replacement));
}
