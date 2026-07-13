/**
 * Returns whether the uploaded file is a PDF.
 */
export function isPdf(file: File): boolean {
  return file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
}

/**
 * Returns whether the uploaded file is an image.
 */
export function isImage(file: File): boolean {
  const imageTypes = ["image/png", "image/jpeg", "image/jpg"];
  return (
    imageTypes.includes(file.type) ||
    file.name.toLowerCase().endsWith(".png") ||
    file.name.toLowerCase().endsWith(".jpg") ||
    file.name.toLowerCase().endsWith(".jpeg")
  );
}

/**
 * Converts a browser/server File object to a base64 string.
 */
export async function fileToBase64(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  return buffer.toString("base64");
}
