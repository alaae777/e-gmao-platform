export function toRelativeMediaUrl(absoluteUrl) {
  if (!absoluteUrl) return absoluteUrl;
  try {
    const url = new URL(absoluteUrl);
    return url.pathname;
  } catch {
    return absoluteUrl;
  }
}