import { Dispatch, FC, SetStateAction } from "react";
import type { Editor } from "@tiptap/react";
import { useEditorState } from "@tiptap/react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Tooltip, AppTooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

import { ColorSwatchButton } from "./atoms/color-swatch-button";
import { ColorSwatchGrid } from "./atoms/color-swatch-grid";

export interface BubbleColorMenuItem {
  name: string;
  color: string;
}

type BubbleTextColor = BubbleColorMenuItem & {
  textClass: string;
  swatchClass: string;
};

type BubbleHighlightColor = BubbleColorMenuItem & {
  swatchClass: string;
};

interface ColorSelectorProps {
  editor: Editor | null;
  isOpen: boolean;
  setIsOpen: Dispatch<SetStateAction<boolean>>;
  container?: HTMLElement | null;
}

const TEXT_COLORS: BubbleTextColor[] = [
  { name: "Default", color: "", textClass: "text-editor-picker-text-muted", swatchClass: "bg-transparent" },
  { name: "Gray", color: "var(--color-editor-text-gray)", textClass: "text-editor-text-gray", swatchClass: "bg-editor-text-gray" },
  { name: "Brown", color: "var(--color-editor-text-brown)", textClass: "text-editor-text-brown", swatchClass: "bg-editor-text-brown" },
  { name: "Orange", color: "var(--color-editor-text-orange)", textClass: "text-editor-text-orange", swatchClass: "bg-editor-text-orange" },
  { name: "Yellow", color: "var(--color-editor-text-yellow)", textClass: "text-editor-text-yellow", swatchClass: "bg-editor-text-yellow" },
  { name: "Green", color: "var(--color-editor-text-green)", textClass: "text-editor-text-green", swatchClass: "bg-editor-text-green" },
  { name: "Blue", color: "var(--color-editor-text-blue)", textClass: "text-editor-text-blue", swatchClass: "bg-editor-text-blue" },
  { name: "Purple", color: "var(--color-editor-text-purple)", textClass: "text-editor-text-purple", swatchClass: "bg-editor-text-purple" },
  { name: "Pink", color: "var(--color-editor-text-pink)", textClass: "text-editor-text-pink", swatchClass: "bg-editor-text-pink" },
  { name: "Red", color: "var(--color-editor-text-red)", textClass: "text-editor-text-red", swatchClass: "bg-editor-text-red" },
];

const BACKGROUND_COLORS: BubbleHighlightColor[] = [
  { name: "Default", color: "", swatchClass: "bg-transparent" },
  { name: "Gray", color: "var(--color-editor-highlight-gray)", swatchClass: "bg-editor-highlight-gray" },
  { name: "Brown", color: "var(--color-editor-highlight-brown)", swatchClass: "bg-editor-highlight-brown" },
  { name: "Orange", color: "var(--color-editor-highlight-orange)", swatchClass: "bg-editor-highlight-orange" },
  { name: "Yellow", color: "var(--color-editor-highlight-yellow)", swatchClass: "bg-editor-highlight-yellow" },
  { name: "Green", color: "var(--color-editor-highlight-green)", swatchClass: "bg-editor-highlight-green" },
  { name: "Blue", color: "var(--color-editor-highlight-blue)", swatchClass: "bg-editor-highlight-blue" },
  { name: "Purple", color: "var(--color-editor-highlight-purple)", swatchClass: "bg-editor-highlight-purple" },
  { name: "Pink", color: "var(--color-editor-highlight-pink)", swatchClass: "bg-editor-highlight-pink" },
  { name: "Red", color: "var(--color-editor-highlight-red)", swatchClass: "bg-editor-highlight-red" },
];

export const ColorSelector: FC<ColorSelectorProps> = ({
  editor,
  isOpen,
  setIsOpen,
}) => {

  const editorState = useEditorState({
    editor,
    selector: ctx => {
      if (!ctx.editor) {
        return null;
      }

      const activeColors: Record<string, boolean> = {};
      TEXT_COLORS.forEach(({ color }) => {
        activeColors[`text_${color}`] = ctx.editor!.isActive("textStyle", { color });
      });
      BACKGROUND_COLORS.forEach(({ color }) => {
        activeColors[`highlight_${color}`] = ctx.editor!.isActive("highlight", { color });
      });

      return activeColors;
    },
  });

  if (!editor || !editorState) {
    return null;
  }

  const activeTextColor = TEXT_COLORS.find(({ color }) =>
    editorState[`text_${color}`]
  );

  const activeHighlightColor = BACKGROUND_COLORS.find(({ color }) =>
    editorState[`highlight_${color}`]
  );

  const activeTextClass = activeTextColor?.color
    ? TEXT_COLORS.find((item) => item.name === activeTextColor.name)?.textClass
    : undefined;

  return (
    <Tooltip>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <TooltipTrigger asChild>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 gap-1 px-2 rounded-lg"
            >
              <span 
                className={cn("font-semibold", activeTextClass)}
              >
                A
              </span>
              <ChevronDown className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
        </TooltipTrigger>
        <AppTooltipContent label="Text color" />

        <PopoverContent 
          align="start" 
          className="w-auto p-3"
          onCloseAutoFocus={(e) => e.preventDefault()}
        >
          {/* Recently used section */}
          <div className="mb-3">
            <p className="text-xs font-medium text-editor-label mb-2">Recently used</p>
            <div className="flex gap-1.5">
              {activeTextColor && activeTextColor.color && (
                <ColorSwatchButton
                  isActive={false}
                  swatchClass={TEXT_COLORS.find((item) => item.name === activeTextColor.name)?.swatchClass ?? ''}
                  onClick={() => editor.chain().focus().setColor(activeTextColor.color).run()}
                  title={activeTextColor.name}
                />
              )}
              {activeHighlightColor && activeHighlightColor.color && (
                <ColorSwatchButton
                  isActive={false}
                  swatchClass={BACKGROUND_COLORS.find((item) => item.name === activeHighlightColor.name)?.swatchClass ?? ''}
                  onClick={() => editor.chain().focus().setHighlight({ color: activeHighlightColor.color }).run()}
                  title={activeHighlightColor.name}
                />
              )}
            </div>
          </div>

          {/* Text color section */}
          <ColorSwatchGrid label="Text color" className="mb-3">
            {TEXT_COLORS.map(({ name, color, textClass }, index) => {
              const isActive = activeTextColor?.color === color;
              return (
                <ColorSwatchButton
                  key={index}
                  isActive={isActive}
                  swatchClass="bg-editor-picker-swatch-bg"
                  onClick={() => {
                    if (name === "Default") {
                      editor.commands.unsetColor();
                    } else {
                      editor.chain().focus().setColor(color).run();
                    }
                  }}
                  title={name}
                >
                  <span className={cn("font-semibold text-sm", textClass)}>A</span>
                </ColorSwatchButton>
              );
            })}
          </ColorSwatchGrid>

          {/* Background color section */}
          <ColorSwatchGrid label="Background color">
            {BACKGROUND_COLORS.map(({ name, color, swatchClass }, index) => {
              const isActive = activeHighlightColor?.color === color;
              return (
                <ColorSwatchButton
                  key={index}
                  isActive={isActive}
                  swatchClass={swatchClass}
                  onClick={() => {
                    if (name === "Default") {
                      editor.commands.unsetHighlight();
                    } else {
                      editor.chain().focus().setHighlight({ color }).run();
                    }
                  }}
                  title={name}
                />
              );
            })}
          </ColorSwatchGrid>
        </PopoverContent>
      </Popover>
    </Tooltip>
  );
};
