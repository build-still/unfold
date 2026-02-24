export type CustomizationScope = 'theme' | 'space';

export type CustomizationValueType = 'fontFamily' | 'fontSize';

export type CustomizationPropertyKey =
  | 'body.fontFamily'
  | 'editor.fontFamily'
  | 'title.fontFamily'
  | 'code.fontFamily'
  | 'h1.fontFamily'
  | 'h2.fontFamily'
  | 'h3.fontFamily'
  | 'editor.fontSize'
  | 'title.fontSize'
  | 'code.fontSize'
  | 'h1.fontSize'
  | 'h2.fontSize'
  | 'h3.fontSize';

export type CustomizationPropertyValue = string | number;

export interface CustomizationProperty {
  key: CustomizationPropertyKey;
  value: CustomizationPropertyValue;
  valueType: CustomizationValueType;
}

export type CustomizationPropertyMap = Partial<
  Record<CustomizationPropertyKey, CustomizationProperty>
>;

export interface CustomizationSettings {
  scopeType: CustomizationScope;
  scopeId: string;
  properties: CustomizationPropertyMap;
  updatedAt: string;
}

export interface CustomizationState {
  byThemeId: Record<string, CustomizationSettings>;
  bySpaceId: Record<string, CustomizationSettings>;
}
