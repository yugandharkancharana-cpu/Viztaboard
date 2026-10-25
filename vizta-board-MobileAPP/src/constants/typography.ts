/**
 * Vizta Board Design Tokens — Typography
 * Display/headings: Nunito | Body/UI: Inter
 */

export const FontFamily = {
  // Nunito — display text, headings, brand wordmark
  nunitoBlack:      'Nunito_900Black',
  nunitoExtraBold:  'Nunito_800ExtraBold',
  nunitoBold:       'Nunito_700Bold',
  nunitoSemiBold:   'Nunito_600SemiBold',
  nunitoMedium:     'Nunito_500Medium',
  nunito:           'Nunito_400Regular',

  // Inter — body copy, UI labels, data
  interBold:        'Inter_700Bold',
  interSemiBold:    'Inter_600SemiBold',
  interMedium:      'Inter_500Medium',
  inter:            'Inter_400Regular',
} as const;

export const FontSize = {
  xs:   11,
  sm:   13,
  base: 15,
  md:   17,
  lg:   19,
  xl:   22,
  '2xl': 26,
  '3xl': 32,
  '4xl': 40,
} as const;

export const LineHeight = {
  tight:   1.2,
  normal:  1.5,
  relaxed: 1.7,
} as const;

export const TextStyle = {
  // ── Headings (Nunito) ──────────────────────
  h1: {
    fontFamily: FontFamily.nunitoBlack,
    fontSize:   FontSize['3xl'],
    lineHeight: FontSize['3xl'] * 1.2,
  },
  h2: {
    fontFamily: FontFamily.nunitoExtraBold,
    fontSize:   FontSize['2xl'],
    lineHeight: FontSize['2xl'] * 1.25,
  },
  h3: {
    fontFamily: FontFamily.nunitoBold,
    fontSize:   FontSize.xl,
    lineHeight: FontSize.xl * 1.3,
  },
  h4: {
    fontFamily: FontFamily.nunitoBold,
    fontSize:   FontSize.lg,
    lineHeight: FontSize.lg * 1.35,
  },

  // ── Body (Inter) ───────────────────────────
  bodyLg: {
    fontFamily: FontFamily.inter,
    fontSize:   FontSize.md,
    lineHeight: FontSize.md * 1.5,
  },
  body: {
    fontFamily: FontFamily.inter,
    fontSize:   FontSize.base,
    lineHeight: FontSize.base * 1.5,
  },
  bodySm: {
    fontFamily: FontFamily.inter,
    fontSize:   FontSize.sm,
    lineHeight: FontSize.sm * 1.5,
  },
  caption: {
    fontFamily: FontFamily.inter,
    fontSize:   FontSize.xs,
    lineHeight: FontSize.xs * 1.4,
  },

  // ── UI Labels (Inter Medium) ───────────────
  label: {
    fontFamily: FontFamily.interMedium,
    fontSize:   FontSize.sm,
    lineHeight: FontSize.sm * 1.4,
  },
  labelSm: {
    fontFamily: FontFamily.interMedium,
    fontSize:   FontSize.xs,
    lineHeight: FontSize.xs * 1.4,
  },
  button: {
    fontFamily: FontFamily.interSemiBold,
    fontSize:   FontSize.base,
    lineHeight: FontSize.base * 1.2,
  },
  buttonSm: {
    fontFamily: FontFamily.interSemiBold,
    fontSize:   FontSize.sm,
    lineHeight: FontSize.sm * 1.2,
  },
} as const;
