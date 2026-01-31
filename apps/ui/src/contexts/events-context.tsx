import { MaintainerrEvent } from '@maintainerr/contracts'
import { createContext, use, useRef, useState, useSyncExternalStore } from 'react'
import ReconnectingEventSource from 'reconnecting-eventsource'
import { API_BASE_PATH } from '../utils/ApiHandler'

const EventsContext = createContext<EventSource | undefined>(undefined)

export const EventsProvider = (props: any) => {
  // Use state with lazy initializer to store the EventSource - reads during render are safe
  const [eventSource] = useState<EventSource | undefined>(() => {
    const es = new ReconnectingEventSource(`${API_BASE_PATH}/api/events/stream`)

    es.onerror = (e) => {
      console.error('EventSource failed:', e)
    }

    return es
  })

  return <EventsContext value={eventSource} {...props} />
}

export const useEvent = <T,>(
  type: MaintainerrEvent,
  listener?: (event: T) => any,
) => {
  const context = use(EventsContext)
  // Store listener in a ref that we update only inside the subscription callback
  const listenerRef = useRef(listener)

  const lastEventRef = useRef<T | undefined>(undefined)
  const subscribersRef = useRef(new Set<() => void>())

  // Use useSyncExternalStore for safe subscription to external event source
  const lastEvent = useSyncExternalStore(
    (callback) => {
      if (!context) return () => {}

      // Update listener ref inside subscription - this is not during render
      listenerRef.current = listener
      subscribersRef.current.add(callback)

      const options: AddEventListenerOptions = {
        passive: true,
      }

      const parserListener = (ev: MessageEvent) => {
        try {
          const parsed = JSON.parse(ev.data) as T
          lastEventRef.current = parsed
          listenerRef.current?.(parsed)
          // Notify all subscribers
          subscribersRef.current.forEach((cb) => cb())
        } catch (error) {
          console.error('Error parsing event data:', error)
        }
      }

      context.addEventListener(type, parserListener, options)

      return () => {
        subscribersRef.current.delete(callback)
        context.removeEventListener(type, parserListener, options)
      }
    },
    () => lastEventRef.current,
    () => undefined, // Server snapshot
  )

  return lastEvent
}
