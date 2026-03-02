interface CustomizationEmptyStateProps {
  title: string;
  description: string;
}

export function CustomizationEmptyState({ title, description }: CustomizationEmptyStateProps) {
  return (
    <div className="rounded-xl border border-sidebar-border/80 bg-sidebar-container-bg/85 px-4 py-5">
      <h4 className="font-sans-serif text-sm font-medium text-modal-surface-foreground/92">{title}</h4>
      <p className="mt-1 font-sans text-xs text-modal-surface-foreground/55">{description}</p>
    </div>
  );
}
