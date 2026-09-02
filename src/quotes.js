// ---------------------------------------------------------------------------
// QUOTES
//
// Reads assets/quotes.txt so the list stays a plain text file you can edit
// without touching any code. Format is "quote | attribution", one per line.
// ---------------------------------------------------------------------------

export function parse(text) {
  return text
    .split('\n')
    .map(line => line.trim())
    .filter(line => line && !line.startsWith('#'))
    .map(line => {
      const split = line.lastIndexOf('|');
      if (split === -1) return { text: line, author: '' };
      return {
        text:   line.slice(0, split).trim(),
        author: line.slice(split + 1).trim(),
      };
    });
}

export async function loadQuotes(url = 'assets/quotes.txt') {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`quotes.txt: ${res.status}`);
  return parse(await res.text());
}

export function pick(quotes) {
  return quotes[Math.floor(Math.random() * quotes.length)];
}
