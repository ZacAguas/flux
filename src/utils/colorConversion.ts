/**
 * Color Conversion Utilities
 *
 * Helper functions for converting between RGB and hex color formats.
 * Used by the transfer function editor for color picker integration.
 */

/**
 * Convert RGB object to hex string
 *
 * @param rgb - RGB color object with r, g, b values (0-255)
 * @returns Hex color string (e.g., "#ff5500")
 */
export function rgbToHex(rgb: { r: number; g: number; b: number }): string {
  const toHex = (n: number) => {
    const hex = Math.max(0, Math.min(255, Math.round(n))).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };

  return `#${toHex(rgb.r)}${toHex(rgb.g)}${toHex(rgb.b)}`;
}

/**
 * Convert hex string to RGB object
 *
 * @param hex - Hex color string (e.g., "#ff5500" or "ff5500")
 * @returns RGB color object with r, g, b values (0-255)
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  // Remove # if present
  const cleanHex = hex.replace(/^#/, '');

  // Parse hex values
  const r = parseInt(cleanHex.substring(0, 2), 16);
  const g = parseInt(cleanHex.substring(2, 4), 16);
  const b = parseInt(cleanHex.substring(4, 6), 16);

  return { r, g, b };
}

/**
 * Convert RGB to CSS rgba string
 *
 * @param rgb - RGB color object with r, g, b values (0-255)
 * @param opacity - Opacity value (0-1)
 * @returns CSS rgba string (e.g., "rgba(255, 85, 0, 0.5)")
 */
export function rgbToRgbaString(
  rgb: { r: number; g: number; b: number },
  opacity: number
): string {
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${opacity})`;
}
