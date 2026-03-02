import { Button } from '@/components/ui/button';
import { AppTooltipContent, Tooltip, TooltipTrigger } from '@/components/ui/tooltip';

interface FormatToolbarButtonProps {
  label: string;
  isActive: boolean;
  onClick: () => void;
  icon: React.ReactNode;
}

export function FormatToolbarButton({ label, isActive, onClick, icon }: FormatToolbarButtonProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          data-active={isActive}
          onClick={(event) => {
            event.preventDefault();
            onClick();
          }}
          className={`h-8 w-8 p-0 rounded-lg ${isActive ? 'bg-sidebar-item-hover-bg/95 text-foreground' : ''}`}
        >
          {icon}
        </Button>
      </TooltipTrigger>
      <AppTooltipContent label={label} />
    </Tooltip>
  );
}
