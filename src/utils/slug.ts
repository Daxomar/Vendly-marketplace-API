// A "slug" is a short, readable name for URLs: "Ama's Gadgets!" → "amas-gadgets".
export function slugify(text: string) {
  return text
    .toString()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "") // strip accents
    .toLowerCase()
    .replace(/['’]/g, "") // "ama's" → "amas"
    .replace(/[^a-z0-9]+/g, "-") // anything else → "-"
    .replace(/^-+|-+$/g, "") // trim dashes
    .slice(0, 60);
}

// Returns `base`, or `base-2`, `base-3`... until `isTaken` says it's free.
export async function uniqueSlug(base: string, isTaken: (slug: string) => Promise<boolean>) {
  const clean = slugify(base) || "store";
  let candidate = clean;
  let n = 2;
  while (await isTaken(candidate)) {
    candidate = `${clean}-${n}`;
    n++;
  }
  return candidate;
}
