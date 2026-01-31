import { useEffect, useRef } from 'react'

/**
 * Hook to lock the body scroll whenever a component is mounted or
 * whenever isLocked is set to true.
 *
 * This hook correctly uses useEffect because it synchronizes with an external
 * system (the DOM) - this is one of the legitimate use cases for useEffect
 * per React 19 best practices.
 *
 * You can pass in true always to cause a lock on mount/dismount of the component
 * using this hook.
 *
 * @param isLocked Toggle the scroll lock
 * @param disabled Disables the entire hook (allows conditional skipping of the lock)
 */
export const useLockBodyScroll = (
  isLocked: boolean,
  disabled?: boolean,
): void => {
  // Use ref to store original style to avoid re-renders and ensure cleanup uses correct value
  const originalStyleRef = useRef<string>('')

  useEffect(() => {
    if (typeof document === 'undefined' || disabled) {
      return
    }

    // Capture original style on first effect run
    if (!originalStyleRef.current) {
      originalStyleRef.current = window.getComputedStyle(document.body).overflow
    }

    if (isLocked) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = originalStyleRef.current
    }

    // Cleanup: restore original scroll behavior
    return () => {
      document.body.style.overflow = originalStyleRef.current
    }
  }, [isLocked, disabled])
}
