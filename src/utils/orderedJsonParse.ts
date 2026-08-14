// Author: Vincy SHI
// Email: vincy@vincy1230.net

/**
 * A JSON parser that preserves object key order for keys that look like non-negative integers.
 * `JSON.parse` can't do this: the moment a plain JS object is given a property whose name looks
 * like an array index (e.g. "1", "12"), the engine buckets it into an always-ascending-numeric-
 * order internal slot — this happens inside `JSON.parse` itself, before any application code runs,
 * so no post-processing of its result can recover the source order. That silently reorders two
 * shapes this app cares about: `non_canonical_residues` (keyed by residue index, which is always
 * integer-like) and `queries` (a query key like "1" is legal JSON, if unusual).
 *
 * Parses objects into `Map<string, JsonValue>` instead — `Map` preserves true insertion order for
 * every key, integer-like or not — and arrays into plain arrays (already order-safe).
 */

export type JsonValue = string | number | boolean | null | JsonValue[] | JsonObject
export class JsonObject extends Map<string, JsonValue> {}

export function parseOrderedJson(text: string): JsonValue {
  const parser = new JsonParser(text)
  const value = parser.parseValue()
  parser.skipWhitespace()
  if (parser.pos < text.length) {
    throw new SyntaxError(`Unexpected non-whitespace character after JSON value at position ${parser.pos}`)
  }
  return value
}

function isDigit(ch: string | undefined): boolean {
  return ch !== undefined && ch >= '0' && ch <= '9'
}

class JsonParser {
  pos = 0
  constructor(private readonly text: string) {}

  // A method, not a getter: TS's control-flow narrowing treats a getter's result as a stable
  // value across an entire function body once compared, even though this one changes every time
  // `this.pos` advances — that produced bogus "these types have no overlap" errors after any
  // `if (this.char() !== X) throw` guard followed by another comparison. Method calls aren't
  // narrowed the same way, so this sidesteps it.
  private char(): string | undefined {
    return this.text[this.pos]
  }

  skipWhitespace(): void {
    while (this.pos < this.text.length && /[ \t\n\r]/.test(this.text[this.pos]!)) this.pos++
  }

  private expect(ch: string): void {
    if (this.char() !== ch) throw new SyntaxError(`Expected "${ch}" at position ${this.pos}, got ${this.describeHere()}`)
    this.pos++
  }

  private describeHere(): string {
    return this.pos >= this.text.length ? 'end of input' : JSON.stringify(this.text[this.pos])
  }

  parseValue(): JsonValue {
    this.skipWhitespace()
    const ch = this.char()
    if (ch === '{') return this.parseObject()
    if (ch === '[') return this.parseArray()
    if (ch === '"') return this.parseString()
    if (ch === 't' || ch === 'f') return this.parseBoolean()
    if (ch === 'n') return this.parseNull()
    if (ch === '-' || isDigit(ch)) return this.parseNumber()
    throw new SyntaxError(`Unexpected token ${this.describeHere()} at position ${this.pos}`)
  }

  private parseObject(): JsonObject {
    this.expect('{')
    const obj = new JsonObject()
    this.skipWhitespace()
    if (this.char() === '}') {
      this.pos++
      return obj
    }
    for (;;) {
      this.skipWhitespace()
      if (this.char() !== '"') throw new SyntaxError(`Expected a string key at position ${this.pos}, got ${this.describeHere()}`)
      const key = this.parseString()
      this.skipWhitespace()
      this.expect(':')
      const value = this.parseValue()
      obj.set(key, value)
      this.skipWhitespace()
      const sep = this.char()
      if (sep === ',') {
        this.pos++
        continue
      }
      if (sep === '}') {
        this.pos++
        break
      }
      throw new SyntaxError(`Expected "," or "}" at position ${this.pos}, got ${this.describeHere()}`)
    }
    return obj
  }

  private parseArray(): JsonValue[] {
    this.expect('[')
    const arr: JsonValue[] = []
    this.skipWhitespace()
    if (this.char() === ']') {
      this.pos++
      return arr
    }
    for (;;) {
      arr.push(this.parseValue())
      this.skipWhitespace()
      const sep = this.char()
      if (sep === ',') {
        this.pos++
        continue
      }
      if (sep === ']') {
        this.pos++
        break
      }
      throw new SyntaxError(`Expected "," or "]" at position ${this.pos}, got ${this.describeHere()}`)
    }
    return arr
  }

  private parseString(): string {
    const start = this.pos
    this.expect('"')
    let hasEscape = false
    while (this.char() !== '"') {
      if (this.pos >= this.text.length) throw new SyntaxError(`Unterminated string starting at position ${start}`)
      if (this.char() === '\\') {
        hasEscape = true
        this.pos++
        if (this.pos >= this.text.length) throw new SyntaxError(`Unterminated escape at position ${this.pos}`)
        if (this.char() === 'u') this.pos += 4
      }
      this.pos++
    }
    this.pos++ // closing quote
    const raw = this.text.slice(start, this.pos)
    // Reuse JSON.parse for the actual unescaping (\uXXXX, \n, etc.) instead of reimplementing it —
    // `raw` is a single, self-contained, already-validated JSON string literal, so this is safe
    // and avoids duplicating the escape-handling logic.
    return hasEscape ? (JSON.parse(raw) as string) : raw.slice(1, -1)
  }

  private parseNumber(): number {
    const start = this.pos
    if (this.char() === '-') this.pos++
    if (this.char() === '0') {
      this.pos++
    } else if (isDigit(this.char())) {
      while (isDigit(this.char())) this.pos++
    } else {
      throw new SyntaxError(`Invalid number at position ${start}`)
    }
    if (this.char() === '.') {
      this.pos++
      if (!isDigit(this.char())) throw new SyntaxError(`Invalid number at position ${start}`)
      while (isDigit(this.char())) this.pos++
    }
    const expCh = this.char()
    if (expCh === 'e' || expCh === 'E') {
      this.pos++
      const sign = this.char()
      if (sign === '+' || sign === '-') this.pos++
      if (!isDigit(this.char())) throw new SyntaxError(`Invalid number at position ${start}`)
      while (isDigit(this.char())) this.pos++
    }
    return Number(this.text.slice(start, this.pos))
  }

  private parseBoolean(): boolean {
    if (this.text.startsWith('true', this.pos)) {
      this.pos += 4
      return true
    }
    if (this.text.startsWith('false', this.pos)) {
      this.pos += 5
      return false
    }
    throw new SyntaxError(`Invalid literal at position ${this.pos}`)
  }

  private parseNull(): null {
    if (this.text.startsWith('null', this.pos)) {
      this.pos += 4
      return null
    }
    throw new SyntaxError(`Invalid literal at position ${this.pos}`)
  }
}
