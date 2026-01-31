import { useState } from 'react'
import { useMediaServerLibraries } from '../../../api/media-server'

interface ILibrarySwitcher {
  onLibraryChange: (libraryId: string) => void
  shouldShowAllOption?: boolean
}

const LibrarySwitcher = (props: ILibrarySwitcher) => {
  const { onLibraryChange, shouldShowAllOption } = props
  const {
    data: libraries,
    error: librariesError,
    isLoading: librariesLoading,
  } = useMediaServerLibraries()
  const [lastAutoSelectedLibraryId, setLastAutoSelectedLibraryId] = useState<string | null>(null)

  const onSwitchLibrary = (event: { target: { value: string } }) => {
    onLibraryChange(event.target.value)
  }

  // State-based change detection for auto-selecting first library
  const [lastLibraryState, setLastLibraryState] = useState<{ length: number; showAll: boolean | undefined } | null>(null)
  const currentState = { length: libraries?.length ?? 0, showAll: shouldShowAllOption }
  
  if (
    libraries && 
    libraries.length > 0 && 
    (lastLibraryState?.length !== currentState.length || lastLibraryState?.showAll !== currentState.showAll)
  ) {
    queueMicrotask(() => {
      setLastLibraryState(currentState)
      if (shouldShowAllOption === false) {
        const firstId = libraries[0].id
        if (firstId && lastAutoSelectedLibraryId !== firstId) {
          setLastAutoSelectedLibraryId(firstId)
          onLibraryChange(firstId)
        }
      } else {
        setLastAutoSelectedLibraryId(null)
      }
    })
  }

  return (
    <>
      <div className="mb-5 w-full">
        <form>
          <select
            className="border-zinc-600 hover:border-zinc-500 focus:border-zinc-500 focus:bg-opacity-100 focus:placeholder-zinc-400 focus:outline-none focus:ring-0"
            onChange={onSwitchLibrary}
          >
            {librariesLoading ? (
              <option disabled={true} value="">
                Loading libraries...
              </option>
            ) : librariesError ? (
              <option disabled={true} value="">
                Could not fetch libraries
              </option>
            ) : (
              <>
                {(props.shouldShowAllOption === undefined ||
                  props.shouldShowAllOption) && (
                  <option value="all">All</option>
                )}

                {libraries?.map((lib) => {
                  return (
                    <option key={lib.id} value={lib.id}>
                      {lib.title}
                    </option>
                  )
                })}
              </>
            )}
          </select>
        </form>
      </div>
    </>
  )
}

export default LibrarySwitcher
