import {
  FilterIcon,
  SearchIcon,
  SortAscendingIcon,
  SortDescendingIcon,
} from '@heroicons/react/outline'
import { DocumentTextIcon } from '@heroicons/react/solid'
import {
  CollectionLogDto,
  CollectionLogMetaMediaAddedByRule,
  CollectionLogMetaMediaRemovedByRule,
  ECollectionLogType,
  isMetaActionedByRule,
} from '@maintainerr/contracts'
import { Editor } from '@monaco-editor/react'
import { debounce } from 'lodash-es'
import { useState } from 'react'
import YAML from 'yaml'
import { ICollection } from '../..'
import useDebouncedState from '../../../..//hooks/useDebouncedState'
import GetApiHandler from '../../../../utils/ApiHandler'
import Alert from '../../../Common/Alert'
import Badge from '../../../Common/Badge'
import LoadingSpinner, {
  SmallLoadingSpinner,
} from '../../../Common/LoadingSpinner'
import Modal from '../../../Common/Modal'
import Table from '../../../Common/Table'

interface ICollectionInfo {
  collection: ICollection
}

interface ICollectionInfoLogApiResponse {
  totalSize: number
  items: CollectionLogDto[]
}

const CollectionInfo = (props: ICollectionInfo) => {
  const [data, setData] = useState<CollectionLogDto[]>([])
  const [page, setPage] = useState(0)
  const [pageDataCount, setPageDataCount] = useState(0)
  const [totalSize, setTotalSize] = useState<number>(999)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [isLoadingExtra, setIsLoadingExtra] = useState<boolean>(false)
  const [searchFilter, debouncedSearchFilter, setSearchFilter] =
    useDebouncedState('')
  const [currentSort, setCurrentSort] = useState<'ASC' | 'DESC'>('DESC')
  const [currentFilter, setCurrentFilter] = useState<ECollectionLogType | -1>(
    -1,
  )
  const [showMeta, setShowMeta] =
    useState<Pick<LogMetaModalProps, 'meta' | 'title'>>()

  const fetchAmount = 25

  // Define fetchData function before it's used
  const fetchData = async (
    pageNum: number,
    prevData: CollectionLogDto[],
    search: string,
    sort: 'ASC' | 'DESC',
    filter: ECollectionLogType | -1,
  ) => {
    const resp = await GetApiHandler<ICollectionInfoLogApiResponse>(
      `/collections/logs/${props.collection.id}/content/${pageNum}?size=${fetchAmount}${
        search ? `&search=${search}` : ''
      }${sort ? `&sort=${sort}` : ''}${filter !== -1 ? `&filter=${filter}` : ''}`,
    )

    setTotalSize(resp.totalSize)
    setData([...prevData, ...resp.items])
    setIsLoading(false)
    setIsLoadingExtra(false)
  }

  // Define resetAll function before it's used
  const resetAll = () => {
    setIsLoading(true)
    setIsLoadingExtra(false)
    setPageDataCount(0)
    setPage(0)
    setTotalSize(999)
    setData([])
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
        setPage((p) => pageDataCount + 1)
      }
    }
  }

  // Handle page changes - fetch more data
  const handlePageChange = (newPage: number) => {
    if (newPage !== 0) {
      const newPageDataCount = pageDataCount + 1
      setPageDataCount(newPageDataCount)
      if (!isLoading) {
        setIsLoadingExtra(true)
      }
      fetchData(
        newPageDataCount,
        data,
        debouncedSearchFilter,
        currentSort,
        currentFilter,
      )
    }
  }

  // Handle filter/sort/search changes - reset and refetch
  const handleFilterChange = () => {
    resetAll()
    // Delay the fetch slightly to allow state to settle
    setTimeout(() => {
      setPage(1)
    }, 500)
  }

  // Track last filter values to detect changes
  const [lastFilters, setLastFilters] = useState({
    search: debouncedSearchFilter,
    sort: currentSort,
    filter: currentFilter,
  })

  // Check if filters changed during render and schedule update
  if (
    lastFilters.search !== debouncedSearchFilter ||
    lastFilters.sort !== currentSort ||
    lastFilters.filter !== currentFilter
  ) {
    queueMicrotask(() => {
      setLastFilters({
        search: debouncedSearchFilter,
        sort: currentSort,
        filter: currentFilter,
      })
      handleFilterChange()
    })
  }

  // Check if page changed during render and schedule fetch
  const [lastPage, setLastPage] = useState(page)
  if (lastPage !== page) {
    queueMicrotask(() => {
      setLastPage(page)
      handlePageChange(page)
    })
  }

  // Check if we need to fetch more data when data changes (page not filled)
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

  // Initialize data on mount using lazy state initializer
  const [initialized] = useState(() => {
    queueMicrotask(() => {
      setPage(1)
    })
    return true
  })
  void initialized

  // Set up scroll listener using lazy state initializer
  const [scrollListenerSetup] = useState(() => {
    const debouncedScroll = debounce(handleScroll, 200)
    queueMicrotask(() => {
      window.addEventListener('scroll', debouncedScroll)
    })
    // Return cleanup function stored for potential use
    return {
      cleanup: () => {
        window.removeEventListener('scroll', debouncedScroll)
        debouncedScroll.cancel()
      },
    }
  })
  void scrollListenerSetup

  return (
    <>
      <div className="w-full">
        <ul className="collection-info">
          <li key={`collection-info-added`}>
            <span>Date Added</span>
            <p className="collection-info-item">
              {props.collection.addDate
                ? new Date(props.collection.addDate).toLocaleDateString()
                : '-'}
            </p>
          </li>
          <li key={`collection-info-handled`}>
            <span>Handled media items</span>
            <p className="collection-info-item">
              {props.collection.handledMediaAmount}
            </p>
          </li>
          <li key={`collection-info-duration`}>
            <span>Last duration</span>
            <p className="collection-info-item">
              {props.collection.lastDurationInSeconds
                ? formatDuration(props.collection.lastDurationInSeconds)
                : '-'}
            </p>
          </li>
        </ul>

        <div className="heading mt-5 font-bold text-zinc-300">
          <h2>{'Logs'}</h2>
        </div>

        <div className="w-full pl-2 pr-2">
          {/* full container */}
          <div className="mb-2 flex flex-grow flex-col sm:flex-grow-0 sm:flex-row sm:justify-end">
            {/* search */}
            <div className="mr-2 mt-4 flex w-full flex-grow sm:w-1/2">
              <span className="inline-flex cursor-default items-center rounded-l-md border border-r-0 border-gray-500 bg-zinc-800 px-3 text-sm text-gray-100">
                <SearchIcon className="h-6 w-6" />
              </span>
              <input
                type="text"
                className="rounded-r-only"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value as string)}
              />
            </div>

            {/* sort/filter container */}
            <div className="mb-2 flex flex-1 flex-row justify-between sm:mb-0 sm:flex-none">
              {/* sort */}
              <div className="mr-2 mt-4 flex flex-grow sm:w-1/2">
                <span className="inline-flex cursor-default items-center rounded-l-md border border-r-0 border-gray-500 bg-zinc-800 px-3 text-sm text-gray-100">
                  {currentSort === 'DESC' ? (
                    <SortDescendingIcon className="h-6 w-6" />
                  ) : (
                    <SortAscendingIcon className="h-6 w-6" />
                  )}
                </span>
                <select
                  id="sort"
                  name="sort"
                  onChange={(e) => {
                    setCurrentSort(e.target.value as 'ASC' | 'DESC')
                  }}
                  value={currentSort}
                  className="rounded-r-only"
                >
                  <option value="DESC">{'Descending'}</option>
                  <option value="ASC">{'Ascending'}</option>
                </select>
              </div>

              {/* filter */}
              <div className="mt-4 flex flex-grow sm:w-1/2">
                <span className="inline-flex cursor-default items-center rounded-l-md border border-r-0 border-gray-500 bg-zinc-800 px-3 text-sm text-gray-100">
                  <FilterIcon className="h-6 w-6" />
                </span>
                <select
                  id="filter"
                  name="filter"
                  onChange={(e) => {
                    setCurrentFilter(+e.target.value as ECollectionLogType)
                  }}
                  value={currentFilter}
                  className="rounded-r-only"
                >
                  <option key={`filter-option-all`} value={-1}>
                    -
                  </option>
                  {Object.values(ECollectionLogType)
                    .filter((value) => typeof value === 'number')
                    .map((value, index) => {
                      return (
                        <option key={`filter-option-${index}`} value={+value}>
                          {ECollectionLogType[+value].charAt(0).toUpperCase() +
                            ECollectionLogType[+value].slice(1).toLowerCase()}
                        </option>
                      )
                    })}
                </select>
              </div>
            </div>
          </div>

          {/* data */}
          <Table>
            <thead>
              <tr>
                <Table.TH>{'DATE'}</Table.TH>
                <Table.TH>{'LABEL'}</Table.TH>
                <Table.TH>{'EVENT'}</Table.TH>
                <Table.TH></Table.TH>
              </tr>
            </thead>
            <Table.TBody>
              {isLoading ? (
                <tr>
                  <Table.TD colSpan={4} noPadding>
                    <LoadingSpinner />
                  </Table.TD>
                </tr>
              ) : (
                <>
                  {data.map((row: CollectionLogDto, index: number) => {
                    return (
                      <tr key={`log-list-${index}`}>
                        {/* timestamp */}
                        <Table.TD className="text-gray-300">
                          {new Date(row.timestamp).toLocaleString()}
                        </Table.TD>

                        {/* label */}
                        <Table.TD className="text-gray-300">
                          <Badge
                            badgeType={
                              row.type === ECollectionLogType.COLLECTION
                                ? 'danger'
                                : row.type === ECollectionLogType.MEDIA
                                  ? 'warning'
                                  : row.type === ECollectionLogType.RULES
                                    ? 'success'
                                    : 'default'
                            }
                          >
                            {ECollectionLogType[row.type].toUpperCase()}
                          </Badge>
                        </Table.TD>

                        {/* message */}
                        <Table.TD className="text-gray-300">
                          {row.message}
                          {row.meta && row.type == ECollectionLogType.MEDIA && (
                            <>
                              {' '}
                              {[
                                'media_added_manually',
                                'media_removed_manually',
                              ].includes(row.meta.type) && (
                                <span className="text-gray-400">(manual)</span>
                              )}
                            </>
                          )}
                        </Table.TD>
                        <Table.TD className="text-right">
                          {row.meta &&
                            row.type == ECollectionLogType.MEDIA &&
                            isMetaActionedByRule(row.meta) && (
                              <button
                                type="button"
                                className="rounded bg-amber-600 px-2 py-1 text-white shadow-md hover:bg-amber-500"
                                title="View Metadata"
                                onClick={() => {
                                  if (!isMetaActionedByRule(row.meta)) return

                                  setShowMeta({
                                    meta: row.meta,
                                    title: row.message,
                                  })
                                }}
                              >
                                <DocumentTextIcon className="h-5 w-5" />
                              </button>
                            )}
                        </Table.TD>
                      </tr>
                    )
                  })}

                  {isLoadingExtra ? (
                    <tr>
                      <Table.TD colSpan={2} noPadding>
                        <SmallLoadingSpinner className="m-auto mb-2 mt-2 w-8" />
                      </Table.TD>
                    </tr>
                  ) : undefined}
                </>
              )}
            </Table.TBody>
          </Table>
        </div>
      </div>
      {showMeta ? (
        <LogMetaModal onClose={() => setShowMeta(undefined)} {...showMeta} />
      ) : undefined}
    </>
  )
}

const formatDuration = (seconds: number) => {
  const intervals = [
    { label: 'year', seconds: 31536000 },
    { label: 'month', seconds: 2592000 },
    { label: 'day', seconds: 86400 },
    { label: 'hour', seconds: 3600 },
    { label: 'minute', seconds: 60 },
    { label: 'second', seconds: 1 },
  ]

  const parts = []

  for (const interval of intervals) {
    const value = Math.floor(seconds / interval.seconds)

    if (value > 0) {
      parts.push(`${value} ${interval.label}${value !== 1 ? 's' : ''}`)
      seconds -= value * interval.seconds
    }
  }

  return parts.length > 0 ? parts.join(', ') : '0 seconds'
}

export default CollectionInfo

interface LogMetaModalProps {
  onClose: () => void
  title: string
  meta: CollectionLogMetaMediaAddedByRule | CollectionLogMetaMediaRemovedByRule
}

const LogMetaModal = (props: LogMetaModalProps) => {
  const editorRef = useRef(undefined)

  function handleEditorDidMount(editor: any) {
    editorRef.current = editor
  }

  return (
    <div className={'h-full w-full'}>
      <Modal
        loading={false}
        backgroundClickable={false}
        onOk={props.onClose}
        okText={'Close'}
        okButtonType={'primary'}
        title={'Metadata'}
      >
        <div className="h-[80vh] overflow-hidden">
          <div className="mt-1">
            <Alert type="info">
              Below are the rule evaluation results that triggered this action.
              The output follows the same format as Test Media. Refer to the
              documentation for guidance on interpreting this output.
            </Alert>
          </div>
          <label htmlFor={`editor-field`} className="text-label mb-3">
            Output
          </label>
          <div className="editor-container h-full">
            <Editor
              options={{ readOnly: true, minimap: { enabled: false } }}
              defaultLanguage="yaml"
              theme="vs-dark"
              value={YAML.stringify(props.meta.data)}
              onMount={handleEditorDidMount}
            />
          </div>
        </div>
      </Modal>
    </div>
  )
}
