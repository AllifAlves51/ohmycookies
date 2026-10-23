/** Raster formats the public buckets accept. SVG is left out on purpose: it
 * can carry scripts and the buckets are served publicly. */
const IMAGE_EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/avif": "avif",
}

export function isAllowedImage(file: File) {
  return file.type in IMAGE_EXTENSIONS
}

/** Extension derived from the MIME type, never from the user's file name. */
export function imageExtension(file: File) {
  return IMAGE_EXTENSIONS[file.type] ?? "jpg"
}

export const IMAGE_TYPE_ERROR = "Envie uma imagem JPG, PNG, WEBP, GIF ou AVIF"
