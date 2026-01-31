import type { Dispatch, SetStateAction } from 'react'
import { useRef, useState, useSyncExternalStore } from 'react'

/**
 * A hook to help with debouncing state
 *
 * This hook basically acts the same as useState except it is also
 * returning a deobuncedValue that can be used for things like
 * debouncing input into a search field
 *
 * @param initialValue Initial state value
 * @param debounceTime Debounce time in ms
 */
const useDebouncedState = <S>(
  initialValue: S,
  debounceTime = 300,
): [S, S, Dispatch<SetStateAction<S>>] => {
  const [value, setValue] = useState(initialValue)
  const [finalValue, setFinalValue] = useState(initialValue)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastValueRef = useRef(value)

  // Use useSyncExternalStore to manage the debounce timer
  useSyncExternalStore(
    (onStoreChange) => {
      // Check if value changed and setup new timer
      if (lastValueRef.current !== value) {
        lastValueRef.current = value

        // Clear existing timeout
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current)
        }

        // Set new timeout
        timeoutRef.current = setTimeout(() => {
          setFinalValue(value)
        }, debounceTime)
      }

      // Cleanup on unmount
      return () => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current)
        }
      }
    },
    // Return value as snapshot to trigger re-subscription on value change
    () => value,
    () => initialValue,
  )

  return [value, finalValue, setValue]
}

export default useDebouncedState
