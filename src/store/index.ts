import { configureStore, Middleware } from '@reduxjs/toolkit';

import { appApi } from '@/store/api/app-api';
import customizationReducer, {
  replaceCustomizationState,
  resetCustomizationSettings,
  setCustomizationProperty,
  setCustomizationSettings,
} from '@/store/customizationSlice';
import uiReducer, {
  ACTIVE_SPACE_STORAGE_KEY,
  setActiveSpaceId,
  setThemePreference,
} from '@/store/slices/ui-slice';
import { saveCustomizationState } from '@/services/customizationStorage';
import { THEME_STORAGE_KEY } from '@/store/theme';

const persistenceMiddleware: Middleware = (storeAPI) => (next) => (action) => {
  const result = next(action);

  if (typeof window === 'undefined') {
    return result;
  }

  if (setThemePreference.match(action)) {
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, action.payload);
    } catch {
      // Ignore storage write failures.
    }
  }

  if (setActiveSpaceId.match(action)) {
    try {
      if (action.payload) {
        window.localStorage.setItem(ACTIVE_SPACE_STORAGE_KEY, action.payload);
      } else {
        window.localStorage.removeItem(ACTIVE_SPACE_STORAGE_KEY);
      }
    } catch {
      // Ignore storage write failures.
    }
  }

  if (
    setCustomizationSettings.match(action) ||
    setCustomizationProperty.match(action) ||
    resetCustomizationSettings.match(action) ||
    replaceCustomizationState.match(action)
  ) {
    const state = storeAPI.getState();
    saveCustomizationState(state.customization);
  }

  return result;
};

export const store = configureStore({
  reducer: {
    [appApi.reducerPath]: appApi.reducer,
    ui: uiReducer,
    customization: customizationReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(appApi.middleware, persistenceMiddleware),
});

export type AppStore = typeof store;
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
