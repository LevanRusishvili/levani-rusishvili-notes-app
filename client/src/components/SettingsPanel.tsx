import type { ReactNode } from "react";
import type { ColorTheme, FontTheme } from "../types";
import ChangePasswordForm from "./ChangePasswordForm";
import { CheckIcon } from "./icons";

interface Option<T extends string> {
  value: T;
  label: string;
  description: string;
  preview: ReactNode;
}

const previewBox =
  "grid h-14 place-items-center rounded-lg border border-line text-lg font-semibold";

const colorOptions: Option<ColorTheme>[] = [
  {
    value: "light",
    label: "Light",
    description: "Warm paper, easy in daylight",
    preview: (
      <div
        className={previewBox}
        style={{ background: "#fbf9f4", color: "#231f1a" }}
      >
        Aa
      </div>
    ),
  },
  {
    value: "dark",
    label: "Dark",
    description: "Soft ink for the evening",
    preview: (
      <div
        className={previewBox}
        style={{ background: "#171512", color: "#efe9dd" }}
      >
        Aa
      </div>
    ),
  },
  {
    value: "system",
    label: "System",
    description: "Follows your device",
    preview: (
      <div className="flex h-14 overflow-hidden rounded-lg border border-line text-lg font-semibold">
        <span
          className="grid flex-1 place-items-center"
          style={{ background: "#fbf9f4", color: "#231f1a" }}
        >
          A
        </span>
        <span
          className="grid flex-1 place-items-center"
          style={{ background: "#171512", color: "#efe9dd" }}
        >
          a
        </span>
      </div>
    ),
  },
];

const fontPreview = (family: string) => (
  <div
    className="grid h-14 place-items-center rounded-lg bg-surface text-2xl"
    style={{ fontFamily: family }}
  >
    Aa
  </div>
);

const fontOptions: Option<FontTheme>[] = [
  {
    value: "sans",
    label: "Sans-serif",
    description: "Clean and modern",
    preview: fontPreview(
      'ui-sans-serif, system-ui, "Segoe UI", Roboto, Arial, sans-serif',
    ),
  },
  {
    value: "serif",
    label: "Serif",
    description: "Classic and bookish",
    preview: fontPreview('Georgia, Cambria, "Times New Roman", serif'),
  },
  {
    value: "mono",
    label: "Monospace",
    description: "Fixed width, like code",
    preview: fontPreview(
      "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
    ),
  },
];

interface GroupProps<T extends string> {
  legend: string;
  hint: string;
  name: string;
  value: T;
  options: Option<T>[];
  onChange: (value: T) => void;
}

// Native radio buttons (hidden visually, still focusable) so arrow keys work.
function RadioGroup<T extends string>({
  legend,
  hint,
  name,
  value,
  options,
  onChange,
}: GroupProps<T>) {
  return (
    <fieldset>
      <legend className="text-lg font-semibold">{legend}</legend>
      <p className="mb-4 text-sm text-muted">{hint}</p>
      <div className="grid gap-3 sm:grid-cols-3">
        {options.map((option) => (
          <label
            key={option.value}
            className="group relative flex cursor-pointer flex-col gap-3 rounded-xl border border-line p-3 transition-colors hover:bg-surface has-[:checked]:border-accent has-[:checked]:bg-accent-soft has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-accent"
          >
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={value === option.value}
              onChange={() => onChange(option.value)}
              className="sr-only"
            />
            {option.preview}
            <span>
              <span className="block font-medium">{option.label}</span>
              <span className="block text-sm text-muted">
                {option.description}
              </span>
            </span>
            <span
              aria-hidden="true"
              className="absolute right-3 bottom-3 hidden size-6 place-items-center rounded-full bg-accent text-accent-fg group-has-[:checked]:grid"
            >
              <CheckIcon className="size-3.5" strokeWidth={2.5} />
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

interface Props {
  colorTheme: ColorTheme;
  setColorTheme: (value: ColorTheme) => void;
  fontTheme: FontTheme;
  setFontTheme: (value: FontTheme) => void;
}

export default function SettingsPanel({
  colorTheme,
  setColorTheme,
  fontTheme,
  setFontTheme,
}: Props) {
  return (
    <div className="h-full overflow-y-auto">
      <header className="border-b border-line px-4 py-4 md:px-8">
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-sm text-muted">
          Make the app look the way you like it.
        </p>
      </header>

      <div className="flex max-w-3xl flex-col gap-6 px-4 py-6 md:px-8">
        <section className="animate-rise rounded-2xl border border-line p-5 md:p-6">
          <RadioGroup
            legend="Color theme"
            hint="Choose how the app looks."
            name="color-theme"
            value={colorTheme}
            options={colorOptions}
            onChange={setColorTheme}
          />
        </section>

        <section
          className="animate-rise rounded-2xl border border-line p-5 md:p-6"
          style={{ animationDelay: "60ms" }}
        >
          <RadioGroup
            legend="Font theme"
            hint="Choose the typeface used for your notes."
            name="font-theme"
            value={fontTheme}
            options={fontOptions}
            onChange={setFontTheme}
          />
        </section>

        <section
          className="animate-rise max-w-md rounded-2xl border border-line p-5 md:p-6"
          style={{ animationDelay: "120ms" }}
        >
          <ChangePasswordForm />
        </section>
      </div>
    </div>
  );
}
