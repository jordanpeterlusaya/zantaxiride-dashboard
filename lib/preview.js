export function previewSrc(url) {
  if (!url) return '';
  if (url.startsWith('http') || url.startsWith('/')) return url;
  return `https://www.zantaxiride.com/${url.replace(/^\//, '')}`;
}
