import React, { useEffect, useId, useRef, useState } from "react";
import { Check, ChevronDown, X } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export type AutocompleteOption = {
  value: string;
  label: string;
};

export interface AutocompleteProps {
  options: AutocompleteOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  loading?: boolean;
  className?: string;
  id?: string;
}

export default function Autocomplete({
  options,
  value,
  onChange,
  placeholder = "Pilih...",
  disabled = false,
  loading = false,
  className,
  id,
}: AutocompleteProps) {
  const generatedId = useId();
  const inputId = id || generatedId;
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  const selectedOption = options.find((opt) => opt.value === value);

  const filtered = search
    ? options.filter((opt) => opt.label.toLowerCase().includes(search.toLowerCase()))
    : options;

  useEffect(() => {
    setHighlightedIndex(-1);
  }, [search]);

  useEffect(() => {
    if (!isOpen) {
      setSearch("");
      setHighlightedIndex(-1);
    }
  }, [isOpen]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (highlightedIndex >= 0 && listRef.current) {
      const item = listRef.current.children[highlightedIndex] as HTMLElement | undefined;
      item?.scrollIntoView({ block: "nearest" });
    }
  }, [highlightedIndex]);

  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
    setSearch("");
    inputRef.current?.blur();
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("");
    setSearch("");
    setIsOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
        } else {
          setHighlightedIndex((prev) => (prev < filtered.length - 1 ? prev + 1 : 0));
        }
        break;
      case "ArrowUp":
        e.preventDefault();
        if (isOpen) {
          setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : filtered.length - 1));
        }
        break;
      case "Enter":
        e.preventDefault();
        if (isOpen && highlightedIndex >= 0 && filtered[highlightedIndex]) {
          handleSelect(filtered[highlightedIndex].value);
        }
        break;
      case "Escape":
        setIsOpen(false);
        inputRef.current?.blur();
        break;
    }
  };

  return (
    <div ref={containerRef} className={cn("relative w-full", className)}>
      <div
        className={cn(
          "flex items-center gap-1 w-full rounded-lg border bg-white px-3 py-2 text-sm transition-colors",
          "dark:bg-slate-900 dark:text-white",
          isOpen
            ? "border-slate-900 ring-1 ring-slate-900 dark:border-white dark:ring-white"
            : "border-slate-200 dark:border-slate-700",
          disabled && "cursor-not-allowed opacity-50",
          !disabled && "cursor-text"
        )}
        onClick={() => {
          if (!disabled) {
            setIsOpen(true);
            inputRef.current?.focus();
          }
        }}
      >
        <input
          ref={inputRef}
          id={inputId}
          type="text"
          className={cn(
            "flex-1 bg-transparent outline-none placeholder:text-slate-400 dark:placeholder:text-slate-500 min-w-0",
            disabled && "cursor-not-allowed"
          )}
          placeholder={selectedOption ? selectedOption.label : placeholder}
          value={isOpen ? search : (selectedOption?.label || "")}
          onChange={(e) => {
            setSearch(e.target.value);
            if (!isOpen) setIsOpen(true);
          }}
          onFocus={() => {
            if (!disabled) {
              setIsOpen(true);
              if (selectedOption) setSearch("");
            }
          }}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          autoComplete="off"
          role="combobox"
          aria-expanded={isOpen}
          aria-controls={`${inputId}-listbox`}
          aria-activedescendant={highlightedIndex >= 0 ? `${inputId}-option-${highlightedIndex}` : undefined}
        />

        {value && !disabled && (
          <button
            type="button"
            onClick={handleClear}
            className="shrink-0 rounded p-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
            tabIndex={-1}
            aria-label="Clear selection"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}

        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-slate-400 transition-transform",
            isOpen && "rotate-180"
          )}
        />
      </div>

      {isOpen && !disabled && (
        <ul
          ref={listRef}
          id={`${inputId}-listbox`}
          role="listbox"
          className={cn(
            "absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-slate-200 bg-white py-1 shadow-lg",
            "dark:border-slate-700 dark:bg-slate-900"
          )}
        >
          {loading ? (
            <li className="px-3 py-2 text-sm text-slate-400 dark:text-slate-500">Memuat...</li>
          ) : filtered.length === 0 ? (
            <li className="px-3 py-2 text-sm text-slate-400 dark:text-slate-500">
              {search ? "Tidak ditemukan" : "Tidak ada opsi"}
            </li>
          ) : (
            filtered.map((option, index) => (
              <li
                key={option.value}
                id={`${inputId}-option-${index}`}
                role="option"
                aria-selected={option.value === value}
                className={cn(
                  "flex cursor-pointer items-center gap-2 px-3 py-2 text-sm transition-colors",
                  "text-slate-700 dark:text-slate-200",
                  highlightedIndex === index && "bg-slate-100 dark:bg-slate-800",
                  option.value === value && "font-medium"
                )}
                onClick={() => handleSelect(option.value)}
                onMouseEnter={() => setHighlightedIndex(index)}
              >
                <span className="flex-1 truncate">{option.label}</span>
                {option.value === value && (
                  <Check className="h-4 w-4 shrink-0 text-slate-900 dark:text-white" />
                )}
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
