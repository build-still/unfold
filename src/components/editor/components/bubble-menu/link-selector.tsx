import { Dispatch, FC, SetStateAction, useCallback } from "react";
import { useEditor } from "@tiptap/react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tooltip, AppTooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Link } from "lucide-react";
import { LinkEditorPanel } from "../link/link-editor-panel";

interface LinkSelectorProps {
  editor: ReturnType<typeof useEditor>;
  isOpen: boolean;
  setIsOpen: Dispatch<SetStateAction<boolean>>;
}

export const LinkSelector: FC<LinkSelectorProps> = ({
  editor,
  isOpen,
  setIsOpen,
}) => {
  const onLink = useCallback(
    (url: string) => {
      setIsOpen(false);
      editor.chain().focus().setLink({ href: url }).run();
    },
    [editor, setIsOpen],
  );

  return (
    <Tooltip>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <TooltipTrigger asChild>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 rounded-lg"
            >
              <Link className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
        </TooltipTrigger>
        <AppTooltipContent label="Insert link" />

        <PopoverContent align="start" className="w-auto p-2">
          <LinkEditorPanel onSetLink={onLink} />
        </PopoverContent>
      </Popover>
    </Tooltip>
  );
};
