# text-search

Dependency-free find/replace for plain text, written in TypeScript.

- Case-sensitive / insensitive, whole-word and regular-expression modes
- Literal queries are escaped for you; an invalid regexp returns no matches
- VS Code style `$0`–`$99` references in replacements (`\$1` stays literal)
- Grapheme-safe: matches never split an emoji or a letter with combining marks
- Zero-width matches (`\b`, lookaheads) cannot hang the search

```ts
import { findMatches, replaceText } from 'text-search'

findMatches('Foo foo', 'foo', { isCaseSensitive: true })
// [{ start: 4, end: 7, match: 'foo', subMatches: [] }]

replaceText('x1', '([a-z])(\\d)', '$2$1', { isRegexp: true }) // '1x'
replaceText('a a a', 'a', 'b', { only: 1 })                   // 'a b a'
```

## Develop

```bash
npm install
npm run typecheck
npm test
npm run build
```

## Credits

The matching and replacement logic is adapted from
[MarkText](https://github.com/marktext/marktext) (`packages/muya`), MIT licensed.
See `NOTICE` and `LICENSE`.
