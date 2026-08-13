// ---------- Material Design 3 tokens (baseline purple theme) ----------
// ref: m3.material.io/foundations/design-tokens
export const MD = {
  primary: "#6750A4",
  onPrimary: "#FFFFFF",
  primaryContainer: "#EADDFF",
  onPrimaryContainer: "#21005D",
  surface: "#FFFBFE",
  surfaceContainer: "#F3EDF7",
  surfaceVariant: "#E7E0EC",
  onSurface: "#1C1B1F",
  onSurfaceVariant: "#49454F",
  outline: "#79747E",
  outlineVariant: "#CAC4D0",
  error: "#B3261E",
  errorContainer: "#F9DEDC",
};

// Naver Form-style accent, used only for privacy consent/notice question types
export const NAVER_GREEN = "#03C75A";

// per-type accent colors — makes the question list scannable at a glance
export const TYPE_COLORS = {
  short: "#4F86F7",
  paragraph: "#7C6FF0",
  radio: "#6750A4",
  checkbox: "#00A896",
  dropdown: "#F2994A",
  scale: "#EB5757",
  date: "#219653",
  time: "#C08A00",
  privacy_consent: NAVER_GREEN,
  privacy_notice: NAVER_GREEN,
};

// rotating palette for response bar charts (option-level color, not just one flat purple)
export const CHART_PALETTE = [
  "#6750A4",
  "#4F86F7",
  "#00A896",
  "#F2994A",
  "#EB5757",
  "#219653",
  "#7C6FF0",
  "#C08A00",
];

// M3 elevation shadow approximations
export const ELEV1 = "shadow-[0_1px_2px_rgba(0,0,0,0.3),0_1px_3px_1px_rgba(0,0,0,0.15)]";
export const ELEV2 = "shadow-[0_1px_2px_rgba(0,0,0,0.3),0_2px_6px_2px_rgba(0,0,0,0.15)]";
export const ELEV3 = "shadow-[0_1px_3px_rgba(0,0,0,0.3),0_4px_8px_3px_rgba(0,0,0,0.15)]";

// pre-composed (not string-interpolated) so Tailwind's JIT scanner can actually see the
// `hover:` variant — building it via `${ELEV1} hover:${ELEV2}` at call-sites silently
// drops the hover class from the production build.
export const ELEV1_HOVER =
  "shadow-[0_1px_2px_rgba(0,0,0,0.3),0_1px_3px_1px_rgba(0,0,0,0.15)] hover:shadow-[0_1px_2px_rgba(0,0,0,0.3),0_2px_6px_2px_rgba(0,0,0,0.15)]";

export const FIELD =
  "w-full rounded-t-md bg-[#F3EDF7] px-3 pt-2.5 pb-2 text-base text-[#1C1B1F] outline-none border-b-2 border-[#79747E] focus:border-[#6750A4] focus:bg-[#ECE6F0] transition-colors";
