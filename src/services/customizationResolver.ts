import { customizationDefaultValues } from '@/config/customizationDefaults';
import type { CustomizationPropertyKey, CustomizationPropertyMap } from '@/types/customization';

export function resolveCustomizationProperties(
  themeProperties?: CustomizationPropertyMap,
  spaceProperties?: CustomizationPropertyMap
): CustomizationPropertyMap {
  return {
    ...customizationDefaultValues,
    ...(themeProperties ?? {}),
    ...(spaceProperties ?? {}),
  };
}

export function resolveThemeCustomizationProperties(
  themeProperties?: CustomizationPropertyMap
): CustomizationPropertyMap {
  return resolveCustomizationProperties(themeProperties, undefined);
}

export function resolveCustomizationValue(
  key: CustomizationPropertyKey,
  themeProperties?: CustomizationPropertyMap,
  spaceProperties?: CustomizationPropertyMap
) {
  const resolved = resolveCustomizationProperties(themeProperties, spaceProperties);
  return resolved[key];
}
