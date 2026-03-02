import { useMemo, useState } from 'react';

import { FooterActionBar } from '@/components/molecules/footer-action-bar';
import { PanelSection } from '@/components/molecules/panel-section';
import { customizationDefaultValues } from '@/config/customizationDefaults';
import { useFileSystem } from '@/contexts/FileSystemContext';
import { setCustomizationProperty } from '@/store/customizationSlice';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { selectSpaceName } from '@/store/selectors';
import { resolveCustomizationProperties } from '@/services/customizationResolver';
import type {
  CustomizationPropertyKey,
  CustomizationScope,
} from '@/types/customization';
import { TabSwitcher } from '@/components/ui/tab-switcher';

import { CustomizationEmptyState } from '@/features/settings/components/customization-empty-state';
import { EditorPreview } from '@/features/settings/components/editor-preview';
import { TypographyRow } from '@/features/settings/components/typography-row';
import { TYPOGRAPHY_ROWS } from '@/features/settings/constants/typography-rows';
import { useCustomizationDraft } from '@/features/settings/hooks/use-customization-draft';

const APP_SCOPE_ID = 'app-default';

type InternalTab = 'app' | 'space';

const INTERNAL_TABS: Array<{ value: InternalTab; label: string }> = [
  { value: 'app', label: 'app level' },
  { value: 'space', label: 'space level' },
];

interface CustomizabilitySectionProps {
  onClose?: () => void;
}

const CustomizabilitySection = ({ onClose }: CustomizabilitySectionProps) => {
  const dispatch = useAppDispatch();
  const { activeSpaceId } = useFileSystem();
  const customizationState = useAppSelector((state) => state.customization);

  const spaceName = useAppSelector(selectSpaceName);
  const [activeTab, setActiveTab] = useState<InternalTab>('app');

  const {
    isDirty,
    draftOverrides,
    applyProperty,
    setScopeDraftValues,
    resetDraft,
    resetToDefaults,
    getErrorForScope,
    appHasDraft,
    spaceHasDraft,
    setIsDirty,
  } = useCustomizationDraft();

  const appProperties = useMemo(() => {
    const appSettings = customizationState.byThemeId[APP_SCOPE_ID];
    return resolveCustomizationProperties(appSettings?.properties, undefined);
  }, [customizationState.byThemeId]);

  const spaceProperties = useMemo(() => {
    const appSettings = customizationState.byThemeId[APP_SCOPE_ID];
    const spaceSettings = activeSpaceId ? customizationState.bySpaceId[activeSpaceId] : undefined;
    return resolveCustomizationProperties(appSettings?.properties, spaceSettings?.properties);
  }, [customizationState.byThemeId, customizationState.bySpaceId, activeSpaceId]);

  const handleCancel = () => {
    resetDraft();
    onClose?.();
  };

  const handleSave = () => {
    Object.entries(draftOverrides.app).forEach(([key, value]) => {
      dispatch(
        setCustomizationProperty({
          scopeType: 'theme',
          scopeId: APP_SCOPE_ID,
          property: {
            key: key as CustomizationPropertyKey,
            value,
            valueType: key.endsWith('fontSize') ? 'fontSize' : 'fontFamily',
          },
        }),
      );
    });

    if (activeSpaceId) {
      Object.entries(draftOverrides.space).forEach(([key, value]) => {
        dispatch(
          setCustomizationProperty({
            scopeType: 'space',
            scopeId: activeSpaceId,
            property: {
              key: key as CustomizationPropertyKey,
              value,
              valueType: key.endsWith('fontSize') ? 'fontSize' : 'fontFamily',
            },
          }),
        );
      });
    }

    resetDraft();
    onClose?.();
  };

  const handleReset = () => {
    resetToDefaults(activeTab, activeSpaceId);
  };

  const getVal = (key: CustomizationPropertyKey, scope: 'app' | 'space') => {
    const draft = draftOverrides[scope];
    if (draft[key] !== undefined) {
      return draft[key];
    }

    const props = scope === 'app' ? appProperties : spaceProperties;
    return props[key]?.value ?? customizationDefaultValues[key]?.value;
  };

  const getSavedForScope =
    (scope: 'app' | 'space') => (key: CustomizationPropertyKey) => {
      const props = scope === 'app' ? appProperties : spaceProperties;
      return props[key]?.value ?? customizationDefaultValues[key]?.value;
    };

  const getValForScope =
    (scope: 'app' | 'space') => (key: CustomizationPropertyKey) =>
      getVal(key, scope);

  const renderTypographyRows = (
    scope: 'app' | 'space',
    options: { scopeType: CustomizationScope; scopeId: string },
  ) => (
    <div className="divide-y divide-modal-surface-border/40">
      {TYPOGRAPHY_ROWS.map((row) => (
        <TypographyRow
          key={`${scope}-${row.label}`}
          row={row}
          scope={scope}
          scopeType={options.scopeType}
          scopeId={options.scopeId}
          getVal={getVal}
          applyProperty={applyProperty}
          setDraftValues={(updates) => setScopeDraftValues(scope, updates)}
          setDirty={() => setIsDirty(true)}
          getError={getErrorForScope(options.scopeType)}
        />
      ))}
    </div>
  );

  const renderAppLevel = () => (
    <>
      <PanelSection title="typography" description="font and size for each text element">
        {renderTypographyRows('app', { scopeType: 'theme', scopeId: APP_SCOPE_ID })}
      </PanelSection>
      <EditorPreview
        draftGetVal={getValForScope('app')}
        savedGetVal={getSavedForScope('app')}
        hasDraft={appHasDraft}
      />
    </>
  );

  const renderSpaceLevel = () => {
    if (!activeSpaceId) {
      return (
        <CustomizationEmptyState
          title="space overrides"
          description="select a space from the sidebar to edit space-level customization."
        />
      );
    }

    const spaceTitle = spaceName
      ? (
          <>
            <span className="font-normal text-modal-surface-foreground/55">overrides for </span>
            {spaceName}
          </>
        )
      : 'space overrides';

    return (
      <>
        <PanelSection title={spaceTitle} description="override app defaults for the current space">
          {renderTypographyRows('space', {
            scopeType: 'space',
            scopeId: activeSpaceId,
          })}
        </PanelSection>
        <EditorPreview
          draftGetVal={getValForScope('space')}
          savedGetVal={getSavedForScope('space')}
          hasDraft={spaceHasDraft}
        />
      </>
    );
  };

  return (
    <div className="flex h-full flex-col bg-modal-surface-bg text-modal-surface-foreground">
      <div className="flex shrink-0 justify-center items-start px-5 py-3">
        <div className="w-full max-w-135">
          <div className="flex items-center">
            <div className="flex-1" />
            <TabSwitcher
              options={INTERNAL_TABS}
              value={activeTab}
              onValueChange={setActiveTab}
              enableSwipe
              layoutId="customization-tab-pill"
            />
            <div className="flex flex-1 justify-end pr-1">
              <div
                role="button"
                onClick={() => {
                  void handleReset();
                }}
                className="text-xs font-medium text-modal-surface-foreground/40 transition-colors hover:text-modal-surface-foreground/60"
              >
                reset defaults
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        <div className="h-full overflow-y-auto px-5 pb-4 dropdown-darker-scroll">
          <div className="mx-auto w-full max-w-135 space-y-4">
            {activeTab === 'app' ? renderAppLevel() : renderSpaceLevel()}
          </div>
        </div>
      </div>

      <FooterActionBar
        hint={isDirty ? 'unsaved customization changes' : 'all customization changes saved'}
        secondaryLabel="cancel"
        onSecondaryClick={() => {
          void handleCancel();
        }}
        primaryLabel="save"
        onPrimaryClick={handleSave}
        primaryDisabled={!isDirty}
      />
    </div>
  );
};

export default CustomizabilitySection;
