import React, { useCallback, useMemo, useState } from 'react';

import { customizationDefaultValues } from '@/config/customizationDefaults';
import FontPicker from '@/components/settings/controls/FontPicker';
import { Button } from '@/components/ui/button';
import { useFileSystem } from '@/contexts/FileSystemContext';
import { useLayout } from '@/contexts/LayoutContext';
import { cn } from '@/lib/utils';
import { resetCustomizationSettings, setCustomizationProperty } from '@/store/customizationSlice';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { selectSpaceName } from '@/store/selectors';
import { resolveCustomizationProperties } from '@/services/customizationResolver';
import type {
  CustomizationPropertyKey,
  CustomizationScope,
} from '@/types/customization';
import { isValidFontFamily, isValidFontSize } from '@/utils/customizationValidation';

import { RotateCcw } from 'lucide-react';
import { Ripple } from '@/components/ui/ripple';
import { Slider } from '@/components/ui/slider';
import { TabSwitcher } from '@/components/ui/tab-switcher';

const APP_SCOPE_ID = 'app-default';

type DraftOverrides = Partial<Record<CustomizationPropertyKey, string | number>>;
interface DraftState { app: DraftOverrides; space: DraftOverrides; }
const EMPTY_DRAFT: DraftState = { app: {}, space: {} };

const HEADING_SCALE_MIN = 14; // paragraph default
const HEADING_SCALE_MAX = 52; // title default

/* ─── Notion-style paired font + size rows ─── */

interface TypeRow {
  label: string;
  fontKey: CustomizationPropertyKey;
  sizeKey: CustomizationPropertyKey;
  monospaceOnly?: boolean;
}

const TYPE_ROWS: TypeRow[] = [
  { label: 'title', fontKey: 'title.fontFamily', sizeKey: 'title.fontSize' },
  { label: 'heading', fontKey: 'h1.fontFamily', sizeKey: 'h1.fontSize' },
  { label: 'paragraph', fontKey: 'editor.fontFamily', sizeKey: 'editor.fontSize' },
  { label: 'code block', fontKey: 'code.fontFamily', sizeKey: 'code.fontSize', monospaceOnly: true },
];

const HEADING_FONT_KEYS: CustomizationPropertyKey[] = ['h1.fontFamily', 'h2.fontFamily', 'h3.fontFamily'];
const HEADING_SIZE_KEYS: CustomizationPropertyKey[] = ['h1.fontSize', 'h2.fontSize', 'h3.fontSize'];

/* ─── Reusable sub-components ─── */

interface SectionProps {
  title: React.ReactNode;
  description?: string;
  children: React.ReactNode;
}

const Section: React.FC<SectionProps> = ({ title, description, children }) => (
  <div className="overflow-hidden rounded-xl border border-modal-surface-border/55 bg-sidebar-container-bg">
    <div className="space-y-0.5 border-b border-modal-surface-border/45 bg-sidebar-item-hover-bg/35 px-3.5 py-2.5">
      <h4 className="font-sans-serif text-sm font-medium text-modal-surface-foreground/92">{title}</h4>
      {description && (
        <p className="font-sans text-xs text-modal-surface-foreground/70">{description}</p>
      )}
    </div>
    <div className="px-3.5 py-3">{children}</div>
  </div>
);

interface SizeSliderChipProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
}

const SizeSliderChip: React.FC<SizeSliderChipProps> = ({ label, value, onChange, min, max }) => (
  <div className="space-y-1.5">
    <div className="flex items-center justify-between pl-2.5">
      <span className="text-[10px] font-medium text-modal-surface-foreground/65">{label}</span>
      <span className="text-[10px] tabular-nums font-medium text-modal-surface-foreground/80">{value}px</span>
    </div>
    <div
      className={cn(
        'flex h-8 w-full items-center gap-2 rounded-none border-b border-modal-surface-border/75',
        'bg-sidebar-container-bg/90 px-2.5',
      )}
    >
      <span className="shrink-0 text-[9px] tabular-nums text-modal-surface-foreground/55">{min}</span>
      <Slider
        min={min}
        max={max}
        step={1}
        value={[value]}
        onValueChange={([v]) => onChange(v)}
        className="flex-1"
      />
      <span className="shrink-0 text-[9px] tabular-nums text-modal-surface-foreground/55">{max}</span>
    </div>
  </div>
);


interface EditorPreviewProps {
  draftGetVal: (key: CustomizationPropertyKey) => string | number | undefined;
  savedGetVal: (key: CustomizationPropertyKey) => string | number | undefined;
  hasDraft: boolean;
}

function renderDoc(
  getV: (key: CustomizationPropertyKey) => string | number | undefined,
) {
  const titleFont = String(getV('title.fontFamily'));
  const titleSize = Number(getV('title.fontSize'));
  const h1Font    = String(getV('h1.fontFamily'));
  const h1Size    = Number(getV('h1.fontSize'));
  const h2Size    = Number(getV('h2.fontSize'));
  const h3Size    = Number(getV('h3.fontSize'));
  const paraFont  = String(getV('editor.fontFamily'));
  const paraSize  = Number(getV('editor.fontSize'));
  const codeFont  = String(getV('code.fontFamily'));
  const codeSize  = Number(getV('code.fontSize'));

  return (
    <div className="space-y-1">
      <p style={{ fontFamily: titleFont, fontSize: titleSize }} className="leading-tight text-foreground/90 font-bold">
        document title
      </p>
      <div className="pt-2 space-y-0.5">
        <p style={{ fontFamily: h1Font, fontSize: h1Size }} className="leading-snug text-foreground/87 font-semibold">heading 1</p>
        <p style={{ fontFamily: h1Font, fontSize: h2Size }} className="leading-snug text-foreground/83 font-semibold">heading 2</p>
        <p style={{ fontFamily: h1Font, fontSize: h3Size }} className="leading-snug text-foreground/80 font-semibold">heading 3</p>
      </div>
      <p style={{ fontFamily: paraFont, fontSize: paraSize }} className="leading-relaxed text-foreground/70 pt-1">
        the quick brown fox jumps over the lazy dog. a calmer window for your thoughts.
      </p>
      <pre
        style={{ fontFamily: codeFont, fontSize: codeSize }}
        className="leading-relaxed text-editor-code-block-text bg-code-block-bg border border-editor-code-block-border rounded-md px-2.5 py-1.5 mt-1 overflow-x-auto whitespace-pre"
      >{`const thought = 'unfold it';
console.log(thought);`}</pre>
    </div>
  );
}

const EditorPreview: React.FC<EditorPreviewProps> = ({ draftGetVal, savedGetVal, hasDraft }) => {
  const [mode, setMode] = useState<'after' | 'before'>('after');
  const activeGetVal = mode === 'after' ? draftGetVal : savedGetVal;

  return (
    <div className="overflow-hidden rounded-xl border border-modal-surface-border/40 bg-sidebar-container-bg">
      <div className="flex items-center justify-between border-b border-modal-surface-border/45 bg-sidebar-item-hover-bg/35 px-3.5 py-2.5">
        <div className="space-y-0.5">
          <h4 className="font-sans-serif text-sm font-medium text-modal-surface-foreground/92">preview</h4>
          <p className="font-sans text-xs text-modal-surface-foreground/70">how your typography will look in the editor</p>
        </div>
        <TabSwitcher
          options={[
            { value: 'after', label: 'after' },
            { 
              value: 'before', 
              label: 'before', 
              disabled: !hasDraft,
              tooltip: !hasDraft ? 'make changes to see before/after' : undefined
            },
          ]}
          value={mode}
          onValueChange={(v) => setMode(v as 'after' | 'before')}
          enableSwipe={false}
          layoutId="preview-tab-pill"
        />
      </div>
      <div className="overflow-y-auto max-h-72 px-5 py-5 dropdown-darker-scroll">
        {renderDoc(activeGetVal)}
      </div>
    </div>
  );
};

/* ─── Helpers ─── */

/* ─── Main component ─── */

type InternalTab = 'app' | 'space';

const INTERNAL_TABS: Array<{ value: InternalTab; label: string }> = [
  { value: 'app', label: 'app level' },
  { value: 'space', label: 'space level' },
];

interface CustomizabilitySectionProps {
  onClose?: () => void;
}

const CustomizabilitySection: React.FC<CustomizabilitySectionProps> = ({ onClose }) => {
  const dispatch = useAppDispatch();
  const { activeSpaceId } = useFileSystem();
  const { updateLayout, isLoading: isUpdatingLayout } = useLayout();
  const customizationState = useAppSelector((state) => state.customization);

  const spaceName = useAppSelector(selectSpaceName);
  const [activeTab, setActiveTab] = useState<InternalTab>('app');

  const [isDirty, setIsDirty] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Draft overrides: pending changes not yet committed to Redux
  const [draftOverrides, setDraftOverrides] = useState<DraftState>(EMPTY_DRAFT);

  const appProperties = useMemo(() => {
    const appSettings = customizationState.byThemeId[APP_SCOPE_ID];
    return resolveCustomizationProperties(appSettings?.properties, undefined);
  }, [customizationState.byThemeId]);

  const spaceProperties = useMemo(() => {
    const appSettings = customizationState.byThemeId[APP_SCOPE_ID];
    const spaceSettings = activeSpaceId ? customizationState.bySpaceId[activeSpaceId] : undefined;
    return resolveCustomizationProperties(appSettings?.properties, spaceSettings?.properties);
  }, [customizationState.byThemeId, customizationState.bySpaceId, activeSpaceId]);

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

      // Write to draft only — no live Redux dispatch
      const draftScope = scopeType === 'theme' ? 'app' : 'space';
      setDraftOverrides((prev) => ({
        ...prev,
        [draftScope]: { ...prev[draftScope], [key]: value },
      }));
      setIsDirty(true);
    },
    [],
  );

  const handleCancel = () => {
    // Discard all pending draft changes — Redux was never touched
    setDraftOverrides(EMPTY_DRAFT);
    setErrors({});
    setIsDirty(false);
    onClose?.();
  };

  const handleSave = () => {
    // Commit all draft overrides to Redux in one batch
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
    setDraftOverrides(EMPTY_DRAFT);
    setIsDirty(false);
    onClose?.();
  };

  const handleReset = async () => {
    // Reset dispatches directly to Redux (intentional full wipe) and clears the draft
    if (activeTab === 'app') {
      dispatch(resetCustomizationSettings({ scopeType: 'theme', scopeId: APP_SCOPE_ID }));
      await updateLayout({ sidebar_position: 'left' });
      setDraftOverrides((prev) => ({ ...prev, app: {} }));
    } else if (activeTab === 'space' && activeSpaceId) {
      dispatch(resetCustomizationSettings({ scopeType: 'space', scopeId: activeSpaceId }));
      setDraftOverrides((prev) => ({ ...prev, space: {} }));
    }
    setErrors({});
    setIsDirty(true);
  };

  const getVal = (key: CustomizationPropertyKey, scope: 'app' | 'space') => {
    // Draft overrides take priority over committed Redux state
    const draft = draftOverrides[scope];
    if (draft[key] !== undefined) return draft[key];
    const props = scope === 'app' ? appProperties : spaceProperties;
    return props[key]?.value ?? customizationDefaultValues[key]?.value;
  };

  const renderTypographyRows = (
    scope: 'app' | 'space',
    options: { scopeType: CustomizationScope; scopeId: string },
  ) => {
    const applyRowProperty = (
      row: TypeRow,
      key: CustomizationPropertyKey,
      value: string | number,
    ) => {
      if (row.label !== 'heading') {
        applyProperty(options.scopeType, options.scopeId, key, value);
        return;
      }

      if (key.endsWith('fontFamily')) {
        HEADING_FONT_KEYS.forEach((headingKey) => {
          applyProperty(options.scopeType, options.scopeId, headingKey, value);
        });
        return;
      }

      const headingMaxSize = Number(value);
      const paragraphSize = Number(getVal('editor.fontSize', scope));

      if (!Number.isFinite(headingMaxSize) || !Number.isFinite(paragraphSize)) {
        HEADING_SIZE_KEYS.forEach((headingKey) => {
          applyProperty(options.scopeType, options.scopeId, headingKey, value);
        });
        return;
      }

      if (headingMaxSize <= paragraphSize) {
        HEADING_SIZE_KEYS.forEach((headingKey) => {
          applyProperty(options.scopeType, options.scopeId, headingKey, headingMaxSize);
        });
        return;
      }

      const scaledH2 = Math.round((headingMaxSize + paragraphSize) / 2);
      const scaledSizes: number[] = [headingMaxSize, scaledH2, paragraphSize];

      HEADING_SIZE_KEYS.forEach((headingKey, index) => {
        applyProperty(options.scopeType, options.scopeId, headingKey, scaledSizes[index]);
      });
    };

    // Title size floor: must stay >= current h1 size
    const titleMinSize = Number(getVal('h1.fontSize', scope));

    const resetRow = (row: TypeRow) => {
      if (row.label === 'heading') {
        const updates: DraftOverrides = {};
        HEADING_FONT_KEYS.forEach((k) => { updates[k] = customizationDefaultValues[k]?.value; });
        HEADING_SIZE_KEYS.forEach((k) => { updates[k] = customizationDefaultValues[k]?.value; });
        setDraftOverrides((prev) => ({ ...prev, [scope]: { ...prev[scope], ...updates } }));
      } else {
        setDraftOverrides((prev) => ({
          ...prev,
          [scope]: {
            ...prev[scope],
            [row.fontKey]: customizationDefaultValues[row.fontKey]?.value,
            [row.sizeKey]: customizationDefaultValues[row.sizeKey]?.value,
          },
        }));
      }
      setIsDirty(true);
    };

    const isRowCustomized = (row: TypeRow): boolean => {
      if (row.label === 'heading') {
        return [...HEADING_FONT_KEYS, ...HEADING_SIZE_KEYS].some(
          (k) => getVal(k, scope) !== customizationDefaultValues[k]?.value,
        );
      }
      return (
        getVal(row.fontKey, scope) !== customizationDefaultValues[row.fontKey]?.value ||
        getVal(row.sizeKey, scope) !== customizationDefaultValues[row.sizeKey]?.value
      );
    };

    return (
    <div className="divide-y divide-modal-surface-border/40">
      {TYPE_ROWS.map((row) => (
        <div key={`${scope}-${row.label}`} className="grid w-full grid-cols-[minmax(0,1fr)_120px_20px] items-end gap-3 py-3 first:pt-0 last:pb-0">
          <FontPicker
            key={`${scope}-${row.fontKey}`}
            label={row.label}
            value={String(getVal(row.fontKey, scope))}
            onChange={(v) => applyRowProperty(row, row.fontKey, v)}
            error={errors[`${options.scopeType}.${row.fontKey}`]}
            monospaceOnly={row.monospaceOnly}
          />
          {row.label === 'heading' ? (
            <SizeSliderChip
              key={`${scope}-${row.sizeKey}`}
              label="scale"
              value={Number(getVal('h1.fontSize', scope))}
              onChange={(v) => applyRowProperty(row, row.sizeKey, v)}
              min={HEADING_SCALE_MIN}
              max={HEADING_SCALE_MAX}
            />
          ) : (
            <SizeSliderChip
              key={`${scope}-${row.sizeKey}`}
              label="size"
              value={Number(getVal(row.sizeKey, scope))}
              onChange={(v) => applyRowProperty(row, row.sizeKey, v)}
              min={row.label === 'title' ? Math.max(24, titleMinSize) : 10}
              max={row.label === 'title' ? 72 : 32}
            />
          )}
          <div className="flex items-end pb-1.5">
            <button
              type="button"
              title={`reset ${row.label} to default`}
              onClick={() => resetRow(row)}
              disabled={!isRowCustomized(row)}
              className={cn(
                'inline-flex items-center justify-center size-5 rounded transition-all duration-150',
                'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-button-ring',
                isRowCustomized(row)
                  ? 'text-modal-surface-foreground/45 hover:text-modal-surface-foreground/80 cursor-pointer'
                  : 'text-modal-surface-foreground/18 cursor-default',
              )}
            >
              <RotateCcw size={11} />
            </button>
          </div>
        </div>
      ))}
    </div>
    );
  };

  const getValForScope = (scope: 'app' | 'space') =>
    (key: CustomizationPropertyKey) => getVal(key, scope);

  // Saved (committed Redux, no draft) getter for the before/after toggle
  const getSavedForScope = (scope: 'app' | 'space') =>
    (key: CustomizationPropertyKey) => {
      const props = scope === 'app' ? appProperties : spaceProperties;
      return props[key]?.value ?? customizationDefaultValues[key]?.value;
    };

  const appHasDraft = Object.keys(draftOverrides.app).length > 0;
  const spaceHasDraft = Object.keys(draftOverrides.space).length > 0;

  const renderAppLevel = () => (
    <>
      <Section title="typography" description="font and size for each text element">
        {renderTypographyRows('app', { scopeType: 'theme', scopeId: APP_SCOPE_ID })}
      </Section>
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
        <div className="rounded-xl border border-sidebar-border/80 bg-sidebar-container-bg/85 px-4 py-5">
          <h4 className="font-sans-serif text-sm font-medium text-modal-surface-foreground/92">space overrides</h4>
          <p className="mt-1 font-sans text-xs text-modal-surface-foreground/55">
            select a space from the sidebar to edit space-level customization.
          </p>
        </div>
      );
    }

    const spaceTitle = spaceName
      ? (<><span className="font-normal text-modal-surface-foreground/55">overrides for </span>{spaceName}</>
      ) : 'space overrides';
    return (
      <>
        <Section title={spaceTitle} description="override app defaults for the current space">
          {renderTypographyRows('space', {
            scopeType: 'space',
            scopeId: activeSpaceId,
          })}
        </Section>
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
                onClick={() => { void handleReset(); }}
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

      <footer className="flex items-center justify-between gap-4 border-t border-modal-surface-border/70 px-5 py-3">
        <p className="font-sans text-xs italic text-modal-surface-foreground/55">
          {isDirty ? 'unsaved customization changes' : 'all customization changes saved'}
        </p>
        <div className="flex items-center gap-2">
          <Button
            role="button"
            variant={"transparent"}
            onClick={() => { void handleCancel(); }}
            disabled={isUpdatingLayout}
            className={cn(
              'cursor-pointer px-3 py-2 text-xs font-medium rounded-lg',
              'text-modal-surface-foreground/62 hover:text-modal-surface-foreground/90 hover:bg-sidebar-item-hover-bg/30',
              'transition-all duration-150 disabled:cursor-not-allowed disabled:opacity-40 font-sans-serif',
            )}
          >
            cancel
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            variant="outline"
            size="lg"
            disabled={!isDirty}
            className={cn(
              'cursor-pointer relative overflow-hidden justify-start gap-2 px-3 py-2 text-sm font-semibold',
              'text-sidebar-foreground bg-sidebar-item-hover-bg/60 border-2 border-sidebar-border/70 hover:bg-sidebar-item-hover-bg/80',
              'transition-all duration-200 w-fit disabled:cursor-not-allowed disabled:opacity-40',
            )}
          >
            <span className="relative z-10 inline-flex items-center gap-2 font-sans-serif">save</span>
            <Ripple
              duration={1200}
              color="color-mix(in srgb, var(--sidebar-item-hover-bg) 82%, transparent)"
            />
          </Button>
        </div>
      </footer>
    </div>
  );
};

export default CustomizabilitySection;
