export function createSlug(input: string): string {
  const base = input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  return base.length > 2 ? base : `job-${Date.now().toString(36)}`;
}

export function createUniqueRoleSlug(roleTitle: string): string {
  const suffix = Math.random().toString(36).slice(2, 8);
  return `${createSlug(roleTitle)}-${suffix}`;
}
