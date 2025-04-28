export const getCroppedImg = async (imageSrc: string, crop: any): Promise<Blob> => {
  const image = await createImage(imageSrc)
  const canvas = document.createElement("canvas")
  const ctx = canvas.getContext("2d")!

  canvas.width = crop.width
  canvas.height = crop.height

  // Draw the cropped image
  ctx.drawImage(image, crop.x, crop.y, crop.width, crop.height, 0, 0, crop.width, crop.height)

  // Return as a blob with proper type
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Canvas is empty"))
          return
        }
        resolve(blob)
      },
      "image/png",
      1, // Quality parameter (1 = highest quality)
    )
  })
}

const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = "anonymous"
    img.src = url
    img.onload = () => resolve(img)
    img.onerror = (error) => {
      console.error("Image loading error:", error)
      reject(new Error("Failed to load image"))
    }
  })
