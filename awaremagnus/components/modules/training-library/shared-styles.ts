/**
 * Shared HeroUI classNames for Training Library screens.
 * Aligns with login/dashboard theme: --blue, --mainblue, --gray, --strokeGray
 */
export const inputClassNames = {
  base: "w-full",
  inputWrapper:
    "rounded-full bg-white border border-[var(--strokeGray)] focus-within:border-[var(--blue)] transition-colors duration-300 h-11 min-h-11",
  input: "bg-transparent text-sm",
};

export const selectClassNames = {
  trigger:
    "rounded-full bg-white border border-[var(--strokeGray)] focus-within:border-[var(--blue)] transition-colors duration-300 h-11 min-h-11 data-[hover=true]:border-[var(--blue)]",
  value: "text-sm",
};

export const primaryButtonClassName =
  "rounded-full bg-[var(--blue)] text-white font-medium transition-all duration-300 hover:opacity-90 data-[hover=true]:opacity-90";

export const cardClassName = "rounded-2xl border border-[var(--strokeGray)] bg-white shadow-none";

export const pageTitleClassName = "text-2xl font-semibold text-[var(--mainblue)]";

export const pageSubtitleClassName = "text-sm text-[var(--darkgray)]";

export const breadcrumbLinkClassName =
  "text-sm text-[var(--darkgray)] hover:text-[var(--mainblue)] transition-colors";
