import { forwardRef } from "react";
import { TbSearch } from "react-icons/tb";

type SearchBarProps = {
  value: string;
  onChange: (value: string) => void;
  onFocus: () => void;
  onBlur: () => void;
};

export const SearchBar = forwardRef<HTMLInputElement, SearchBarProps>(function SearchBar({ value, onChange, onFocus, onBlur }, ref) {
  return (
    <label className="flex h-11 w-[480px] items-center gap-3 rounded-xl border border-[rgba(26,22,18,0.08)] bg-white px-4 text-[#1A1612] focus-within:border-[rgba(184,84,61,0.4)] focus-within:ring-2 focus-within:ring-[rgba(184,84,61,0.12)]">
      <TbSearch size={18} className="text-[#78716C]" strokeWidth={1.6} />
      <input
        ref={ref}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onFocus={onFocus}
        onBlur={onBlur}
        placeholder="Search the brain..."
        className="min-w-0 flex-1 bg-transparent font-sans text-[14px] text-[#1A1612] outline-none placeholder:text-[#78716C]/70"
      />
      <span className="rounded-full bg-[rgba(26,22,18,0.06)] px-2 py-1 font-mono text-[11px] text-[#78716C]">Cmd K</span>
    </label>
  );
});
