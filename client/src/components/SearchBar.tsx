import { SearchIcon } from "./icons";

interface Props {
  value: string;
  onChange: (value: string) => void;
}

export default function SearchBar({ value, onChange }: Props) {
  return (
    <div className="relative w-full sm:w-80">
      <label htmlFor="search" className="sr-only">
        Search notes by title, tag or content
      </label>
      <SearchIcon className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted" />
      <input
        id="search"
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search title, tag or content"
        className="field pl-10"
      />
    </div>
  );
}
