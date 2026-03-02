import { useCallback, useState } from 'react';

import { customizationDefaultValues } from '@/config/customizationDefaults';
import type {
  CustomizationPropertyKey,
  CustomizationScope,
} from '@/types/customization';
import { isValidFontFamily, isValidFontSize } from '@/utils/customization-validation';

export type DraftOverrides = Partial<Record<CustomizationPropertyKey, string | number>>;

export interface DraftState {
  app: DraftOverrides;
  space: DraftOverrides;
}

const EMPTY_DRAFT: DraftState = { app: {}, space: {} };

export function useCustomizationDraft() {
  const [isDirty, setIsDirty] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [draftOverrides, setDraftOverrides] = useState<DraftState>(EMPTY_DRAFT);

  const applyProperty = useCallback(
    (
      scopeType: CustomizationScope,
      _scopeId: string,
      key: CustomizationPropertyKey,
      value: string | number,
    ) => {
      const errorKey = `${scopeType}.${key}`;
      const valueType = key.endsWith('fontSize') ? 'fontSize' : 'fontFamily';

      if (valueType === 'fontFamily' && !isValidFontFamily(value)) {
        setErrors((prev) => ({ ...prev, [errorKey]: 'select a valid font' }));
        return;
      }

      if (valueType === 'fontSize' && !isValidFontSize(value)) {
        setErrors((prev) => ({ ...prev, [errorKey]: 'select a valid size' }));
        return;
      }

      setErrors((prev) => {
        const next = { ...prev };
        delete next[errorKey];
        return next;
      });

      const draftScope = scopeType === 'theme' ? 'app' : 'space';
      setDraftOverrides((prev) => ({
        ...prev,
        [draftScope]: { ...prev[draftScope], [key]: value },
      }));
      setIsDirty(true);
    },
    [],
  );

  const setScopeDraftValues = useCallback(
    (
      scope: 'app' | 'space',
      updates: Partial<Record<CustomizationPropertyKey, string | number>>,
    ) => {
      setDraftOverrides((prev) => ({
        ...prev,
        [scope]: { ...prev[scope], ...updates },
      }));
    },
    [],
  );

  const resetDraft = useCallback(() => {
    setDraftOverrides(EMPTY_DRAFT);
    setErrors({});
    setIsDirty(false);
  }, []);

  const resetToDefaults = useCallback(
    (activeTab: 'app' | 'space', activeSpaceId: string | null) => {
      const overrides: DraftOverrides = {};
      Object.entries(customizationDefaultValues).forEach(([key, entry]) => {
        overrides[key as CustomizationPropertyKey] = entry.value;
      });

      if (activeTab === 'app') {
        setDraftOverrides((prev) => ({ ...prev, app: overrides }));
      } else if (activeTab === 'space' && activeSpaceId) {
        setDraftOverrides((prev) => ({ ...prev, space: overrides }));
      }
      setErrors({});
      setIsDirty(true);
    },
    [],
  );

  const getErrorForScope = useCallback(
    (scopeType: CustomizationScope) =>
      (key: CustomizationPropertyKey) =>
        errors[`${scopeType}.${key}`],
    [errors],
  );

  const appHasDraft = Object.keys(draftOverrides.app).length > 0;
  const spaceHasDraft = Object.keys(draftOverrides.space).length > 0;

  return {
    isDirty,
    setIsDirty,
    errors,
    draftOverrides,
    applyProperty,
    setScopeDraftValues,
    resetDraft,
    resetToDefaults,
    getErrorForScope,
    appHasDraft,
    spaceHasDraft,
  };
}
