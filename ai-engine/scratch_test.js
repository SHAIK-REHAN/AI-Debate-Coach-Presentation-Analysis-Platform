
function renderInline(str) {
  if (!str) return [];
  const regex = /([^]+|\*\*\*([^*]+)\*\*\*|___([^_]+)___|\*\*([^*]+)\*\*|__([^_]+)__|(?<!\*)\*([^*]+)\*(?!\*)|(?<!_)_([^_]+)_(?!_))/g;
  const parts = [];
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(str)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: 'text', val: str.slice(lastIndex, match.index) });
    }
    const full = match[0];
    if (full.startsWith('') && full.endsWith('')) {
      parts.push({ type: 'code', val: full.slice(1, -1) });
    } else if (match[2] || match[3]) {
      parts.push({ type: 'bold-italic', val: match[2] || match[3] });
    } else if (match[4] || match[5]) {
      parts.push({ type: 'bold', val: match[4] || match[5] });
    } else if (match[6] || match[7]) {
      parts.push({ type: 'italic', val: match[6] || match[7] });
    }
    lastIndex = regex.lastIndex;
  }
  if (lastIndex < str.length) {
    parts.push({ type: 'text', val: str.slice(lastIndex) });
  }
  return parts;
}

const tests = [
  '*Logical Gap:* This is a gap',
  'Here is *in-silico* and *in-vitro* testing.',
  '**Strengths:** Good job with *accuracy*.',
  'Code is unc() and ***super-bold-italic***.'
];

tests.forEach(t => {
  console.log('INPUT:', t);
  console.log('RESULT:', JSON.stringify(renderInline(t)));
});
