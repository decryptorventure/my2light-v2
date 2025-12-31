export const COLORS = {
  background: '#000000',
  surface: '#1C1C1E',
  surfaceElevated: '#2C2C2E',
  primary: '#FF3B30',
  secondary: '#FFD60A',
  accent: '#0A84FF',
  textPrimary: '#FFFFFF',
  textSecondary: '#8E8E93',
  success: '#30D158',
  warning: '#FF9F0A',
  error: '#FF453A',
} as const;

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
} as const;

export const VIDEO = {
  defaultHighlightDuration: 5, // seconds
  maxClipDuration: 60,
  minClipDuration: 1,
  speedOptions: [0.5, 0.75, 1, 1.25, 1.5, 2],
} as const;
