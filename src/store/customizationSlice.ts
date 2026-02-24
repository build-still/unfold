import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type {
  CustomizationProperty,
  CustomizationPropertyMap,
  CustomizationScope,
  CustomizationSettings,
  CustomizationState,
} from '@/types/customization';
import { loadCustomizationState } from '@/services/customizationStorage';

interface SetScopePayload {
  scopeType: CustomizationScope;
  scopeId: string;
  properties: CustomizationPropertyMap;
}

interface SetPropertyPayload {
  scopeType: CustomizationScope;
  scopeId: string;
  property: CustomizationProperty;
}

interface ResetScopePayload {
  scopeType: CustomizationScope;
  scopeId: string;
}

interface ReplaceStatePayload {
  byThemeId: CustomizationState['byThemeId'];
  bySpaceId: CustomizationState['bySpaceId'];
}

const initialState: CustomizationState = loadCustomizationState();

function getScopeMap(state: CustomizationState, scopeType: CustomizationScope) {
  return scopeType === 'theme' ? state.byThemeId : state.bySpaceId;
}

function buildSettings(
  scopeType: CustomizationScope,
  scopeId: string,
  properties: CustomizationPropertyMap
): CustomizationSettings {
  return {
    scopeType,
    scopeId,
    properties,
    updatedAt: new Date().toISOString(),
  };
}

const customizationSlice = createSlice({
  name: 'customization',
  initialState,
  reducers: {
    setCustomizationSettings(state, action: PayloadAction<SetScopePayload>) {
      const { scopeType, scopeId, properties } = action.payload;
      const map = getScopeMap(state, scopeType);
      map[scopeId] = buildSettings(scopeType, scopeId, properties);
    },
    setCustomizationProperty(state, action: PayloadAction<SetPropertyPayload>) {
      const { scopeType, scopeId, property } = action.payload;
      const map = getScopeMap(state, scopeType);
      const current = map[scopeId]?.properties ?? {};
      map[scopeId] = buildSettings(scopeType, scopeId, {
        ...current,
        [property.key]: property,
      });
    },
    resetCustomizationSettings(state, action: PayloadAction<ResetScopePayload>) {
      const { scopeType, scopeId } = action.payload;
      const map = getScopeMap(state, scopeType);
      delete map[scopeId];
    },
    replaceCustomizationState(state, action: PayloadAction<ReplaceStatePayload>) {
      state.byThemeId = action.payload.byThemeId;
      state.bySpaceId = action.payload.bySpaceId;
    },
  },
});

export const {
  setCustomizationSettings,
  setCustomizationProperty,
  resetCustomizationSettings,
  replaceCustomizationState,
} = customizationSlice.actions;

export default customizationSlice.reducer;
