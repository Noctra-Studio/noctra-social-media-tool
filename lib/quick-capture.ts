export const OPEN_QUICK_CAPTURE_EVENT = 'noctra:open-quick-capture'

export function openQuickCapture(seedText?: string) {
  if (typeof window === 'undefined') {
    return
  }

  window.dispatchEvent(
    new CustomEvent(OPEN_QUICK_CAPTURE_EVENT, {
      detail: { seedText },
    })
  )
}
