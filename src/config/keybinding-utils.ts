const MODIFIER_ALIASES: Record<string, string> = {
  command: 'cmd',
  meta: 'cmd',
  control: 'ctrl',
  option: 'alt',
};

const MODIFIER_ORDER = ['cmd', 'ctrl', 'alt', 'shift'] as const;
type ModifierToken = (typeof MODIFIER_ORDER)[number];

const isModifierToken = (token: string): token is ModifierToken => {
  return (
    token === 'cmd' || token === 'ctrl' || token === 'alt' || token === 'shift'
  );
};

const normalizePart = (part: string) => {
  const token = part.trim().toLowerCase();
  return MODIFIER_ALIASES[token] ?? token;
};

const normalizeKey = (key: string) => {
  if (key === ' ') return 'space';
  if (key === 'escape') return 'esc';
  if (key === 'arrowup') return 'up';
  if (key === 'arrowdown') return 'down';
  if (key === 'arrowleft') return 'left';
  if (key === 'arrowright') return 'right';
  return key.toLowerCase();
};

/**
 * Normalizes a keyboard chord string into canonical order and key names.
 * Example: "Shift+Command+B" -> "cmd+shift+b".
 */
export const normalizeChord = (value: string) => {
  const rawParts = value
    .split('+')
    .map((part) => normalizePart(part))
    .filter(Boolean);

  const modifiers = MODIFIER_ORDER.filter((modifier) =>
    rawParts.includes(modifier),
  );

  const keyPart = rawParts.find((part) => !isModifierToken(part));

  return [...modifiers, ...(keyPart ? [normalizeKey(keyPart)] : [])].join('+');
};

/**
 * Converts a DOM KeyboardEvent into a normalized command chord string.
 * Returns an empty string for pure modifier presses.
 */
export const keyboardEventToChord = (event: KeyboardEvent) => {
  const key = normalizeKey(event.key);

  if (['meta', 'control', 'alt', 'shift'].includes(key)) {
    return '';
  }

  const parts = [
    event.metaKey ? 'cmd' : null,
    event.ctrlKey ? 'ctrl' : null,
    event.altKey ? 'alt' : null,
    event.shiftKey ? 'shift' : null,
    key,
  ].filter((part): part is string => Boolean(part));

  return normalizeChord(parts.join('+'));
};
