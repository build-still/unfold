import React, { Dispatch, FC, SetStateAction } from "react";
import type { Editor } from "@tiptap/react";
import { useEditorState } from "@tiptap/react";
import { AlignCenter, AlignJustify, AlignLeft, AlignRight, CheckIcon, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Tooltip, AppTooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface TextAlignmentProps {
  editor: Editor | null;
  isOpen: boolean;
  setIsOpen: Dispatch<SetStateAction<boolean>>;
  container?: HTMLElement | null;
}

export interface BubbleMenuItem {
  name: string;
  icon: React.ElementType;
  command: () => void;
  isActive: () => boolean;
}

export const TextAlignmentSelector: FC<TextAlignmentProps> = ({
  editor,
  isOpen,
  setIsOpen,
  container,
}) => {

  const editorState = useEditorState({
    editor,
    selector: (ctx) => {
      if (!ctx.editor) {
        return null;
      }

      return {
        isAlignLeft: ctx.editor.isActive({ textAlign: "left" }),
        isAlignCenter: ctx.editor.isActive({ textAlign: "center" }),
        isAlignRight: ctx.editor.isActive({ textAlign: "right" }),
        isAlignJustify: ctx.editor.isActive({ textAlign: "justify" }),
      };
    },
  });

  if (!editor || !editorState) {
    return null;
  }

  const items: BubbleMenuItem[] = [
    {
      name: "Align left",
      isActive: () => editorState?.isAlignLeft,
      command: () => editor.commands.setTextAlign("left"),
      icon: AlignLeft,
    },
    {
      name: "Align center",
      isActive: () => editorState?.isAlignCenter,
      command: () => editor.commands.setTextAlign("center"),
      icon: AlignCenter,
    },
    {
      name: "Align right",
      isActive: () => editorState?.isAlignRight,
      command: () => editor.commands.setTextAlign("right"),
      icon: AlignRight,
    },
    {
      name: "Justify",
      isActive: () => editorState?.isAlignJustify,
      command: () => editor.commands.setTextAlign("justify"),
      icon: AlignJustify,
    },
  ];

  const activeItem = items.filter((item) => item.isActive()).pop() ?? items[0];

  return (
    <Tooltip>
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen} modal={false}>
        <TooltipTrigger asChild>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 gap-1 px-2 rounded-lg"
              onMouseDown={(e) => e.preventDefault()}
            >
              <activeItem.icon className="h-4 w-4" />
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
        </TooltipTrigger>
        <AppTooltipContent label="Align" />

      <DropdownMenuContent 
        align="start" 
        className="w-40"
        container={container}
        onCloseAutoFocus={(e) => e.preventDefault()}
      >
        {items.map((item, index) => (
          <DropdownMenuItem
            key={index}
            onMouseDown={(e) => {
              e.preventDefault();
              item.command();
            }}
            onSelect={(e) => e.preventDefault()}
          >
            <item.icon className="h-4 w-4" />
            <span className="flex-1">{item.name}</span>
            {activeItem.name === item.name && <CheckIcon className="h-4 w-4 text-primary" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
    </Tooltip>
  );
};
