// Money is stored as whole pesewas (₵1.00 = 100) everywhere in the API.
// Never store or add decimals: 0.1 + 0.2 !== 0.3 in JavaScript.

// 13000 → "₵130.00" (for emails, logs, seed output)
export function formatCedis(pesewas: number) {
  return `₵${(pesewas / 100).toFixed(2)}`;
}

// 130 → 13000. Only for converting human input like seed data.
export function cedisToPesewas(cedis: number) {
  return Math.round(cedis * 100);
}
