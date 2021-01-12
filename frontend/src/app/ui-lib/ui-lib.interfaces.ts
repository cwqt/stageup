export enum ThemeKind {
  Primary = "primary",
  Secondary = "secondary",
  Accent = "accent",
  Warning = "warning",
  Danger = "danger",
}

export enum ThemeDimension {
  Large = "l",
  Medium = "m",
  Small = "s"
}

export const dimensionClassMap:{[index in ThemeDimension]:string} = {
  [ThemeDimension.Large]: "large",
  [ThemeDimension.Medium]: "medium",
  [ThemeDimension.Small]: "small"
} 
