import React, { Dispatch, FC, SetStateAction } from "react";
import type { Editor } from "@tiptap/react";
import { useEditorState } from "@tiptap/react";
import { BracesIcon, CheckIcon, ChevronDown, Heading1Icon, Heading2Icon, Heading3Icon, ListIcon, ListOrdered, ListTodo, TextQuote, TypeIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, AppTooltipContent, TooltipTrigger } from "@/components/ui/tooltip";


interface NodeSelectorProps {
  editor: Editor | null;
  isOpen: boolean;
  setIsOpen: Dispatch<SetStateAction<boolean>>;
  onSelect?: () => void;
  container?: HTMLElement | null;
}

export interface BubbleMenuItem {
  name: string;
  icon: React.ElementType;
  command: () => void;
  isActive: () => boolean;
}

export const NodeSelector: FC<NodeSelectorProps> = ({
  editor,
  isOpen,
  setIsOpen,
  onSelect,
  container,
}) => {

  const editorState = useEditorState({
    editor,
    selector: (ctx) => {
      if (!editor || !ctx.editor) {
        return null;
      }

      return {
        isParagraph: ctx.editor.isActive("paragraph"),
        isBulletList: ctx.editor.isActive("bulletList"),
        isOrderedList: ctx.editor.isActive("orderedList"),
        isHeading1: ctx.editor.isActive("heading", { level: 1 }),
        isHeading2: ctx.editor.isActive("heading", { level: 2 }),
        isHeading3: ctx.editor.isActive("heading", { level: 3 }),
        isTaskItem: ctx.editor.isActive("taskItem"),
        isBlockquote: ctx.editor.isActive("blockquote"),
        isCodeBlock: ctx.editor.isActive("codeBlock"),
      };
    },
  });

  const items: BubbleMenuItem[] = [
    {
      name: "Text",
      icon: TypeIcon,
      command: () =>
        editor?.chain().focus().toggleNode("paragraph", "paragraph").run(),
      isActive: () =>
        (editorState?.isParagraph ?? false) &&
        !(editorState?.isBulletList ?? false) &&
        !(editorState?.isOrderedList ?? false),
    },
    {
      name: "Heading 1",
      icon: Heading1Icon,
      command: () => editor?.chain().focus().toggleHeading({ level: 1 }).run(),
      isActive: () => editorState?.isHeading1 ?? false,
    },
    {
      name: "Heading 2",
      icon: Heading2Icon,
      command: () => editor?.chain().focus().toggleHeading({ level: 2 }).run(),
      isActive: () => editorState?.isHeading2 ?? false,
    },
    {
      name: "Heading 3",
      icon: Heading3Icon,
      command: () => editor?.chain().focus().toggleHeading({ level: 3 }).run(),
      isActive: () => editorState?.isHeading3 ?? false,
    },
    {
      name: "To-do List",
      icon: ListTodo,
      command: () => editor?.chain().focus().toggleTaskList().run(),
      isActive: () => editorState?.isTaskItem ?? false,
    },
    {
      name: "Bullet List",
      icon: ListIcon,
      command: () => editor?.chain().focus().toggleBulletList().run(),
      isActive: () => editorState?.isBulletList ?? false,
    },
    {
      name: "Numbered List",
      icon: ListOrdered,
      command: () => editor?.chain().focus().toggleOrderedList().run(),
      isActive: () => editorState?.isOrderedList ?? false,
    },
    {
      name: "Blockquote",
      icon: TextQuote,
      command: () =>
        editor
          ?.chain()
          .focus()
          .toggleNode("paragraph", "paragraph")
          .toggleBlockquote()
          .run(),
      isActive: () => editorState?.isBlockquote ?? false,
    },
    {
      name: "Code",
      icon: BracesIcon,
      command: () => editor?.chain().focus().toggleCodeBlock().run(),
      isActive: () => editorState?.isCodeBlock ?? false,
    },
  ];

  const activeItem = items.filter((item) => item.isActive()).pop() ?? {
    name: "Multiple",
  };

  return (
    <Tooltip>
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen} modal={false}>
        <TooltipTrigger asChild>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="bubble-node-trigger h-8 gap-1 px-2 rounded-lg"
              onMouseDown={(e) => e.preventDefault()}
            >
              {activeItem?.name}
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
        </TooltipTrigger>
        <AppTooltipContent label="Turn into" />

      <DropdownMenuContent
        align="start"
        className="bubble-node-menu w-48"
        container={container}
        onCloseAutoFocus={(e) => e.preventDefault()}
      >
        {items.map((item, index) => (
          <DropdownMenuItem
            key={index}
            className="bubble-node-item"
            onMouseDown={(e) => {
              e.preventDefault();
              item.command();
              onSelect?.();
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
