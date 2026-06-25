export function toCamelCase(s) {
  return s
    .trim()
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((word, i) =>
      i === 0
        ? word.toLowerCase()
        : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase(),
    )
    .join("")
}

export function toKebabCase(s) {
  return s
    .trim()
    .split(/[\s_]+/)
    .filter(Boolean)
    .map((w) => w.toLowerCase())
    .join("-")
}
