/**
 * Browser-side image shrinking before upload. Every photo in the public
 * buckets is served straight from the Supabase CDN on each menu visit, so a
 * 3MB phone photo costs 3MB of egress per visitor. Resizing to the size the UI
 * actually draws and re-encoding as WebP keeps those files around 30–200KB.
 */

export type CompressOptions = {
  /** Longest side, in pixels, after resizing. */
  maxSize: number
  /** Encoder quality between 0 and 1. */
  quality?: number
  /** Keep transparency (logos, avatars). When WebP encoding isn't available
   * this falls back to PNG instead of JPEG. */
  keepAlpha?: boolean
}

async function decode(file: File): Promise<ImageBitmap | HTMLImageElement> {
  if (typeof createImageBitmap === "function") {
    // Honors EXIF orientation, so phone photos don't come out rotated.
    return createImageBitmap(file, { imageOrientation: "from-image" })
  }

  const url = URL.createObjectURL(file)
  try {
    const image = new Image()
    image.src = url
    await image.decode()
    return image
  } finally {
    URL.revokeObjectURL(url)
  }
}

function toBlob(canvas: HTMLCanvasElement, type: string, quality: number) {
  return new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, type, quality),
  )
}

const EXTENSIONS: Record<string, string> = {
  "image/webp": "webp",
  "image/jpeg": "jpg",
  "image/png": "png",
}

/**
 * Returns a resized WebP (or JPEG/PNG fallback) copy of `file`. If anything
 * goes wrong, or the result isn't smaller, the original file is returned so
 * the upload still works and the server-side size checks still apply.
 */
export async function compressImage(
  file: File,
  { maxSize, quality = 0.82, keepAlpha = false }: CompressOptions,
): Promise<File> {
  // Animated GIFs would lose their animation on a canvas round-trip.
  if (!file.type.startsWith("image/") || file.type === "image/gif") {
    return file
  }

  try {
    const source = await decode(file)
    const scale = Math.min(1, maxSize / Math.max(source.width, source.height))
    const width = Math.max(1, Math.round(source.width * scale))
    const height = Math.max(1, Math.round(source.height * scale))

    const canvas = document.createElement("canvas")
    canvas.width = width
    canvas.height = height
    const context = canvas.getContext("2d")
    if (!context) return file

    context.imageSmoothingQuality = "high"
    context.drawImage(source, 0, 0, width, height)
    if ("close" in source) source.close()

    let blob = await toBlob(canvas, "image/webp", quality)
    // Older Safari silently returns PNG when asked for WebP.
    if (!blob || blob.type !== "image/webp") {
      blob = keepAlpha
        ? await toBlob(canvas, "image/png", 1)
        : await toBlob(canvas, "image/jpeg", quality)
    }

    if (!blob || blob.size >= file.size) return file

    const baseName = file.name.replace(/\.[^.]+$/, "") || "image"
    return new File([blob], `${baseName}.${EXTENSIONS[blob.type] ?? "jpg"}`, {
      type: blob.type,
      lastModified: Date.now(),
    })
  } catch {
    return file
  }
}

/**
 * Replaces the file under `field` in `formData` with a compressed copy. Meant
 * to run inside a form action, before handing the data to a Server Action.
 */
export async function compressFormImage(
  formData: FormData,
  field: string,
  options: CompressOptions,
) {
  const file = formData.get(field)
  if (!(file instanceof File) || file.size === 0) return

  const compressed = await compressImage(file, options)
  if (compressed !== file) formData.set(field, compressed)
}

/** Sizes per use, matched to how large each image is drawn on screen. */
export const IMAGE_PRESETS = {
  /** Full-width cover on the menu and the login/signup side panel. */
  cover: { maxSize: 1600, quality: 0.8 },
  /** Product photos: cards, carousel and the detail sheet. */
  product: { maxSize: 1000, quality: 0.8 },
  /** Store logo, also used as the link preview image. */
  logo: { maxSize: 512, quality: 0.85, keepAlpha: true },
  /** Small round avatar in the admin header. */
  avatar: { maxSize: 256, quality: 0.85, keepAlpha: true },
} satisfies Record<string, CompressOptions>
