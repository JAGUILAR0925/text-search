import { describe, expect, it } from 'vitest'
import { expandReplacement, findMatches, replaceText } from '../src/index.js'

const spans = (t: string, q: string, o = {}) => findMatches(t, q, o).map(m => [m.start, m.end])

describe('findMatches', () => {
  it('is case-insensitive by default and case-sensitive on request', () => {
    expect(spans('Foo foo', 'foo')).toEqual([[0, 3], [4, 7]])
    expect(spans('Foo foo', 'foo', { isCaseSensitive: true })).toEqual([[4, 7]])
  })

  it('escapes special characters when not a regexp', () => {
    expect(spans('a.b axb', 'a.b')).toEqual([[0, 3]])
    expect(spans('a\\b', 'a\\b')).toEqual([[0, 3]])
  })

  it('matches whole words only', () => {
    expect(spans('cat concat cat.', 'cat', { isWholeWord: true })).toEqual([[0, 3], [11, 14]])
  })

  it('returns no matches for an invalid regexp', () => {
    expect(findMatches('abc', '(', { isRegexp: true })).toEqual([])
  })

  it('falls back to non-Unicode flags for patterns like \\-', () => {
    expect(spans('a-b', 'a\\-b', { isRegexp: true })).toEqual([[0, 3]])
  })

  it('terminates on zero-width matches, including inside surrogate pairs', () => {
    expect(spans('ab', '\\b', { isRegexp: true })).toEqual([[0, 0], [2, 2]])
    expect(() => findMatches('😀😀', '(?:)', { isRegexp: true })).not.toThrow()
  })

  it('drops a literal match that covers part of a grapheme cluster', () => {
    const family = '👨‍👩‍👧' // ZWJ sequence
    expect(findMatches(family, '👨')).toEqual([])
    expect(spans(`x${family}`, family)).toEqual([[1, 1 + family.length]])
  })

  it('expands a regexp match to the whole cluster', () => {
    const e = 'é' // e + combining acute
    expect(spans(`${e}x`, '.', { isRegexp: true })).toEqual([[0, 2], [2, 3]])
  })

  it('keeps capture groups', () => {
    expect(findMatches('ab12', '([a-z]+)(\\d+)', { isRegexp: true })[0].subMatches).toEqual(['ab', '12'])
  })
})

describe('expandReplacement', () => {
  const m = { start: 0, end: 4, match: 'ab12', subMatches: ['ab', '12'] }
  it('reads $0 and $n', () => expect(expandReplacement(m, '$2-$1 ($0)')).toBe('12-ab (ab12)'))
  it('falls back to group n plus a literal digit', () => expect(expandReplacement(m, '$15')).toBe('ab5'))
  it('leaves unknown references and escaped $ alone', () => {
    expect(expandReplacement(m, '$9')).toBe('$9')
    expect(expandReplacement(m, '\\$1')).toBe('\\$1')
  })
  it('does not interpret $$ or $& from captured text', () => {
    const c = { start: 0, end: 3, match: '$&x', subMatches: ['$&'] }
    expect(expandReplacement(c, '[$1]')).toBe('[$&]')
  })
})

describe('replaceText', () => {
  it('replaces all by default', () => expect(replaceText('a a a', 'a', 'b')).toBe('b b b'))
  it('replaces only one when asked', () => expect(replaceText('a a a', 'a', 'b', { only: 1 })).toBe('a b a'))
  it('expands $n only in regexp mode', () => {
    expect(replaceText('x1', '([a-z])(\\d)', '$2$1', { isRegexp: true })).toBe('1x')
    expect(replaceText('x1', 'x1', '$1')).toBe('$1')
  })
  it('does not touch text when nothing matches', () => expect(replaceText('abc', 'z', 'y')).toBe('abc'))
})
