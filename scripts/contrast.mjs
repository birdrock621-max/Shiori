const pairs = [
  ['body text / light paper', '#20241f', '#f3ede1', 4.5],
  ['secondary text / light paper', '#4f574f', '#f3ede1', 4.5],
  ['muted text / light paper', '#626a62', '#f3ede1', 4.5],
  ['body text / raised paper', '#20241f', '#fffaf0', 4.5],
  ['white / hero scrim', '#ffffff', '#242521', 4.5],
  ['hero secondary / hero scrim', '#e8e8e4', '#242521', 4.5],
  ['orange CTA text / orange', '#ffffff', '#bd4c13', 4.5],
  ['catalogue text / dark', '#f4ede0', '#111510', 4.5],
  ['catalogue secondary / dark', '#bdc1b9', '#111510', 4.5],
  ['catalogue input text / input', '#f4ede0', '#090b09', 4.5],
  ['catalogue accent / dark', '#ff9b5e', '#111510', 4.5],
  ['dark button / paper', '#fffaf0', '#20241f', 4.5],
  ['focus ring / light paper', '#9f3f0d', '#f3ede1', 3],
  ['focus ring / dark', '#ff9b5e', '#111510', 3],
];

function rgb(hex) {
  const value = hex.replace('#', '');
  return [0, 2, 4].map((index) => Number.parseInt(value.slice(index, index + 2), 16));
}
function luminance(hex) {
  const values = rgb(hex).map((channel) => {
    const normalized = channel / 255;
    return normalized <= 0.04045 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
  });
  return values[0] * 0.2126 + values[1] * 0.7152 + values[2] * 0.0722;
}
function ratio(foreground, background) {
  const a = luminance(foreground);
  const b = luminance(background);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

const failures = [];
for (const [label, foreground, background, minimum] of pairs) {
  const value = ratio(foreground, background);
  if (value < minimum) failures.push(`${label}: ${value.toFixed(2)}:1 (requires ${minimum}:1)`);
}
if (failures.length) {
  console.error(`✗ Contrast audit failed:\n- ${failures.join('\n- ')}`);
  process.exitCode = 1;
} else {
  console.log(`✓ ${pairs.length} critical color pairs meet WCAG contrast targets`);
}
