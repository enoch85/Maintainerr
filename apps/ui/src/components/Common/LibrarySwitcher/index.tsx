import { useEffect, useRef } from 'react'
import { useMediaServerLibraries } from '../../../api/media-server'

interface ILibrarySwitcher {
  onLibraryChange: (libraryId: number) => void
  shouldShowAllOption?: boolean
}

const LibrarySwitcher = (props: ILibrarySwitcher) => {
  const { onLibraryChange, shouldShowAllOption } = props
  const {
    data: libraries,
    error: librariesError,
    isLoading: librariesLoading,
  } = useMediaServerLibraries()
  const lastAutoSelectedLibraryId = useRef<number | null>(null)

  const onSwitchLibrary = (event: { target: { value: string } }) => {
    onLibraryChange(+event.target.value)
  }

  useEffect(() => {
    if (!libraries || libraries.length === 0) {
      return
    }

    if (shouldShowAllOption === false) {
      const firstId = Number(libraries[0].id)

      if (
        !Number.isNaN(firstId) &&
        lastAutoSelectedLibraryId.current !== firstId
      ) {
        lastAutoSelectedLibraryId.current = firstId
        onLibraryChange(firstId)
      }
    } else {
      lastAutoSelectedLibraryId.current = null
    }
  }, [libraries, shouldShowAllOption, onLibraryChange])

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
                  <option value={9999}>All</option>
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
