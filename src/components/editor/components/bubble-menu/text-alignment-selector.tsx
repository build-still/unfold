import { Dispatch, FC, SetStateAction } from "react";
import type { Editor } from "@tiptap/react";
import { useEditorState } from "@tiptap/react";
import { AlignCenter, AlignJustify, AlignLeft, AlignRight } from "lucide-react";
import { EditorBubbleDropdown, type BubbleDropdownItem } from "@/components/molecules/editor-bubble-dropdown";

interface TextAlignmentProps {
  editor: Editor | null;
  isOpen: boolean;
  setIsOpen: Dispatch<SetStateAction<boolean>>;
  container?: HTMLElement | null;
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

  const items: BubbleDropdownItem[] = [
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
    <EditorBubbleDropdown
      isOpen={isOpen}
      setIsOpen={setIsOpen}
      items={items}
      tooltipLabel="Align"
      trigger={<activeItem.icon className="h-4 w-4" />}
      container={container}
      contentClassName="w-40"
    />
  );
};
