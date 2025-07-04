import React, { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

interface EditableHeaderProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  onEditStart?: () => void;
  onEditEnd?: () => void;
}

export function EditableHeader({
  value,
  onChange,
  placeholder = "Enter title...",
  className,
  onEditStart,
  onEditEnd,
}: EditableHeaderProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [tempValue, setTempValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setTempValue(value);
  }, [value]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleStartEdit = () => {
    setIsEditing(true);
    setTempValue(value);
    onEditStart?.();
  };

  const handleConfirmEdit = () => {
    onChange(tempValue.trim() || placeholder);
    setIsEditing(false);
    onEditEnd?.();
  };

  const handleCancelEdit = () => {
    setTempValue(value);
    setIsEditing(false);
    onEditEnd?.();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleConfirmEdit();
    } else if (e.key === "Escape") {
      e.preventDefault();
      handleCancelEdit();
    }
  };

  const handleBlur = () => {
    handleConfirmEdit();
  };

  if (isEditing) {
    return (
      <input
        ref={inputRef}
        type="text"
        value={tempValue}
        onChange={(e) => setTempValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        placeholder={placeholder}
        className={cn(
          "text-2xl font-bold bg-transparent border-none outline-none focus:ring-2 focus:ring-gray-200 rounded p-2",
          className
        )}
      />
    );
  }

  return (
    <h2
      onClick={handleStartEdit}
      className={cn(
        "text-2xl font-bold cursor-pointer hover:bg-gray-100 rounded p-2 transition-colors",
        !value && "text-gray-400",
        className
      )}
      title="Click to edit"
    >
      {value || placeholder}
    </h2>
  );
}
