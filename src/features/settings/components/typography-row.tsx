import FontPicker from '@/components/settings/controls/font-picker';
import { customizationDefaultValues } from '@/config/customizationDefaults';
import type { CustomizationPropertyKey, CustomizationScope } from '@/types/customization';

import {
  HEADING_FONT_KEYS,
  HEADING_SCALE_MAX,
  HEADING_SCALE_MIN,
  HEADING_SIZE_KEYS,
  TITLE_FONT_SIZE_MAX,
  type TypographyRowConfig,
} from '../constants/typography-rows';
import { RowResetButton } from './row-reset-button';
import { SizeSliderChip } from './size-slider-chip';

interface TypographyRowProps {
  row: TypographyRowConfig;
  scope: 'app' | 'space';
  scopeType: CustomizationScope;
  scopeId: string;
  getVal: (key: CustomizationPropertyKey, scope: 'app' | 'space') => string | number | undefined;
  applyProperty: (
    scopeType: CustomizationScope,
    scopeId: string,
    key: CustomizationPropertyKey,
    value: string | number,
  ) => void;
  setDraftValues: (updates: Partial<Record<CustomizationPropertyKey, string | number>>) => void;
  setDirty: () => void;
  getError: (key: CustomizationPropertyKey) => string | undefined;
}

export function TypographyRow({
  row,
  scope,
  scopeType,
  scopeId,
  getVal,
  applyProperty,
  setDraftValues,
  setDirty,
  getError,
}: TypographyRowProps) {
  const applyRowProperty = (key: CustomizationPropertyKey, value: string | number) => {
    if (row.label !== 'heading') {
      applyProperty(scopeType, scopeId, key, value);
      return;
    }

    if (key.endsWith('fontFamily')) {
      HEADING_FONT_KEYS.forEach((headingKey) => applyProperty(scopeType, scopeId, headingKey, value));
      return;
    }

    const headingMaxSize = Number(value);
    const paragraphSize = Number(getVal('editor.fontSize', scope));

    if (!Number.isFinite(headingMaxSize) || !Number.isFinite(paragraphSize)) {
      HEADING_SIZE_KEYS.forEach((headingKey) => applyProperty(scopeType, scopeId, headingKey, value));
      return;
    }

    if (headingMaxSize <= paragraphSize) {
      HEADING_SIZE_KEYS.forEach((headingKey) => applyProperty(scopeType, scopeId, headingKey, headingMaxSize));
      return;
    }

    const scaledH2 = Math.round((headingMaxSize + paragraphSize) / 2);
    const scaledSizes: number[] = [headingMaxSize, scaledH2, paragraphSize];
    HEADING_SIZE_KEYS.forEach((headingKey, index) => applyProperty(scopeType, scopeId, headingKey, scaledSizes[index]));
  };

  const resetRow = () => {
    if (row.label === 'heading') {
      const updates: Partial<Record<CustomizationPropertyKey, string | number>> = {};
      HEADING_FONT_KEYS.forEach((key) => {
        updates[key] = customizationDefaultValues[key]?.value;
      });
      HEADING_SIZE_KEYS.forEach((key) => {
        updates[key] = customizationDefaultValues[key]?.value;
      });
      setDraftValues(updates);
    } else {
      setDraftValues({
        [row.fontKey]: customizationDefaultValues[row.fontKey]?.value,
        [row.sizeKey]: customizationDefaultValues[row.sizeKey]?.value,
      });
    }

    setDirty();
  };

  const isRowCustomized = (() => {
    if (row.label === 'heading') {
      return [...HEADING_FONT_KEYS, ...HEADING_SIZE_KEYS].some(
        (key) => getVal(key, scope) !== customizationDefaultValues[key]?.value,
      );
    }

    return (
      getVal(row.fontKey, scope) !== customizationDefaultValues[row.fontKey]?.value ||
      getVal(row.sizeKey, scope) !== customizationDefaultValues[row.sizeKey]?.value
    );
  })();

  const titleMinSize = Number(getVal('h1.fontSize', scope));

  return (
    <div className="grid w-full grid-cols-[minmax(0,1fr)_120px_20px] items-end gap-3 py-3 first:pt-0 last:pb-0">
      <FontPicker
        key={`${scope}-${row.fontKey}`}
        label={row.label}
        value={String(getVal(row.fontKey, scope))}
        onChange={(next) => applyRowProperty(row.fontKey, next)}
        error={getError(row.fontKey)}
        monospaceOnly={row.monospaceOnly}
      />

      {row.label === 'heading' ? (
        <SizeSliderChip
          key={`${scope}-${row.sizeKey}`}
          label="scale"
          value={Number(getVal('h1.fontSize', scope))}
          onChange={(next) => applyRowProperty(row.sizeKey, next)}
          min={HEADING_SCALE_MIN}
          max={HEADING_SCALE_MAX}
        />
      ) : (
        <SizeSliderChip
          key={`${scope}-${row.sizeKey}`}
          label="size"
          value={Number(getVal(row.sizeKey, scope))}
          onChange={(next) => applyRowProperty(row.sizeKey, next)}
          min={row.label === 'title' ? Math.max(24, titleMinSize) : 10}
          max={row.label === 'title' ? TITLE_FONT_SIZE_MAX : 32}
        />
      )}

      <div className="flex items-end pb-1.5">
        <RowResetButton
          title={`reset ${row.label} to default`}
          disabled={!isRowCustomized}
          onClick={resetRow}
        />
      </div>
    </div>
  );
}
