import { useState, useSyncExternalStore } from 'react'

/**
 * Hook to lock the body scroll whenever a component is mounted or
 * whenever isLocked is set to true.
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
  // Store the original style for cleanup
  const [originalStyle] = useState(() =>
    typeof document !== 'undefined'
      ? window.getComputedStyle(document.body).overflow
      : '',
  )

  // Use useSyncExternalStore to manage the body scroll state
  useSyncExternalStore(
    (onStoreChange) => {
      // Subscribe: apply the scroll lock
      if (typeof document !== 'undefined') {
        if (isLocked && !disabled) {
          document.body.style.overflow = 'hidden'
        } else if (!disabled) {
          document.body.style.overflow = originalStyle
        }
      }
      // Return cleanup function
      return () => {
        if (typeof document !== 'undefined' && !disabled) {
          document.body.style.overflow = originalStyle
        }
      }
    },
    // getSnapshot: return current lock state as string for comparison
    () => `${isLocked}-${disabled}`,
    // getServerSnapshot
    () => `${isLocked}-${disabled}`,
  )
}
