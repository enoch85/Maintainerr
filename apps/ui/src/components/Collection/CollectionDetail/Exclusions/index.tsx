import { type MediaItem } from '@maintainerr/contracts'
import { debounce } from 'lodash-es'
import { useState } from 'react'
import { ICollection } from '../..'
import GetApiHandler from '../../../../utils/ApiHandler'
import OverviewContent from '../../../Overview/Content'

interface ICollectionExclusions {
  collection: ICollection
  libraryId: string
}

export interface IExclusionMedia {
  id: number
  mediaServerId: string
  ruleGroupId: number
  parent: number
  type: number
  /** Server-agnostic media metadata */
  mediaData?: MediaItem
}

const CollectionExcludions = (props: ICollectionExclusions) => {
  const [data, setData] = useState<MediaItem[]>([])
  // paging
  const [pageDataCount, setPageDataCount] = useState(0)
  const fetchAmount = 25
  const [totalSize, setTotalSize] = useState<number>(999)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [isLoadingExtra, setIsLoadingExtra] = useState<boolean>(false)
  const [page, setPage] = useState(0)

  // Define fetchData before it's used
  const fetchData = async (pageNum: number, prevData: MediaItem[]) => {
    const resp: { totalSize: number; items: IExclusionMedia[] } =
      await GetApiHandler(
        `/collections/exclusions/${props.collection.id}/content/${pageNum}?size=${fetchAmount}`,
      )

    setTotalSize(resp.totalSize)

    setData([
      ...prevData,
      ...resp.items.map((el) => {
        if (el.mediaData) {
          el.mediaData.maintainerrExclusionId = el.id
          el.mediaData.maintainerrExclusionType = el.ruleGroupId
            ? 'specific'
            : 'global'
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
      fetchData(newPageDataCount, data)
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

  return (
    <OverviewContent
      dataFinished={true}
      fetchData={() => {}}
      loading={isLoading}
      data={data}
      libraryId={props.libraryId}
      collectionPage={true}
      collectionId={props.collection.id}
      extrasLoading={
        isLoadingExtra && !isLoading && totalSize >= pageDataCount * fetchAmount
      }
      onRemove={(id: string) =>
        setTimeout(() => {
          setData((prevData) => prevData.filter((el) => el.id !== id))
        }, 500)
      }
    />
  )
}
export default CollectionExcludions
