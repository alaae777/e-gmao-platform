/**
 * e-GMAO — Dark Theme Design Tokens (v2, no orange)
 * ====================================================
 * L'orange a été retiré : c'est la couleur signature ONCF, donc même sans
 * le mot "ONCF" nulle part, la couleur seule évoquait encore la marque.
 *
 * Nouvel accent : bleu pétrole — sobre, "instrument technique haut de
 * gamme", sans association à une identité existante. Un seul accent est
 * utilisé pour les actions primaires / l'état actif, le reste de la
 * palette reste neutre (encre, gris-bleu) pour garder l'ensemble élégant
 * plutôt que saturé de couleur.
 */

export const colors = {
  primary: "#2B8CB0",
  primaryHover: "#45A6CB",
  primaryActiveBg: "rgba(43, 140, 176, 0.14)",

  // Second accent neutre, pour différencier sans multiplier les couleurs vives
  accentSlate: "#6B7A8F",
  accentSlateSoft: "rgba(107, 122, 143, 0.14)",

  ink: "#F4F6F9",
  inkSoft: "#A8B1C2",
  inkMuted: "#6B7385",

  surface: "#151A23",
  surfaceRaised: "#1C222D",
  canvas: "#0D1117",

  sidebar: "#0D1117",
  sidebarText: "#A8B1C2",
  sidebarActiveBg: "rgba(43, 140, 176, 0.14)",

  border: "#262D3A",
  borderSoft: "#1E2430",
  cardHover: "#1C222D",

  success: "#2FBE84",
  warning: "#D9A441",
  danger: "#E5574F",
};

export const fonts = {
  display: "'IBM Plex Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  body: "'IBM Plex Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  mono: "'IBM Plex Mono', 'SFMono-Regular', Consolas, monospace",
};

export const antdTheme = {
  token: {
    colorPrimary: colors.primary,
    colorTextBase: colors.ink,
    colorTextSecondary: colors.inkSoft,
    colorBgLayout: colors.canvas,
    colorBgContainer: colors.surface,
    colorBgElevated: colors.surfaceRaised,
    colorBorder: colors.border,
    colorBorderSecondary: colors.borderSoft,
    borderRadius: 8,
    borderRadiusLG: 10,
    borderRadiusSM: 6,
    fontFamily: fonts.body,
    colorSuccess: colors.success,
    colorWarning: colors.warning,
    colorError: colors.danger,
    boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.35)",
    boxShadowSecondary: "0 4px 12px -2px rgba(0, 0, 0, 0.45)",
    boxShadowTertiary: "0 10px 24px -6px rgba(0, 0, 0, 0.55)",
  },
  components: {
    Layout: {
      siderBg: colors.sidebar,
      headerBg: colors.surface,
      bodyBg: colors.canvas,
    },
    Menu: {
      itemBg: "transparent",
      itemColor: colors.sidebarText,
      itemSelectedColor: colors.primary,
      itemSelectedBg: colors.sidebarActiveBg,
      itemHoverColor: colors.ink,
      itemHoverBg: colors.cardHover,
      itemMarginInline: 10,
      itemBorderRadius: 6,
    },
    Card: {
      borderRadiusLG: 10,
      colorBgContainer: colors.surface,
      colorBorderSecondary: colors.border,
    },
    Button: {
      controlHeight: 40,
      fontWeight: 600,
      borderRadius: 6,
      colorPrimary: colors.primary,
      colorPrimaryHover: colors.primaryHover,
    },
    Statistic: {
      titleFontSize: 12,
      contentFontSize: 26,
      fontFamily: fonts.mono,
    },
    Input: {
      colorBgContainer: colors.surfaceRaised,
      colorBorder: colors.border,
    },
    Select: {
      colorBgContainer: colors.surfaceRaised,
      colorBorder: colors.border,
    },
    Table: {
      colorBgContainer: colors.surface,
      headerBg: colors.surfaceRaised,
      borderColor: colors.border,
    },
    Modal: {
      contentBg: colors.surfaceRaised,
      headerBg: colors.surfaceRaised,
    },
  },
};