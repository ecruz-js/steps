const backendBase = (process.env.REACT_APP_BACKEND_URL || "").replace(/\/$/, "");

/** Same-origin `/api/files/...` hits the static host (HTML 200). Use backend base in production. */
export function backendFileUrl(path) {
  if (!path) return "";
  if (/^https?:\/\//i.test(path)) return path;
  if (path.startsWith("/api/") && backendBase) return `${backendBase}${path}`;
  return path;
}
