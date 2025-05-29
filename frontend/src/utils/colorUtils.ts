/**
 * BKDR Hash function - provides better distribution than simple hash
 */
function bkdrHash(str: string): number {
  let hash = 0;
  const seed = 131; // A prime number
  for (let i = 0; i < str.length; i++) {
    hash = hash * seed + str.charCodeAt(i);
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

/**
 * FNV-1a Hash function - another good option for color generation
 */
function fnvHash(str: string): number {
  let hash = 2166136261; // FNV offset basis
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash *= 16777619; // FNV prime
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

/**
 * Generate multiple hash values from a string for different color parameters
 */
function generateColorHashes(str: string): { hue: number; saturation: number; lightness: number } {
  const bkdr = bkdrHash(str);
  const fnv = fnvHash(str);
  
  // Use different parts of the hash for different parameters
  const hue = bkdr % 360;
  const saturation = (fnv % 100) / 100; // 0-1 range
  const lightness = ((bkdr >> 8) % 100) / 100 * 0.7 + 0.3; // 0-1 range, using different bits
  
  return { hue, saturation, lightness };
}

/**
 * Convert hash values to vibrant HSL colors with discrete levels
 */
function hashesToHSL(hashes: { hue: number; saturation: number; lightness: number }): string {
  const { hue, saturation, lightness } = hashes;
  
  // Vibrant colors with varied saturation and lightness
  const saturationOptions = [45, 60, 75]; // Three saturation levels
  const lightnessOptions = [75, 85, 90];  // Three lightness levels
  
  const selectedSaturation = saturationOptions[Math.floor(saturation * saturationOptions.length)];
  const selectedLightness = lightnessOptions[Math.floor(lightness * lightnessOptions.length)];
  
  return `hsl(${Math.round(hue)}, ${selectedSaturation}%, ${selectedLightness}%)`;
}

/**
 * Generate a background color for an insight subject based on its string content
 */
export function getInsightSubjectColor(insightSubject: string): string {
  if (!insightSubject) {
    return '#f9f9f9'; // Default light gray for empty/null subjects
  }
  
  const hashes = generateColorHashes(insightSubject);
  return hashesToHSL(hashes);
}

/**
 * Style object for insight subject badges
 */
export function getInsightSubjectStyle(insightSubject: string, fontSize: string = '12px'): React.CSSProperties {
  return {
    backgroundColor: getInsightSubjectColor(insightSubject),
    border: '1px solid #ccc',
    borderRadius: '4px',
    padding: '2px 6px',
    fontStyle: 'normal',
    fontSize: fontSize,
    display: 'inline-block',
  };
} 