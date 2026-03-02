export const FONT_SIZE_MIN = 8;
export const FONT_SIZE_MAX = 48;

export function isValidFontFamily(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

export function isValidFontSize(value: unknown): value is number {
  return (
    typeof value === 'number' &&
    Number.isFinite(value) &&
    value >= FONT_SIZE_MIN &&
    value <= FONT_SIZE_MAX
  );
}

export function isValidColor(value: unknown): value is string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    return false;
  }

  if (typeof CSS !== 'undefined' && typeof CSS.supports === 'function') {
    return CSS.supports('color', value);
  }

  return /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(value);
}
