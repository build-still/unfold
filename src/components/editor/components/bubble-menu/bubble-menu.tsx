import { FC, useRef, useState, type SetStateAction } from "react";
import {
  isNodeSelection,
  useEditor,
  useEditorState,
} from "@tiptap/react";

import { BubbleMenu, BubbleMenuProps } from '@tiptap/react/menus'
import { BoldIcon, CodeIcon, ItalicIcon, StrikethroughIcon, UnderlineIcon } from "lucide-react";
import { editorClasses } from "../../styles/extension-styles";
import { Button } from "@/components/ui/button";
import { NodeSelector } from "./node-selector";
import { ButtonGroup } from "@/components/ui/button-group";
import { ColorSelector } from "./color-selector";
import { TextAlignmentSelector } from "./text-alignment-selector";
import { LinkSelector } from "./link-selector";
import { Tooltip, AppTooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export interface BubbleMenuItem {
    name: string;
    label: string;
    isActive: () => boolean;
    command: () => void;
    icon: React.ReactNode;
}
type EditorBubbleMenuProps = Omit<BubbleMenuProps, "children" | "editor"> & {
  editor: ReturnType<typeof useEditor>;
};

type OpenSelector = "node" | "link" | "color" | "alignment" | null;

interface SearchRange {
  from: number;
  to: number;
}

interface SearchStorage {
  searchTerm?: string;
  results?: SearchRange[];
}

export const EditorBubbleMenu: FC<EditorBubbleMenuProps> = (props) => {
  const [openSelector, setOpenSelector] = useState<OpenSelector>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const editorState = useEditorState({
    editor: props.editor,
    selector: (ctx) => {
      if (!props.editor) return null;
      return {
        isBold: ctx.editor.isActive("bold"),
        isItalic: ctx.editor.isActive("italic"),
        isUnderline: ctx.editor.isActive("underline"),
        isStrike: ctx.editor.isActive("strike"),
        isCode: ctx.editor.isActive("code"),
        isNodeSelection: isNodeSelection(ctx.editor.state.selection),
      };
    },
  });

  const bindSelector = (key: Exclude<OpenSelector, null>) => ({
    isOpen: openSelector === key,
    setIsOpen: (value: SetStateAction<boolean>) => {
      const nextOpen = typeof value === "function"
        ? value(openSelector === key)
        : value;
      setOpenSelector(nextOpen ? key : null);
    },
  });

  const items: BubbleMenuItem[] = [
    { name: "bold", label: "Bold", isActive: () => editorState?.isBold ?? false, command: () => props.editor.chain().focus().toggleBold().run(), icon: <BoldIcon className="h-[18px] w-[18px]" strokeWidth={2.4} /> },
    { name: "italic", label: "Italic", isActive: () => editorState?.isItalic ?? false, command: () => props.editor.chain().focus().toggleItalic().run(), icon: <ItalicIcon className="h-[18px] w-[18px]" strokeWidth={2.4} /> },
    { name: "underline", label: "Underline", isActive: () => editorState?.isUnderline ?? false, command: () => props.editor.chain().focus().toggleUnderline().run(), icon: <UnderlineIcon className="h-[18px] w-[18px]" strokeWidth={2.4} /> },
    { name: "strike", label: "Strikethrough", isActive: () => editorState?.isStrike ?? false, command: () => props.editor.chain().focus().toggleStrike().run(), icon: <StrikethroughIcon className="h-[18px] w-[18px]" strokeWidth={2.4} /> },
    { name: "code", label: "Code", isActive: () => editorState?.isCode ?? false, command: () => props.editor.chain().focus().toggleCode().run(), icon: <CodeIcon className="h-[18px] w-[18px]" strokeWidth={2.4} /> },
  ];


  if (!props.editor) return null;

  return (
    <BubbleMenu
      editor={props.editor}
      options={{ placement: "top", offset: 8, flip: true }}
      shouldShow={({ state }) => {
        const { selection } = state;
        if (selection.empty) return false;
        if (isNodeSelection(selection) && selection.node?.type.name === "image") {
          return false;
        }
        const searchStorage =
          (props.editor.storage as { searchAndReplace?: SearchStorage }).searchAndReplace ??
          undefined;
        if (searchStorage?.searchTerm && Array.isArray(searchStorage.results)) {
          const isSearchSelection = searchStorage.results.some(
            (result) => result.from === selection.from && result.to === selection.to
          );
          if (isSearchSelection) return false;
        }
        return true;
      }}
    >
      <div ref={menuRef} className={editorClasses.bubbleMenu} data-bubble-menu="true">
        <NodeSelector
          editor={props.editor}
          {...bindSelector("node")}
          container={menuRef.current}
        />

        <div className="w-px h-6 bg-border mx-1" />

        <ButtonGroup>
          {items.map((item) => (
            <Tooltip key={item.name}>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  data-active={item.isActive()}
                  onClick={(e) => {
                    e.preventDefault();
                    item.command();
                  }}
                  className={`h-8 w-8 p-0 rounded-lg ${item.isActive() ? "bg-sidebar-item-hover-bg/95 text-foreground" : ""}`}
                >
                  {item.icon}
                </Button>
              </TooltipTrigger>
              <AppTooltipContent label={item.label} />
            </Tooltip>
          ))}
        </ButtonGroup>

        <div className="w-px h-6 bg-border mx-1" />

        <LinkSelector editor={props.editor} {...bindSelector("link")} />

        <ColorSelector
          editor={props.editor}
          {...bindSelector("color")}
          container={menuRef.current}
        />

        <div className="w-px h-6 bg-border mx-1" />

        <TextAlignmentSelector
          editor={props.editor}
          {...bindSelector("alignment")}
          container={menuRef.current}
        />
      </div>
    </BubbleMenu>
  );
};
