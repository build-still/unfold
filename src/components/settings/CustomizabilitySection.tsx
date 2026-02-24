import React, { useCallback, useMemo, useRef, useState } from 'react';
import { motion, type PanInfo } from 'motion/react';

import { customizationDefaultValues } from '@/config/customizationDefaults';
import FontPicker from '@/components/settings/controls/FontPicker';
import { Button } from '@/components/ui/button';
import { useFileSystem } from '@/contexts/FileSystemContext';
import { useLayout } from '@/contexts/LayoutContext';
import { cn } from '@/lib/utils';
import { replaceCustomizationState, resetCustomizationSettings, setCustomizationProperty } from '@/store/customizationSlice';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { selectSpaceName } from '@/store/selectors';
import { resolveCustomizationProperties } from '@/services/customizationResolver';
import type {
  CustomizationPropertyKey,
  CustomizationScope,
  CustomizationState,
} from '@/types/customization';
import type { SidebarPosition } from '@/types/layout';
import { isValidFontFamily, isValidFontSize } from '@/utils/customizationValidation';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ChevronsUpDown } from 'lucide-react';
import { Ripple } from '@/components/ui/ripple';

const APP_SCOPE_ID = 'app-default';
const FONT_SIZE_OPTIONS = [11, 12, 13, 14, 15, 16, 18, 20, 22, 24, 28, 32, 36, 40, 48, 52, 56] as const;

/* ─── Notion-style paired font + size rows ─── */

interface TypeRow {
  label: string;
  fontKey: CustomizationPropertyKey;
  sizeKey: CustomizationPropertyKey;
}

const TYPE_ROWS: TypeRow[] = [
  { label: 'title', fontKey: 'title.fontFamily', sizeKey: 'title.fontSize' },
  { label: 'heading', fontKey: 'h1.fontFamily', sizeKey: 'h1.fontSize' },
  { label: 'paragraph', fontKey: 'editor.fontFamily', sizeKey: 'editor.fontSize' },
  { label: 'code block', fontKey: 'code.fontFamily', sizeKey: 'code.fontSize' },
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
  <div className="overflow-hidden rounded-xl border border-modal-surface-border/75 bg-sidebar-container-bg">
    <div className="space-y-0.5 border-b border-modal-surface-border/55 bg-sidebar-item-hover-bg/50 px-3.5 py-2.5">
      <h4 className="font-sans-serif text-sm font-medium text-modal-surface-foreground/92">{title}</h4>
      {description && (
        <p className="font-sans text-xs text-modal-surface-foreground/70">{description}</p>
      )}
    </div>
    <div className="px-3.5 py-3">{children}</div>
  </div>
);

interface SizeChipProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  error?: string;
}

const SizeChip: React.FC<SizeChipProps> = ({ label, value, onChange, error }) => (
  <div className="space-y-1.5">
    <span className="text-[10px] font-medium text-modal-surface-foreground/65">{label}</span>
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <div
          role="button"
          tabIndex={0}
          className={cn(
            'flex h-8 w-full cursor-pointer items-center justify-between rounded-md border-b border-modal-surface-border/75',
            'bg-sidebar-container-bg/90 px-2.5 text-xs text-modal-surface-foreground/85',
            'transition-colors hover:bg-sidebar-item-hover-bg/25',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-button-ring',
            error && 'border-destructive/50 ring-destructive/20',
          )}
        >
          <span className="truncate">{value}px</span>
          <ChevronsUpDown className="size-3.5 shrink-0 opacity-50" />
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        className="max-h-64 w-(--radix-dropdown-menu-trigger-width) overflow-y-auto border-modal-surface-border/75 bg-sidebar-container-bg"
      >
        {FONT_SIZE_OPTIONS.map((size) => (
          <DropdownMenuItem
            key={size}
            onClick={() => onChange(size)}
            className={cn(
              'rounded-md text-xs text-modal-surface-foreground/85',
              value === size && 'bg-sidebar-item-hover-bg/70 text-modal-surface-foreground',
            )}
          >
            {size}px
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
    {error && <p className="text-[10px] text-destructive">{error}</p>}
  </div>
);

/* ─── Helpers ─── */

function cloneCustomizationState(state: CustomizationState): CustomizationState {
  return {
    byThemeId: JSON.parse(JSON.stringify(state.byThemeId)),
    bySpaceId: JSON.parse(JSON.stringify(state.bySpaceId)),
  };
}

/* ─── Main component ─── */

type InternalTab = 'app' | 'space';

const INTERNAL_TABS: Array<{ id: InternalTab; label: string }> = [
  { id: 'app', label: 'app level' },
  { id: 'space', label: 'space level' },
];

const TAB_SWIPE_THRESHOLD = 42;

interface CustomizabilitySectionProps {
  onClose?: () => void;
}

const CustomizabilitySection: React.FC<CustomizabilitySectionProps> = ({ onClose }) => {
  const dispatch = useAppDispatch();
  const { activeSpaceId } = useFileSystem();
  const { layout, updateLayout, isLoading: isUpdatingLayout } = useLayout();
  const customizationState = useAppSelector((state) => state.customization);

  const spaceName = useAppSelector(selectSpaceName);
  const [activeTab, setActiveTab] = useState<InternalTab>('app');

  const [isDirty, setIsDirty] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const baselineCustomizationRef = useRef<CustomizationState>(cloneCustomizationState(customizationState));
  const baselineLayoutRef = useRef<SidebarPosition>(layout.sidebar_position || 'left');

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
      scopeId: string,
      key: CustomizationPropertyKey,
      value: string | number,
    ) => {
      if (!scopeId) return;

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

      dispatch(
        setCustomizationProperty({
          scopeType,
          scopeId,
          property: { key, value, valueType },
        }),
      );
      setIsDirty(true);
    },
    [dispatch],
  );

  const handleCancel = async () => {
    dispatch(replaceCustomizationState(cloneCustomizationState(baselineCustomizationRef.current)));
    await updateLayout({ sidebar_position: baselineLayoutRef.current });
    setErrors({});
    setIsDirty(false);
    onClose?.();
  };

  const handleSave = () => {
    baselineCustomizationRef.current = cloneCustomizationState(customizationState);
    baselineLayoutRef.current = layout.sidebar_position || 'left';
    setIsDirty(false);
    onClose?.();
  };

  const handleReset = async () => {
    dispatch(resetCustomizationSettings({ scopeType: 'theme', scopeId: APP_SCOPE_ID }));
    if (activeSpaceId) {
      dispatch(resetCustomizationSettings({ scopeType: 'space', scopeId: activeSpaceId }));
    }
    await updateLayout({ sidebar_position: 'left' });
    setErrors({});
    setIsDirty(true);
  };

  const activeTabIndex = useMemo(
    () => INTERNAL_TABS.findIndex((tab) => tab.id === activeTab),
    [activeTab],
  );

  const handleTabDragEnd = useCallback(
    (_event: PointerEvent | MouseEvent | TouchEvent, info: PanInfo) => {
      const offsetX = info.offset.x;

      if (Math.abs(offsetX) < TAB_SWIPE_THRESHOLD) return;

      if (offsetX < 0 && activeTabIndex < INTERNAL_TABS.length - 1) {
        setActiveTab(INTERNAL_TABS[activeTabIndex + 1].id);
        return;
      }

      if (offsetX > 0 && activeTabIndex > 0) {
        setActiveTab(INTERNAL_TABS[activeTabIndex - 1].id);
      }
    },
    [activeTabIndex],
  );

  const getVal = (key: CustomizationPropertyKey, scope: 'app' | 'space') => {
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

      const keys = key.endsWith('fontFamily') ? HEADING_FONT_KEYS : HEADING_SIZE_KEYS;
      keys.forEach((headingKey) => {
        applyProperty(options.scopeType, options.scopeId, headingKey, value);
      });
    };

    return (
    <div className="divide-y divide-modal-surface-border/40">
      {TYPE_ROWS.map((row) => (
        <div key={`${scope}-${row.label}`} className="grid w-full max-w-135 grid-cols-[minmax(0,1fr)_120px] items-end gap-3 py-3 first:pt-0 last:pb-0">
          <FontPicker
            key={`${scope}-${row.fontKey}`}
            label={row.label}
            value={String(getVal(row.fontKey, scope))}
            onChange={(v) => applyRowProperty(row, row.fontKey, v)}
            error={errors[`${options.scopeType}.${row.fontKey}`]}
          />
          <SizeChip
            key={`${scope}-${row.sizeKey}`}
            label="size"
            value={Number(getVal(row.sizeKey, scope))}
            onChange={(v) => applyRowProperty(row, row.sizeKey, v)}
            error={errors[`${options.scopeType}.${row.sizeKey}`]}
          />
        </div>
      ))}
    </div>
    );
  };

  const renderAppLevel = () => (
    <div className="space-y-4">
      <Section title="typography" description="font and size for each text element">
        {renderTypographyRows('app', { scopeType: 'theme', scopeId: APP_SCOPE_ID })}
      </Section>
    </div>
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
      <div className="space-y-4">
        <Section title={spaceTitle} description="override app defaults for the current space">
          {renderTypographyRows('space', {
            scopeType: 'space',
            scopeId: activeSpaceId,
          })}
        </Section>
      </div>
    );
  };

  return (
    <div className="flex h-full flex-col bg-modal-surface-bg text-modal-surface-foreground">
      <div className="flex shrink-0 items-center justify-between border-b border-modal-surface-border/70 bg-sidebar-container-bg/20 px-5 py-3">
        <div className="inline-flex items-center rounded-xl border border-modal-surface-border/75 bg-sidebar-container-bg/88 p-1">
          {INTERNAL_TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <motion.div
                key={tab.id}
                role="button"
                onClick={() => setActiveTab(tab.id)}
                {...(isActive
                  ? {
                      drag: 'x' as const,
                      dragConstraints: { left: 0, right: 0 },
                      dragElastic: 0.45,
                      dragMomentum: false,
                      onDragEnd: handleTabDragEnd,
                    }
                  : {})}
                className={cn(
                  'relative z-10 rounded-lg px-3 py-1 text-sm font-medium transition-colors duration-100',
                  isActive
                    ? 'text-modal-surface-foreground cursor-grab active:cursor-grabbing'
                    : 'text-modal-surface-foreground/58 hover:text-modal-surface-foreground/86',
                )}
              >
                {isActive ? (
                  <motion.span
                    layoutId="customization-tab-pill"
                    transition={{ type: 'spring', stiffness: 540, damping: 36, mass: 0.55 }}
                    className="absolute inset-0 -z-10 rounded-lg border border-modal-surface-border/70 bg-sidebar-item-hover-bg/85"
                  />
                ) : null}
                {tab.label}
              </motion.div>
            );
          })}
        </div>

        <div
          role="button"
          onClick={() => { void handleReset(); }}
          className="text-sm font-medium text-modal-surface-foreground/35 transition-colors hover:text-modal-surface-foreground/60"
        >
          reset defaults
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        <div className="h-full overflow-y-auto bg-sidebar-container-bg/15 px-5 py-4">
          <div className="mx-auto w-full max-w-6xl space-y-4">
            {activeTab === 'app' ? renderAppLevel() : renderSpaceLevel()}
          </div>
        </div>
      </div>

      <footer className="flex items-center justify-between gap-4 border-t border-modal-surface-border/80 bg-sidebar-container-bg/25 px-5 py-3">
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
