/**
 * Vizta Board Design Tokens — Colours
 * Matches the brand palette defined in ViztraBoard_TDD_v1.0
 */

export const Colors = {
  // ── Brand Greens ──────────────────────────────────────────
  green:        '#1B7A3E', // Primary green — headers, CTAs, active states
  greenDark:    '#145E30', // Dark green — gradients, hover/pressed states
  greenLight:   '#D6EFE0', // Light green — range selections, tags
  greenXLight:  '#F1F8F4', // Extra-light green — card alternates, backgrounds
  greenBg:      '#E2F0E9', // Page background tint

  // ── Neutrals ──────────────────────────────────────────────
  dark:         '#1A1A1A', // Primary text
  mid:          '#3D3D3D', // Secondary text
  muted:        '#6B6B6B', // Tertiary / placeholder text
  border:       '#E5E7EB', // Card borders, dividers
  white:        '#FFFFFF',
  offWhite:     '#F9FAFB',

  // ── Semantic ──────────────────────────────────────────────
  success:      '#16A34A',
  successBg:    '#DCFCE7',
  warning:      '#D97706',
  warningBg:    '#FEF3C7',
  error:        '#DC2626',
  errorBg:      '#FEE2E2',
  info:         '#2563EB',
  infoBg:       '#DBEAFE',

  // ── Status Pills ──────────────────────────────────────────
  statusActive:     '#16A34A',
  statusActiveBg:   '#DCFCE7',
  statusPending:    '#D97706',
  statusPendingBg:  '#FEF3C7',
  statusRejected:   '#DC2626',
  statusRejectedBg: '#FEE2E2',
  statusDraft:      '#6B7280',
  statusDraftBg:    '#F3F4F6',

  // ── Transparency helpers ───────────────────────────────────
  overlay:      'rgba(26, 26, 26, 0.5)',
  cardShadow:   'rgba(0, 0, 0, 0.08)',
} as const;

export type ColorKey = keyof typeof Colors;
