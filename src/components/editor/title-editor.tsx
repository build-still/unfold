import { EditorContent, useEditor } from "@tiptap/react";
import { useEffect, useRef } from "react";
import Heading from "@tiptap/extension-heading";
import Text from "@tiptap/extension-text";
import Placeholder from "@tiptap/extension-placeholder";
import Document from "@tiptap/extension-document";
import { mergeAttributes } from "@tiptap/core";
import { TextSelection } from "@tiptap/pm/state";
import { useEditorContext } from "@/contexts/EditorContext";
import { useFileSystem } from "@/contexts/FileSystemContext";
import { editorClasses } from "./styles/extension-styles";
import "./styles/title-editor.css";

const TitleDocument = Document.extend({
  content: "heading",
});

const TitleHeading = Heading.extend({
  renderHTML({ HTMLAttributes }) {
    return ["h1", mergeAttributes(HTMLAttributes, { class: editorClasses.documentTitle }), 0];
  },
}).configure({
  levels: [1],
});

interface TitleEditorProps {
  fileId: string;
}

function TitleEditor({ fileId }: TitleEditorProps) {
  const { setTitleEditor, focusPageEditor, pageEditorRef } = useEditorContext();
  const { getNode, renameNode } = useFileSystem();
  const file = getNode(fileId);
  const lastSavedRef = useRef<string>(file?.name || "");

  const editor = useEditor({
    extensions: [
      TitleDocument,
      TitleHeading,
      Placeholder.configure({
        placeholder: "new page",
        showOnlyWhenEditable: false,
      }),
      Text,
    ],
    content: file?.name || "",
    autofocus: !file?.name ? 'start' : false,
    immediatelyRender: true,
    shouldRerenderOnTransaction: false,
    onUpdate: ({ editor }) => {
      const text = editor.getText().trim();
      if (text !== lastSavedRef.current) {
        lastSavedRef.current = text;
        renameNode(fileId, text);
      }
    },
    editorProps: {
      attributes: {
        class: "outline-none bg-transparent border-none px-6 text-foreground title-editor-content",
      },
      handleTripleClickOn: (view, _pos, node, nodePos) => {
        if (node.isTextblock) {
          const from = nodePos + 1;
          const to = nodePos + node.nodeSize - 1;
          view.dispatch(view.state.tr.setSelection(TextSelection.create(view.state.doc, from, to)));
          return true;
        }

        const $nodePos = view.state.doc.resolve(Math.max(0, nodePos));
        if (!$nodePos.parent.isTextblock) {
          return false;
        }

        const from = $nodePos.start();
        const to = $nodePos.end();
        view.dispatch(view.state.tr.setSelection(TextSelection.create(view.state.doc, from, to)));
        return true;
      },
      handleDOMEvents: {
        keydown: (view, event) => {
          if (event.isComposing || event.keyCode === 229) return false;

          const { $head } = view.state.selection;
          const isAtEnd = !$head.nodeAfter;

          if (event.key === "Enter" && !event.shiftKey && isAtEnd) {
            event.preventDefault();
            const scrollContainer = view.dom.closest('.editor-scroll-stable') as HTMLElement | null;
            const scrollTopBefore = scrollContainer?.scrollTop ?? 0;

            const pageEditor = pageEditorRef.current;
            if (pageEditor) {
              const firstNode = pageEditor.state.doc.firstChild;
              const needsLeadingParagraph =
                !firstNode ||
                firstNode.type.name !== "paragraph" ||
                firstNode.textContent.length > 0;

              if (needsLeadingParagraph) {
                const { state } = pageEditor;
                const { tr } = state;
                const paragraph = state.schema.nodes.paragraph.create();
                tr.insert(0, paragraph);
                const paragraphStart = 1;
                const $paragraphPos = tr.doc.resolve(paragraphStart);
                const selection = TextSelection.near($paragraphPos, 1);
                tr.setSelection(selection);
                pageEditor.view.dispatch(tr);
                pageEditor.commands.focus(undefined, { scrollIntoView: false });
              } else {
                const { state } = pageEditor;
                const paragraphStart = 1;
                const $paragraphPos = state.doc.resolve(paragraphStart);
                const selection = TextSelection.near($paragraphPos, 1);
                pageEditor.view.dispatch(
                  state.tr.setSelection(selection)
                );
                pageEditor.commands.focus(undefined, { scrollIntoView: false });
              }

              if (scrollContainer) {
                requestAnimationFrame(() => {
                  scrollContainer.scrollTop = scrollTopBefore;
                  requestAnimationFrame(() => {
                    scrollContainer.scrollTop = scrollTopBefore;
                  });
                });
              }
            }
            return true;
          }

          if ((event.key === "ArrowDown" || event.key === "ArrowRight") && isAtEnd) {
            event.preventDefault();
            focusPageEditor("start");
            return true;
          }

          return false;
        },
      },
    },
  });

  useEffect(() => {
    if (editor) {
      setTitleEditor(editor);
    }
    return () => setTitleEditor(null);
  }, [editor, setTitleEditor]);

  if (!editor) return null;

  return (
    <div className="w-full title-editor mb-5" data-tauri-drag-region="false">
      <EditorContent editor={editor} />
    </div>
  );
}

export default TitleEditor;
