import { type MediaItem } from '@maintainerr/contracts'
import { clone } from 'lodash'
import { useContext, useState } from 'react'
import { useMediaServerLibraries } from '../../api/media-server'
import SearchContext from '../../contexts/search-context'
import GetApiHandler from '../../utils/ApiHandler'
import LibrarySwitcher from '../Common/LibrarySwitcher'
import OverviewContent from './Content'

const Overview = () => {
  const [isLoading, setIsLoading] = useState<boolean>(false)

  const [loadingExtra, setLoadingExtra] = useState<boolean>(false)

  const [data, setData] = useState<MediaItem[]>([])

  const [totalSize, setTotalSize] = useState<number>(999)

  const [selectedLibrary, setSelectedLibrary] = useState<string>()
  const [searchUsed, setSearchUsed] = useState<boolean>(false)

  const [pageCount, setPageCount] = useState<number>(0)
  const SearchCtx = useContext(SearchContext)

  const { data: libraries } = useMediaServerLibraries()

  const fetchAmount = 30

  // Track libraries changes to initialize selection
  const [lastLibrariesLength, setLastLibrariesLength] = useState<number>(0)
  if (libraries && libraries.length !== lastLibrariesLength) {
    setLastLibrariesLength(libraries.length)
    if (libraries.length > 0 && !selectedLibrary) {
      queueMicrotask(() => {
        setIsLoading(true)
        setSelectedLibrary(libraries[0].id)
      })
    }
  }

  // Track search text changes
  const [lastSearchText, setLastSearchText] = useState<string>('')
  if (SearchCtx.search.text !== lastSearchText) {
    const newSearchText = SearchCtx.search.text
    setLastSearchText(newSearchText)
    if (libraries && libraries.length > 0) {
      if (newSearchText !== '') {
        queueMicrotask(async () => {
          const resp = await GetApiHandler<MediaItem[]>(`/media-server/search/${newSearchText}`)
          setSearchUsed(true)
          setTotalSize(resp.length)
          setPageCount(resp.length * 50)
          setData(resp ? resp : [])
          setIsLoading(false)
        })
        setSelectedLibrary(libraries[0]?.id)
      } else {
        setSearchUsed(false)
        setData([])
        setTotalSize(999)
        setPageCount(0)
        setIsLoading(true)
      }
    }
  }

  // Track selected library changes for fetching
  const [lastSelectedLibrary, setLastSelectedLibrary] = useState<string | undefined>(undefined)
  if (selectedLibrary !== lastSelectedLibrary) {
    setLastSelectedLibrary(selectedLibrary)
    if (selectedLibrary && SearchCtx.search.text === '') {
      queueMicrotask(() => fetchData(selectedLibrary, data, totalSize, pageCount))
    }
  }

  const switchLib = (libraryId: string) => {
    setIsLoading(true)
    setPageCount(0)
    setTotalSize(999)
    setData([])
    setSearchUsed(false)
    setSelectedLibrary(libraryId)
  }

  const fetchData = async (currentLibrary: string, currentData: MediaItem[], currentTotalSize: number, currentPageCount: number) => {
    if (
      currentLibrary &&
      SearchCtx.search.text === '' &&
      currentTotalSize >= currentPageCount * fetchAmount
    ) {
      const askedLib = clone(currentLibrary)

      const resp: { totalSize: number; items: MediaItem[] } =
        await GetApiHandler(
          `/media-server/library/${currentLibrary}/content?page=${
            currentPageCount + 1
          }&limit=${fetchAmount}`,
        )

      if (askedLib === currentLibrary) {
        setTotalSize(resp.totalSize)
        setPageCount(currentPageCount + 1)
        setData([...currentData, ...(resp && resp.items ? resp.items : [])])
        setIsLoading(false)
      }
      setLoadingExtra(false)
      setIsLoading(false)
    }
  }

  return (
    <>
      <title>Overview - Maintainerr</title>
      <div className="w-full">
        {!searchUsed ? (
          <LibrarySwitcher
            shouldShowAllOption={false}
            onLibraryChange={switchLib}
          />
        ) : undefined}
        {selectedLibrary ? (
          <OverviewContent
            dataFinished={
              !(totalSize >= pageCount * fetchAmount)
            }
            fetchData={() => {
              setLoadingExtra(true)
              fetchData(selectedLibrary, data, totalSize, pageCount)
            }}
            loading={isLoading}
            extrasLoading={
              loadingExtra &&
              !isLoading &&
              totalSize >= pageCount * fetchAmount
            }
            data={data}
            libraryId={selectedLibrary!}
          />
        ) : undefined}
      </div>
    </>
  )
}
export default Overview
