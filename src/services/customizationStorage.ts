import type { CustomizationState } from '@/types/customization';

export const CUSTOMIZATION_STORAGE_KEY = 'unfold-customization-settings';

const emptyState: CustomizationState = {
  byThemeId: {},
  bySpaceId: {},
};

export function loadCustomizationState(): CustomizationState {
  if (typeof window === 'undefined') {
    return emptyState;
  }

  try {
    const raw = window.localStorage.getItem(CUSTOMIZATION_STORAGE_KEY);
    if (!raw) {
      return emptyState;
    }

    const parsed = JSON.parse(raw) as CustomizationState;
    if (!parsed || typeof parsed !== 'object') {
      return emptyState;
    }

    return {
      byThemeId: parsed.byThemeId ?? {},
      bySpaceId: parsed.bySpaceId ?? {},
    };
  } catch {
    return emptyState;
  }
}

export function saveCustomizationState(state: CustomizationState): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.setItem(CUSTOMIZATION_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore storage write failures.
  }
}
