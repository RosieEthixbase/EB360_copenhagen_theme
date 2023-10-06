import type {
  ClipboardEventHandler,
  MouseEvent,
  KeyboardEventHandler,
  MouseEventHandler,
  RefObject,
  HTMLAttributes,
  InputHTMLAttributes,
} from "react";
import { useCallback, useState } from "react";
import { useGrid } from "@zendeskgarden/container-grid";

interface UseTagsInputContainerProps {
  tags: string[];
  onTagsChange: (value: string[]) => void;
  inputValue: string;
  onInputValueChange: (value: string) => void;
  inputRef: RefObject<HTMLInputElement>;
  gridRowRef: RefObject<HTMLElement>;
  i18n: {
    addedTag: (value: string) => string;
    addedTags: (values: string[]) => string;
    removedTag: (value: string) => string;
  };
}

export function useTagsInputContainer({
  tags,
  onTagsChange,
  inputValue,
  onInputValueChange,
  inputRef,
  gridRowRef,
  i18n,
}: UseTagsInputContainerProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [announcement, setAnnouncement] = useState("");

  const gridOnChange = useCallback(
    (_: number, colIndex: number) => {
      setSelectedIndex(colIndex);
    },
    [setSelectedIndex]
  );

  const { getGridProps, getGridCellProps } = useGrid({
    matrix: [tags],
    rowIndex: 0,
    colIndex: selectedIndex,
    onChange: gridOnChange,
  });

  const hasTag = (tag: string) => {
    return tags.includes(tag);
  };

  const addTag = (tag: string) => {
    onTagsChange([...tags, tag]);
    setAnnouncement(i18n.addedTag(tag));
  };

  const removeTagAt = (at: number) => {
    const tag = tags[at] as string;
    onTagsChange(tags.filter((_, index) => index !== at));
    setAnnouncement(i18n.removedTag(tag));
    setSelectedIndex(0);

    /* Move focus to the first tag once a tag has been removed, after 100ms to let screen reader read the
       announcement first */
    setTimeout(() => {
      const selectedTag = gridRowRef.current?.querySelector(
        `[tabindex="0"]`
      ) as HTMLElement | undefined;
      selectedTag?.focus();
    }, 100);
  };

  const handleContainerClick = <T extends Element>(e: MouseEvent<T>) => {
    if (e.target === e.currentTarget) {
      inputRef.current?.focus();
    }
  };

  const handleContainerBlur = () => {
    setSelectedIndex(0);
  };

  const handleInputKeyDown: KeyboardEventHandler<HTMLInputElement> = (e) => {
    const target = e.target as HTMLInputElement;
    const tag = target.value;

    if (
      tag &&
      (e.code === "Space" ||
        e.code === "Enter" ||
        e.code === "Comma" ||
        e.code === "Tab")
    ) {
      e.preventDefault();
      if (!hasTag(tag)) {
        addTag(tag);
      }
      onInputValueChange("");
    }
  };

  const handleInputPaste: ClipboardEventHandler<HTMLInputElement> = (e) => {
    e.preventDefault();

    const data = e.clipboardData.getData("text");
    const values = new Set(
      data.split(/[\s,;]+/).filter((value) => !tags.includes(value))
    );
    onTagsChange([...tags, ...values]);
    setAnnouncement(i18n.addedTags([...values]));
  };

  const handleTagKeyDown =
    (index: number): KeyboardEventHandler =>
    (e) => {
      if (e.code === "Backspace") {
        e.preventDefault();
        removeTagAt(index);
      }
    };

  const handleTagCloseClick =
    (index: number): MouseEventHandler =>
    () => {
      removeTagAt(index);
    };

  const getContainerProps = <T extends Element>(): HTMLAttributes<T> => ({
    onClick: handleContainerClick,
    onBlur: handleContainerBlur,
    tabIndex: -1,
  });

  const getGridRowProps = <T extends Element>(): HTMLAttributes<T> => ({
    role: "row",
  });

  const getTagCloseProps = <T extends Element>(
    index: number
  ): HTMLAttributes<T> => ({
    onClick: handleTagCloseClick(index),
  });

  const getInputProps = (): InputHTMLAttributes<HTMLInputElement> => ({
    value: inputValue,
    onChange: (e) => onInputValueChange(e.target.value),
    onKeyDown: handleInputKeyDown,
    onPaste: handleInputPaste,
  });

  const getAnnouncementProps = <T extends Element>(): HTMLAttributes<T> => ({
    "aria-live": "polite",
    "aria-relevant": "text",
  });

  return {
    getContainerProps,
    getGridProps,
    getGridRowProps,
    getGridCellProps: <T extends HTMLElement>(
      index: number
    ): HTMLAttributes<T> =>
      getGridCellProps<T>({
        rowIndex: 0,
        colIndex: index,
        onKeyDown: handleTagKeyDown(index),
      }),
    getTagCloseProps,
    getInputProps,
    announcement,
    getAnnouncementProps,
  };
}
