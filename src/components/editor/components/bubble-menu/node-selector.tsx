import { Dispatch, FC, SetStateAction } from "react";
import type { Editor } from "@tiptap/react";
import { useEditorState } from "@tiptap/react";
import { BracesIcon, Heading1Icon, Heading2Icon, Heading3Icon, ListIcon, ListOrdered, ListTodo, TextQuote, TypeIcon } from "lucide-react";
import { EditorBubbleDropdown, type BubbleDropdownItem } from "@/components/molecules/editor-bubble-dropdown";


interface NodeSelectorProps {
  editor: Editor | null;
  isOpen: boolean;
  setIsOpen: Dispatch<SetStateAction<boolean>>;
  onSelect?: () => void;
  container?: HTMLElement | null;
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

  const items: BubbleDropdownItem[] = [
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
    <EditorBubbleDropdown
      isOpen={isOpen}
      setIsOpen={setIsOpen}
      items={items}
      tooltipLabel="Turn into"
      trigger={<>{activeItem?.name}</>}
      container={container}
      onSelect={onSelect}
      triggerClassName="bubble-node-trigger h-8 gap-1 px-2 rounded-lg"
      contentClassName="bubble-node-menu w-48"
    />
  );
};
