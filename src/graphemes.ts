export interface GraphemeCluster {
  start: number
  end: number
}

let segmenter: Intl.Segmenter | null | undefined

function getSegmenter(): Intl.Segmenter | null {
  if (segmenter === undefined) {
    segmenter = typeof Intl !== 'undefined' && 'Segmenter' in Intl
      ? new Intl.Segmenter(undefined, { granularity: 'grapheme' })
      : null
  }
  return segmenter
}

/**
 * Grapheme clusters of `text` as `[start, end)` code-unit ranges. Without
 * `Intl.Segmenter` it degrades to code points (surrogate-pair aware).
 */
export function* graphemeClusters(text: string): Generator<GraphemeCluster> {
  const seg = getSegmenter()
  if (seg) {
    for (const { segment, index } of seg.segment(text))
      yield { start: index, end: index + segment.length }
    return
  }
  for (let i = 0; i < text.length;) {
    const end = i + (text.codePointAt(i)! > 0xFFFF ? 2 : 1)
    yield { start: i, end }
    i = end
  }
}
