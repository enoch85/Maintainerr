import { type MediaItem } from '@maintainerr/contracts'
import { clone } from 'lodash'
import { useContext, useEffect, useRef, useState } from 'react'
import { useMediaServerLibraries } from '../../api/media-server'
import SearchContext from '../../contexts/search-context'
import GetApiHandler from '../../utils/ApiHandler'
import LibrarySwitcher from '../Common/LibrarySwitcher'
import OverviewContent from './Content'

const Overview = () => {
  // const [isLoading, setIsLoading] = useState<Boolean>(false)
  const loadingRef = useRef<boolean>(false)

  const [loadingExtra, setLoadingExtra] = useState<boolean>(false)

  const [data, setData] = useState<MediaItem[]>([])
  const dataRef = useRef<MediaItem[]>([])

  const [totalSize, setTotalSize] = useState<number>(999)
  const totalSizeRef = useRef<number>(999)

  const [selectedLibrary, setSelectedLibrary] = useState<string>()
  const selectedLibraryRef = useRef<string | undefined>(undefined)
  const [searchUsed, setSearchUsed] = useState<boolean>(false)

  const pageData = useRef<number>(0)
  const SearchCtx = useContext(SearchContext)

  const {
    data: libraries,
    error: librariesError,
    isLoading: librariesLoading,
  } = useMediaServerLibraries()

  // Debug logging
  console.log(
    '[DEBUG] Overview: libraries =',
    libraries,
    'error =',
    librariesError,
    'loading =',
    librariesLoading,
  )

  const fetchAmount = 30

  const setIsLoading = (val: boolean) => {
    loadingRef.current = val
  }

  useEffect(() => {
    console.log('[DEBUG] Overview useEffect[libraries]: libraries =', libraries)
    if (!libraries || libraries.length === 0) {
      console.log('[DEBUG] Overview: No libraries available yet')
      return
    }

    setTimeout(() => {
      if (
        loadingRef.current &&
        data.length === 0 &&
        SearchCtx.search.text === ''
      ) {
        console.log(
          '[DEBUG] Overview: Switching to library',
          selectedLibrary || libraries[0].id,
        )
        switchLib(selectedLibrary ? selectedLibrary : libraries[0].id)
      }
    }, 300)

    // Cleanup on unmount
    return () => {
      setData([])
      dataRef.current = []
      totalSizeRef.current = 999
      pageData.current = 0
    }
  }, [libraries])

  useEffect(() => {
    if (!libraries || libraries.length === 0) return

    if (SearchCtx.search.text !== '') {
      GetApiHandler(`/media-server/search/${SearchCtx.search.text}`).then(
        (resp: MediaItem[]) => {
          setSearchUsed(true)
          setTotalSize(resp.length)
          pageData.current = resp.length * 50
          setData(resp ? resp : [])
          setIsLoading(false)
        },
      )
      setSelectedLibrary(libraries[0]?.id)
    } else {
      setSearchUsed(false)
      setData([])
      setTotalSize(999)
      pageData.current = 0
      setIsLoading(true)
      fetchData()
    }
  }, [SearchCtx.search.text])

  useEffect(() => {
    selectedLibraryRef.current = selectedLibrary
    fetchData()
  }, [selectedLibrary])

  useEffect(() => {
    dataRef.current = data
  }, [data])

  useEffect(() => {
    totalSizeRef.current = totalSize
  }, [totalSize])

  const switchLib = (libraryId: string) => {
    console.log(
      '[DEBUG] Overview.switchLib() called with libraryId =',
      libraryId,
    )
    // get all movies & shows from plex
    setIsLoading(true)
    pageData.current = 0
    setTotalSize(999)
    setData([])
    dataRef.current = []
    setSearchUsed(false)
    setSelectedLibrary(libraryId)
  }

  const fetchData = async () => {
    console.log(
      '[DEBUG] Overview.fetchData() called, selectedLibraryRef =',
      selectedLibraryRef.current,
    )
    // This function didn't work with normal state. Used a state/ref hack as a result.
    if (
      selectedLibraryRef.current &&
      SearchCtx.search.text === '' &&
      totalSizeRef.current >= pageData.current * fetchAmount
    ) {
      const askedLib = clone(selectedLibraryRef.current)

      console.log(
        '[DEBUG] Overview.fetchData() - fetching /media-server/library/' +
          selectedLibraryRef.current +
          '/content',
      )
      const resp: { totalSize: number; items: MediaItem[] } =
        await GetApiHandler(
          `/media-server/library/${selectedLibraryRef.current}/content?page=${
            pageData.current + 1
          }&limit=${fetchAmount}`,
        )

      console.log('[DEBUG] Overview.fetchData() - response:', resp)

      if (askedLib === selectedLibraryRef.current) {
        // check lib again, we don't want to change array when lib was changed
        setTotalSize(resp.totalSize)
        pageData.current = pageData.current + 1
        setData([...dataRef.current, ...(resp && resp.items ? resp.items : [])])
        setIsLoading(false)
      }
      setLoadingExtra(false)
      setIsLoading(false)
    } else {
      console.log('[DEBUG] Overview.fetchData() - skipped, conditions not met')
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
              !(totalSizeRef.current >= pageData.current * fetchAmount)
            }
            fetchData={() => {
              setLoadingExtra(true)
              fetchData()
            }}
            loading={loadingRef.current}
            extrasLoading={
              loadingExtra &&
              !loadingRef.current &&
              totalSizeRef.current >= pageData.current * fetchAmount
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
