/**
 * Accessibility Utilities
 * 
 * Helper functions for WCAG 2.1 AAA compliance
 */

/**
 * Generate ARIA label for screen readers
 */
export function generateAriaLabel(element: string, context?: string): string {
  if (context) {
    return `${element}, ${context}`
  }
  return element
}

/**
 * Check if element is keyboard accessible
 */
export function isKeyboardAccessible(element: HTMLElement): boolean {
  const tabIndex = element.getAttribute('tabindex')
  const role = element.getAttribute('role')
  const isInteractive = ['button', 'link', 'input', 'select', 'textarea'].includes(element.tagName.toLowerCase())
  
  return (
    tabIndex !== null ||
    role === 'button' ||
    role === 'link' ||
    isInteractive
  )
}

/**
 * Focus trap for modals
 */
export function trapFocus(container: HTMLElement): () => void {
  const focusableElements = container.querySelectorAll(
    'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
  )

  const firstElement = focusableElements[0] as HTMLElement
  const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement

  const handleTab = (e: KeyboardEvent) => {
    if (e.key !== 'Tab') return

    if (e.shiftKey) {
      if (document.activeElement === firstElement) {
        e.preventDefault()
        lastElement.focus()
      }
    } else {
      if (document.activeElement === lastElement) {
        e.preventDefault()
        firstElement.focus()
      }
    }
  }

  container.addEventListener('keydown', handleTab)
  firstElement?.focus()

  return () => {
    container.removeEventListener('keydown', handleTab)
  }
}

/**
 * Announce to screen readers
 */
export function announceToScreenReader(message: string, priority: 'polite' | 'assertive' = 'polite'): void {
  const announcement = document.createElement('div')
  announcement.setAttribute('role', 'status')
  announcement.setAttribute('aria-live', priority)
  announcement.setAttribute('aria-atomic', 'true')
  announcement.className = 'sr-only'
  announcement.textContent = message

  document.body.appendChild(announcement)

  setTimeout(() => {
    document.body.removeChild(announcement)
  }, 1000)
}

