import React from 'react';
import CustomizabilitySection from '@/components/settings/customizability-section';

interface SettingsPageProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Standalone settings page — not currently rendered by the toolbar.
 * The toolbar uses `toolbar/settings-modal.tsx` which embeds CustomizabilitySection.
 * Kept as an alternative entry-point if needed.
 */
const SettingsPage: React.FC<SettingsPageProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-overlay backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="flex w-full max-w-180 max-h-[82vh] rounded-xl border border-sidebar-container-border/80 bg-sidebar-container-bg shadow-sidebar-elevated overflow-hidden">
        <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
          <CustomizabilitySection />
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
