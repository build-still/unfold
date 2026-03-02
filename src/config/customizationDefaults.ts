import type {
  CustomizationPropertyKey,
  CustomizationPropertyMap,
  CustomizationValueType,
} from '@/types/customization';

export const customizationValueTypes: Record<CustomizationPropertyKey, CustomizationValueType> = {
  'body.fontFamily': 'fontFamily',
  'editor.fontFamily': 'fontFamily',
  'title.fontFamily': 'fontFamily',
  'code.fontFamily': 'fontFamily',
  'h1.fontFamily': 'fontFamily',
  'h2.fontFamily': 'fontFamily',
  'h3.fontFamily': 'fontFamily',
  'editor.fontSize': 'fontSize',
  'title.fontSize': 'fontSize',
  'code.fontSize': 'fontSize',
  'h1.fontSize': 'fontSize',
  'h2.fontSize': 'fontSize',
  'h3.fontSize': 'fontSize',
};

export const customizationDefaultValues: CustomizationPropertyMap = {
  'body.fontFamily': {
    key: 'body.fontFamily',
    value: 'DM Sans',
    valueType: 'fontFamily',
  },
  'editor.fontFamily': {
    key: 'editor.fontFamily',
    value: 'DM Sans',
    valueType: 'fontFamily',
  },
  'title.fontFamily': {
    key: 'title.fontFamily',
    value: 'Bricolage Grotesque',
    valueType: 'fontFamily',
  },
  'code.fontFamily': {
    key: 'code.fontFamily',
    value: 'Google Sans Code',
    valueType: 'fontFamily',
  },
  'h1.fontFamily': {
    key: 'h1.fontFamily',
    value: 'Bricolage Grotesque',
    valueType: 'fontFamily',
  },
  'h2.fontFamily': {
    key: 'h2.fontFamily',
    value: 'Bricolage Grotesque',
    valueType: 'fontFamily',
  },
  'h3.fontFamily': {
    key: 'h3.fontFamily',
    value: 'Bricolage Grotesque',
    valueType: 'fontFamily',
  },
  'editor.fontSize': {
    key: 'editor.fontSize',
    value: 14,
    valueType: 'fontSize',
  },
  'title.fontSize': {
    key: 'title.fontSize',
    value: 47,
    valueType: 'fontSize',
  },
  'code.fontSize': {
    key: 'code.fontSize',
    value: 13,
    valueType: 'fontSize',
  },
  'h1.fontSize': {
    key: 'h1.fontSize',
    value: 36,
    valueType: 'fontSize',
  },
  'h2.fontSize': {
    key: 'h2.fontSize',
    value: 28,
    valueType: 'fontSize',
  },
  'h3.fontSize': {
    key: 'h3.fontSize',
    value: 20,
    valueType: 'fontSize',
  },
};
