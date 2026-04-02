import html2canvas from 'html2canvas'

/**
 * Renders a DOM element to a high-quality PNG blob.
 * Optimized for 1080x1080px social media posts.
 */
export async function renderElementToPng(element: HTMLElement, scale: number = 2): Promise<Blob> {
  const canvas = await html2canvas(element, {
    scale,
    useCORS: true,
    allowTaint: true,
    backgroundColor: null,
    // Ensure we capture the full element even if it's transformed/scaled in the UI
    width: element.offsetWidth,
    height: element.offsetHeight,
    onclone: (clonedDoc) => {
      // You can modify the cloned element here if needed
      // (e.g., removing UI-only indicators)
      const clonedElement = clonedDoc.getElementById(element.id)
      if (clonedElement) {
        clonedElement.style.transform = 'none'
        clonedElement.style.position = 'relative'
        clonedElement.style.top = '0'
        clonedElement.style.left = '0'
      }
    }
  })

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob)
      else reject(new Error('Failed to create blob from canvas'))
    }, 'image/png', 1.0)
  })
}

/**
 * Batch renders multiple slides.
 */
export async function renderSlidesBatch(elements: HTMLElement[]): Promise<Blob[]> {
  const results: Blob[] = []
  for (const el of elements) {
    const blob = await renderElementToPng(el)
    results.push(blob)
  }
  return results
}
