# @jaguilar0925/text-search

Dependency-free find/replace for plain text, written in TypeScript.

- Case-sensitive / insensitive, whole-word and regular-expression modes
- Literal queries are escaped for you; an invalid regexp returns no matches
- VS Code style `$0`–`$99` references in replacements (`\$1` stays literal)
- Grapheme-safe: matches never split an emoji or a letter with combining marks
- Zero-width matches (`\b`, lookaheads) cannot hang the search

```ts
import { findMatches, replaceText } from '@jaguilar0925/text-search'

findMatches('Foo foo', 'foo', { isCaseSensitive: true })
// [{ start: 4, end: 7, match: 'foo', subMatches: [] }]

replaceText('x1', '([a-z])(\\d)', '$2$1', { isRegexp: true }) // '1x'
replaceText('a a a', 'a', 'b', { only: 1 })                   // 'a b a'
```

## Demo

`docs/index.html` is a static demo page that uses the compiled library from
`docs/lib/`. Run it locally:

```bash
npm install
npm run demo          # builds the library and refreshes docs/lib
npx http-server docs  # or: python3 -m http.server -d docs
```

With GitHub Pages set to deploy from the `master` branch and the `/docs`
folder, the demo is served at https://jaguilar0925.github.io/text-search/.

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
