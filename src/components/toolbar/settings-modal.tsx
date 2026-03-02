import { GlobeIcon, PaletteIcon, PrinterIcon, SlidersHorizontalIcon, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { ComponentType } from 'react';

import { PanelCard } from '@/components/atoms/panel-card';
import { SelectableRow } from '@/components/atoms/selectable-row';
import { ChoiceRow } from '@/components/molecules/choice-row';
import { FooterActionBar } from '@/components/molecules/footer-action-bar';
import { FormField } from '@/components/molecules/form-field';
import { FilterToggleCard } from '@/components/molecules/filter-toggle-card';
import CustomizabilitySection from '@/components/settings/customizability-section';
import { Modal } from '@/components/ui/modal';
import { ThemePreference, useTheme } from '@/contexts/ThemeContext';
import { cn } from '@/lib/tiptap-utils';
import { PrintScope } from '@/utils/print';
import type { ImportExtractionOptions } from '@/utils/web-import';

interface SettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  printScope: PrintScope;
  onScopeChange: (scope: PrintScope) => void;
  printableCount: number;
  isExporting: boolean;
  hasActiveFile: boolean;
  onImportFromWebsite: (url: string, options: ImportExtractionOptions) => Promise<void>;
  onImportFromHtml: (html: string, sourceUrl: string | undefined, options: ImportExtractionOptions) => Promise<void>;
  isImporting: boolean;
  importError: string | null;
  onExport: () => void;
}

const defaultImportState = {
  websiteUrl: '',
  includeFooter: false,
  includeImages: true,
  localError: null as string | null,
};

export function SettingsModal({
  open,
  onOpenChange,
  printScope,
  onScopeChange,
  printableCount,
  isExporting,
  hasActiveFile,
  onImportFromWebsite,
  isImporting,
  importError,
  onExport,
}: SettingsModalProps) {

  const { theme, setTheme } = useTheme();
  const websiteUrlInputRef = useRef<HTMLInputElement | null>(null);
  const [activeSection, setActiveSection] = useState<
    'export' | 'import' | 'appearance' | 'customizability'
  >('export');
  const [importState, setImportState] = useState(defaultImportState);

  const setImportField = <K extends keyof typeof importState>(key: K, value: (typeof importState)[K]) =>
    setImportState((prev) => ({ ...prev, [key]: value }));

  useEffect(() => {
    if (!open) {
      setActiveSection('export');
      setImportState(defaultImportState);
    }
  }, [open]);

  useEffect(() => {
    if (open && activeSection === 'import') {
      websiteUrlInputRef.current?.focus();
    }
  }, [activeSection, open]);

  const scopeOptions: Array<{
    value: PrintScope;
    title: string;
    subtitle: string;
    disabled?: boolean;
  }> = [
    { value: 'current', title: 'current file', subtitle: 'print only this file', disabled: !hasActiveFile },
    { value: 'branch', title: 'current + children', subtitle: 'print this file and nested files', disabled: !hasActiveFile },
    { value: 'space', title: 'whole space', subtitle: 'print every file in the space', disabled: printableCount === 0 },
  ];

  const appearanceOptions: Array<{
    value: ThemePreference;
    title: string;
    subtitle: string;
  }> = [
    { value: 'dark', title: 'dark', subtitle: 'always use dark mode' },
    { value: 'light', title: 'light', subtitle: 'always use light mode' },
    { value: 'system', title: 'system', subtitle: 'follow your device setting' },
  ];


  const sections: Array<{
    id: 'export' | 'import' | 'appearance' | 'customizability';
    label: string;
    icon: ComponentType<{ size?: number }>;
  }> = [
    { id: 'export', label: 'export', icon: PrinterIcon },
    { id: 'import', label: 'import', icon: GlobeIcon },
    { id: 'appearance', label: 'appearance', icon: PaletteIcon },
    { id: 'customizability', label: 'customization', icon: SlidersHorizontalIcon },
  ];

  const activeSectionTitle = activeSection === 'customizability' ? 'customization' : activeSection;

  const trimmedWebsiteUrl = importState.websiteUrl.trim();
  const isWebsiteUrlValid = trimmedWebsiteUrl.length > 0 && trimmedWebsiteUrl.toLowerCase().startsWith('https://');

  const handleImportWebsite = async () => {
    if (!trimmedWebsiteUrl) {
      setImportField('localError', 'Enter a website URL that starts with https://');
      return;
    }

    if (!trimmedWebsiteUrl.toLowerCase().startsWith('https://')) {
      setImportField('localError', 'Enter a website URL that starts with https://');
      return;
    }

    setImportField('localError', null);
    await onImportFromWebsite(trimmedWebsiteUrl, {
      includeFooter: importState.includeFooter,
      includeImages: importState.includeImages,
    });
  };
  return (
    <Modal
      open={open}
      onClose={() => onOpenChange(false)}
      onCancel={() => onOpenChange(false)}
      showKeyboardHints={false}
      showClose={false}
      className={cn(
        'w-[min(92vw,1040px)] md:w-[min(54vw,1040px)] max-w-none p-0',
        'h-[74vh] overflow-hidden',
        'border-modal-surface-border/70 ring-modal-surface-border/70',
      )}
      backdropClassName="bg-sidebar/50"
    >
      <div className="grid h-full min-h-0 select-none grid-cols-1 md:grid-cols-[216px_1fr]">
        <aside className="flex min-h-0 flex-col border-b border-sidebar-container-border/80 bg-sidebar-container-bg p-3 md:border-b-0 md:border-r">
          <p className="mb-3.5 px-2 font-sans text-[11px] font-medium tracking-wide text-sidebar-foreground/50">
            settings
          </p>
          <div className="space-y-0.5">
            {sections.map((section) => {
              const selected = activeSection === section.id;
              const Icon = section.icon;

              return (
                <SelectableRow
                  key={section.id}
                  as="div"
                  role="button"
                  tabIndex={0}
                  aria-current={selected ? 'page' : undefined}
                  onClick={() => setActiveSection(section.id)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      setActiveSection(section.id);
                    }
                  }}
                  selected={selected}
                  className="group/space relative w-full px-3 py-1.5 font-normal leading-tight"
                  selectedClassName="bg-sidebar-item-hover-bg/80 text-foreground border-border-elevated"
                  unselectedClassName="bg-transparent border-transparent text-sidebar-foreground/90 hover:text-foreground hover:bg-sidebar-item-hover-bg/45"
                  leading={<Icon size={12} />}
                >
                  <span className="flex-1 min-w-0 truncate select-none font-sans-serif text-sm text-inherit">{section.label}</span>
                </SelectableRow>
              );
            })}
          </div>
        </aside>

        <section className="flex min-h-0 flex-col">
          <header className="flex items-center justify-between border-b border-modal-surface-border/70 px-5 py-3">
            <h2 className="font-sans-serif text-[1.18rem] font-medium leading-tight tracking-tight text-modal-surface-foreground">
              {activeSectionTitle}
            </h2>
            <button
              type="button"
              aria-label="Close modal"
              onClick={() => onOpenChange(false)}
              className="inline-flex size-8 items-center justify-center rounded-full text-sidebar-foreground/80 hover:text-sidebar-foreground hover:bg-sidebar-icon-hover-bg transition-colors"
            >
              <X size={16} />
            </button>
          </header>

          <div
            className={cn(
              'flex-1 min-h-0',
              activeSection === 'customizability' ? 'overflow-hidden px-0 py-0' : 'overflow-y-auto px-5 py-4',
            )}
          >
            {activeSection === 'export' ? (
              <div className="mx-auto w-full max-w-135 space-y-2.5">
                <div className="w-full px-3.5">
                  <p className="whitespace-nowrap text-right font-sans text-[0.82rem] font-medium tracking-[0.02em] text-modal-surface-foreground/92">
                    print scope
                  </p>
                </div>

                <div className="space-y-3">
                  <PanelCard>
                    {scopeOptions.map((option, index) => {
                      const selected = printScope === option.value;
                      return (
                        <ChoiceRow
                          key={option.value}
                          disabled={option.disabled}
                          onClick={() => onScopeChange(option.value)}
                          selected={selected}
                          title={option.title}
                          subtitle={option.subtitle}
                          showDivider={index < scopeOptions.length - 1}
                        />
                      );
                    })}
                  </PanelCard>
                </div>
              </div>
            ) : activeSection === 'import' ? (
              <div className="mx-auto w-full max-w-135 space-y-2.5">
                <div className="w-full px-3.5">
                  <p className="whitespace-nowrap text-right font-sans text-[0.82rem] font-medium tracking-[0.02em] text-modal-surface-foreground/92">
                    from website
                  </p>
                </div>

                <div className="w-full px-3.5">
                  <PanelCard className="bg-sidebar-item-hover-bg/10 ring-1 ring-modal-surface-border/30">
                    <div className="space-y-2.5 px-3.5 py-3">
                      <FormField
                        label="website url"
                        error={importState.localError}
                        labelClassName="text-modal-surface-foreground/92"
                      >
                        <input
                          ref={websiteUrlInputRef}
                          type="text"
                          value={importState.websiteUrl}
                          onChange={(event) => {
                            const value = event.target.value;
                            setImportField('websiteUrl', value);
                            if (importState.localError) {
                              setImportField('localError', null);
                            }
                          }}
                          placeholder="https://example.com/article"
                          className={cn(
                            'w-full rounded-xl border border-modal-surface-border/50 bg-sidebar-container-bg px-3 py-2',
                            'font-sans text-[0.82rem] text-modal-surface-foreground/92',
                            'placeholder:text-[0.76rem] placeholder:font-normal placeholder:text-modal-surface-foreground/48',
                            'focus:outline-none focus:ring-0 focus-visible:ring-0 focus:border-modal-surface-border/80',
                          )}
                        />
                      </FormField>

                      <div className="space-y-2">
                        <p className="font-sans text-[0.82rem] font-medium tracking-[0.02em] text-modal-surface-foreground/92">
                          import filters
                        </p>
                        <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                          <FilterToggleCard
                            title="include footer"
                            subtitle="keep footer notes and links"
                            selected={importState.includeFooter}
                            onClick={() => setImportField('includeFooter', !importState.includeFooter)}
                          />

                          <FilterToggleCard
                            title="include images"
                            subtitle="keep inline media from article body"
                            selected={importState.includeImages}
                            onClick={() => setImportField('includeImages', !importState.includeImages)}
                          />
                        </div>
                      </div>
                    </div>
                  </PanelCard>
                </div>

                {importError ? (
                  <p className="font-sans text-[0.75rem] text-red-400">{importError}</p>
                ) : null}
              </div>
            ) : activeSection === 'customizability' ? (
              <div className="h-full min-h-0">
                <CustomizabilitySection onClose={() => onOpenChange(false)} />
              </div>
            ) : (
              <div className="mx-auto w-full max-w-135 space-y-2.5">
                <div className="w-full px-3.5">
                  <p className="whitespace-nowrap text-right font-sans text-[0.82rem] font-medium tracking-[0.02em] text-modal-surface-foreground/92">
                    color theme
                  </p>
                </div>

                <div className="space-y-3">
                  <PanelCard>
                    {appearanceOptions.map((option, index) => {
                      const selected = theme === option.value;

                      return (
                        <ChoiceRow
                          key={option.value}
                          onClick={() => setTheme(option.value)}
                          selected={selected}
                          title={option.title}
                          subtitle={option.subtitle}
                          showDivider={index < appearanceOptions.length - 1}
                        />
                      );
                    })}
                  </PanelCard>
                </div>

              </div>
            )}
          </div>

          {activeSection === 'export' ? (
            <FooterActionBar
              hint={printableCount ? `${printableCount} file${printableCount === 1 ? '' : 's'} ready` : 'pick what to export'}
              primaryLabel={isExporting ? 'exporting...' : 'export pdf'}
              onPrimaryClick={onExport}
              primaryDisabled={isExporting || printableCount === 0 || (!hasActiveFile && printScope !== 'space')}
            />
          ) : activeSection === 'import' ? (
            <FooterActionBar
              hint="this creates a new file from extracted content"
              primaryLabel={isImporting ? 'importing...' : 'import from website'}
              onPrimaryClick={handleImportWebsite}
              primaryDisabled={!isWebsiteUrlValid || isImporting}
            />
          ) : activeSection === 'customizability' ? null : (
            <FooterActionBar
              hint="we will remember your preference"
              primaryLabel="done"
              onPrimaryClick={() => onOpenChange(false)}
            />
          )}
        </section>
      </div>
    </Modal>
  );
}
