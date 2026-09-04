// Exact names and unique partial matches only; numbers are consistently one-based.
export function resolveVoiceSelection(items, value, getLabels = item => [item.name]) {
  const query = String(value ?? '').normalize('NFKC').toLocaleLowerCase().trim();
  if (!query) return null;
  if (/^\d+$/.test(query)) return items[Number(query) - 1] || null;
  const normalize = label => String(label || '').normalize('NFKC').toLocaleLowerCase().replace(/\bdr\.?\s*/g, '').trim();
  const target = normalize(query);
  const exact = items.filter(item => getLabels(item).some(label => normalize(label) === target));
  if (exact.length === 1) return exact[0];
  const matches = items.filter(item => getLabels(item).some(label => normalize(label) && normalize(label).includes(target)));
  return matches.length === 1 ? matches[0] : null;
}
