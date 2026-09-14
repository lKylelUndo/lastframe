/**
 * Cloudinary responsive URL builder.
 *
 * Given a secure_url or publicId, returns multiple resolution variants
 * and a blur placeholder for progressive loading.
 *
 * No new dependencies — uses Cloudinary URL-based transformations.
 */

export interface ImageVariants {
  /** w_400 — thumbnail for mobile cards */
  thumb: string;
  /** w_800 — card / tablet */
  card: string;
  /** w_1600 — full-size desktop / detail page */
  full: string;
  /** Tiny blur-up placeholder (w_20 q_10 e_blur:100), data-URL safe for blurDataURL */
  blurPlaceholder: string;
}

/**
 * Insert Cloudinary transformation params into an existing secure_url.
 * If the url already has transformations, they are replaced.
 */
function withTransforms(url: string, transforms: string): string {
  // Cloudinary URLs follow: .../image/upload/[VERSION/]PUBLIC_ID
  // We insert transforms right after /upload/
  const uploadMarker = "/upload/";
  const idx = url.indexOf(uploadMarker);
  if (idx === -1) {
    // Fallback: just append (shouldn't happen with valid Cloudinary URLs)
    return `${url}${transforms}`;
  }
  const afterUpload = url.slice(idx + uploadMarker.length);
  // Strip any existing transforms (everything before /v or /public_id if no version)
  const versionMatch = afterUpload.match(/^\/?v\d+|^\/?[^v]/);
  const prefix = url.slice(0, idx + uploadMarker.length);
  return `${prefix}${transforms}/${afterUpload}`;
}

/**
 * Build responsive image variants from a Cloudinary URL or public ID.
 *
 * @param source - Either a full secure_url or a raw publicId string.
 * @param cloudName - Required if `source` is a publicId (not a full URL).
 */
export function buildImageVariants(
  source: string,
  cloudName?: string,
): ImageVariants {
  let baseUrl: string;

  if (source.startsWith("http")) {
    baseUrl = source;
  } else if (cloudName) {
    // Construct from publicId
    baseUrl = `https://res.cloudinary.com/${cloudName}/image/upload/${source}`;
  } else {
    throw new Error(
      "buildImageVariants: source is not a URL and no cloudName provided.",
    );
  }

  return {
    thumb: withTransforms(baseUrl, "w_400,q_auto,f_auto"),
    card: withTransforms(baseUrl, "w_800,q_auto,f_auto"),
    full: withTransforms(baseUrl, "w_1600,q_auto,f_auto"),
    blurPlaceholder: withTransforms(baseUrl, "w_20,q_10,e_blur:100"),
  };
}
