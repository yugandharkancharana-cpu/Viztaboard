/**
 * Vizta Board Design Tokens — Spacing & Radius
 */

export const Spacing = {
  xxs:  2,
  xs:   4,
  sm:   8,
  md:  12,
  base:16,
  lg:  20,
  xl:  24,
  '2xl':32,
  '3xl':40,
  '4xl':56,
  '5xl':72,
} as const;

export const Radius = {
  sm:   8,
  md:  14,
  lg:  20,
  xl:  28,
  pill:100,
} as const;

export const Shadow = {
  card: {
    shadowColor:   '#000',
    shadowOffset:  { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius:  8,
    elevation:     3,
  },
  modal: {
    shadowColor:   '#000',
    shadowOffset:  { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius:  24,
    elevation:     8,
  },
} as const;
