import { type MediaItem } from '@maintainerr/contracts'
import { debounce } from 'lodash-es'
import { useState } from 'react'
import { useOutletContext, useParams } from 'react-router-dom'
import { ICollection, ICollectionMedia } from '../components/Collection'
import OverviewContent from '../components/Overview/Content'
import GetApiHandler from '../utils/ApiHandler'

interface CollectionContextType {
  collection: ICollection
}

const CollectionMediaPage = () => {
  const { collection } = useOutletContext<CollectionContextType>()
  const { id } = useParams<{ id: string }>()
  const [data, setData] = useState<MediaItem[]>([])
  const [media, setMedia] = useState<ICollectionMedia[]>([])
  // paging
  const [pageDataCount, setPageDataCount] = useState(0)
  const fetchAmount = 25
  const [totalSize, setTotalSize] = useState<number>(999)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [isLoadingExtra, setIsLoadingExtra] = useState<boolean>(false)

  const [page, setPage] = useState(0)

  // Define fetchData before it's used
  const fetchData = async (
    pageNum: number,
    prevData: MediaItem[],
    prevMedia: ICollectionMedia[],
  ) => {
    const resp: { totalSize: number; items: ICollectionMedia[] } =
      await GetApiHandler(
        `/collections/media/${id}/content/${pageNum}?size=${fetchAmount}`,
      )

    setTotalSize(resp.totalSize)
    setMedia([...prevMedia, ...resp.items])

    setData([
      ...prevData,
      ...resp.items.map((el) => {
        if (el.mediaData) {
          el.mediaData.maintainerrIsManual = el.isManual ? el.isManual : false
        }
        return el.mediaData ? el.mediaData : ({} as MediaItem)
      }),
    ])
    setIsLoading(false)
    setIsLoadingExtra(false)
  }

  // Handle scroll event
  const handleScroll = () => {
    if (
      window.innerHeight + document.documentElement.scrollTop >=
      document.documentElement.scrollHeight * 0.9
    ) {
      if (
        !isLoading &&
        !isLoadingExtra &&
        !(fetchAmount * (pageDataCount - 1) >= totalSize)
      ) {
        setPage(pageDataCount + 1)
      }
    }
  }

  // Handle page changes
  const handlePageChange = (newPage: number) => {
    if (newPage !== 0) {
      const newPageDataCount = pageDataCount + 1
      setPageDataCount(newPageDataCount)
      if (!isLoading) {
        setIsLoadingExtra(true)
      }
      fetchData(newPageDataCount, data, media)
    }
  }

  // Track page changes
  const [lastPage, setLastPage] = useState(page)
  if (lastPage !== page) {
    queueMicrotask(() => {
      setLastPage(page)
      handlePageChange(page)
    })
  }

  // Track data changes for auto-fetch more
  const [lastDataLength, setLastDataLength] = useState(data.length)
  if (lastDataLength !== data.length) {
    queueMicrotask(() => {
      setLastDataLength(data.length)
      if (
        !isLoading &&
        !isLoadingExtra &&
        window.innerHeight + document.documentElement.scrollTop >=
          document.documentElement.scrollHeight * 0.9 &&
        !(fetchAmount * (pageDataCount - 1) >= totalSize)
      ) {
        setPage((p) => p + 1)
      }
    })
  }

  // Initialize on mount
  const [initialized] = useState(() => {
    queueMicrotask(() => {
      setPage(1)
    })
    return true
  })
  void initialized

  // Set up scroll listener
  const [scrollListenerSetup] = useState(() => {
    const debouncedScroll = debounce(handleScroll, 200)
    queueMicrotask(() => {
      window.addEventListener('scroll', debouncedScroll)
    })
    return {
      cleanup: () => {
        window.removeEventListener('scroll', debouncedScroll)
        debouncedScroll.cancel()
      },
    }
  })
  void scrollListenerSetup

  // Create a copy of collection for rendering to avoid mutation
  const collectionInfoData = media.map((el) => {
    const collectionCopy = { ...collection, media: [] }
    return { ...el, collection: collectionCopy }
  })

  return (
    <OverviewContent
      dataFinished={true}
      fetchData={() => {}}
      loading={isLoading}
      data={data}
      libraryId={collection.libraryId}
      collectionPage={true}
      extrasLoading={
        isLoadingExtra && !isLoading && totalSize >= pageDataCount * fetchAmount
      }
      onRemove={(id: string) =>
        setTimeout(() => {
          setData((prevData) => prevData.filter((el) => el.id !== id))
          setMedia((prevMedia) =>
            prevMedia.filter((el) => el.mediaServerId !== id),
          )
        }, 500)
      }
      collectionInfo={collectionInfoData}
    />
  )
}

export default CollectionMediaPage
