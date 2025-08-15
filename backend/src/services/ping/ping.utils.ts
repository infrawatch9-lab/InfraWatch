export function getDifferences(obj1: any, obj2: any, prefix = ''): string[] {
  const diffs: string[] = [];

  for (const [key, value] of Object.entries(obj2)) {
    const path = prefix ? `${prefix}.${key}` : key;

    if (value && typeof value === 'object' && !Array.isArray(value)) {
      diffs.push(...getDifferences(obj1?.[key], value, path));
    } else if (obj1?.[key] !== value) {
      diffs.push(path);
    }
  }

  return diffs;
}


