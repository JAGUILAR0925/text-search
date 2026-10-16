export interface SearchOptions {
  isCaseSensitive?: boolean
  isWholeWord?: boolean
  isRegexp?: boolean
}

export interface Match {
  /** Start offset, in UTF-16 code units. */
  start: number
  /** End offset (exclusive), in UTF-16 code units. */
  end: number
  match: string
  subMatches: (string | undefined)[]
}
