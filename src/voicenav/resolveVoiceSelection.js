// Exact names and unique partial matches only; numbers are consistently one-based.
export function resolveVoiceSelection(items, value, getLabels = item => [item.name]) {
  const query = String(value ?? '').normalize('NFKC').toLocaleLowerCase().trim();
  if (!query) return null;
  if (/^\d+$/.test(query)) return items[Number(query) - 1] || null;
  const normalize = label => String(label || '').normalize('NFKC').toLocaleLowerCase().replace(/\bdr\.?\s*/g, '').replace(/[^\p{L}\p{M}\p{N}]+/gu, ' ').trim();
  const target = normalize(query);
  const byId = items.filter(item => String(item.id) === String(value));
  if (byId.length === 1) return byId[0];
  const exact = items.filter(item => getLabels(item).some(label => normalize(label) === target));
  if (exact.length === 1) return exact[0];
  const matches = items.filter(item => getLabels(item).some(label => normalize(label) && normalize(label).includes(target)));
  if (matches.length === 1) return matches[0];
  // Match a full name embedded in a sentence; shared words never choose a winner.
  const embedded = items.filter(item => getLabels(item).some(label => {
    const name = normalize(label);
    return name.length >= 3 && (` ${target} `).includes(` ${name} `);
  }));
  return embedded.length === 1 ? embedded[0] : null;
}

export function resolveVoiceEntity(items, command, getLabels = item => [item.name]) {
  const target = String(command?.target || '');
  const byId = items.filter(item => target && String(item.id) === target);
  if (byId.length === 1) return byId[0];
  const value = command?.value;
  if (value !== undefined && value !== null && String(value).trim()) {
    return resolveVoiceSelection(items, value, getLabels);
  }
  return resolveVoiceSelection(items, command?.raw || target, getLabels);
}
