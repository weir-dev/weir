const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// Rich syntax highlighter for Python & SQL ingestion code streams
// 1: Comments (#...)
// 2: Strings ("...", '...', f"...")
// 3: Keywords (Python + SQL)
// 4: Numbers (decimal, float, hex)
// 5: Builtins, types & common classes
// 6: Functions & methods
// 7: Operators & punctuation symbols
const TOK = new RegExp(
  [
    /(#[^\n]*)/.source,
    /([fr]?"(?:[^"\\\n]|\\.)*"|'(?:[^'\\\n]|\\.)*')/.source,
    /\b(import|from|if|elif|else|for|while|in|return|def|class|async|await|with|try|except|not|and|or|as|is|True|False|None|continue|break|INSERT|INTO|VALUES|ON|CONFLICT|DO|UPDATE|SET|CASE|WHEN|THEN|ELSE|END|AND|IS|NULL|NOT|RETURNING|GREATEST|INTERVAL|NOW|SELECT|WHERE|FROM|LIMIT|ORDER|BY|DESC|ASC)\b/.source,
    /\b(\d[\d_.]*)\b/.source,
    /\b(httpx|AsyncClient|RawMint|Token|Label|datetime|int|float|str|list|dict|set|tuple|len|range|max|min|print|sleep|random|self|client|res|res_dex|db|query|text|GREATEST)\b/.source,
    /\b([a-zA-Z_][a-zA-Z0-9_]*)(?=\s*\()/.source,
    /(=>|->|==|!=|>=|<=|[=+\-*/<>%:!&|^])/.source,
  ].join('|'),
  'g'
);

/** Rich, colorful syntax highlighter for the live code stream terminal. */
export function highlightCode(src: string): string {
  let out = '';
  let last = 0;
  let m: RegExpExecArray | null;
  TOK.lastIndex = 0;

  while ((m = TOK.exec(src)) !== null) {
    out += esc(src.slice(last, m.index));
    if (m[1]) {
      // Comments: vibrant soft slate/teal italic
      out += '<span class="c">' + esc(m[1]) + '</span>';
    } else if (m[2]) {
      // Strings: bright luminous emerald/spring green
      out += '<span class="s">' + esc(m[2]) + '</span>';
    } else if (m[3]) {
      // Keywords: electric magenta / solana purple
      out += '<span class="k">' + esc(m[3]) + '</span>';
    } else if (m[4]) {
      // Numbers: bright radiant amber / orange
      out += '<span class="n">' + esc(m[4]) + '</span>';
    } else if (m[5]) {
      // Builtins & Types: electric cyan / sky blue
      out += '<span class="t">' + esc(m[5]) + '</span>';
    } else if (m[6]) {
      // Functions / Methods: vivid golden yellow / light cyan
      out += '<span class="fn">' + esc(m[6]) + '</span>';
    } else if (m[7]) {
      // Operators: soft rose / coral
      out += '<span class="op">' + esc(m[7]) + '</span>';
    }
    last = m.index + m[0].length;
  }
  return out + esc(src.slice(last));
}
