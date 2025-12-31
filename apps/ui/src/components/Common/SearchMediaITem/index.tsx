import { EPlexDataType, type MediaItem } from '@maintainerr/contracts'
import { SingleValue } from 'react-select'
import AsyncSelect from 'react-select/async'
import GetApiHandler from '../../../utils/ApiHandler'

export interface IMediaOptions {
  id: string
  name: string
  type: EPlexDataType
}

interface ISearchMediaITem {
  onChange: (item: SingleValue<IMediaOptions>) => void
  mediatype?: EPlexDataType
  libraryId?: string
}

const SearchMediaItem = (props: ISearchMediaITem) => {
  const loadData = async (query: string): Promise<IMediaOptions[]> => {
    const resp: MediaItem[] = await GetApiHandler(
      `/media-server/library/${props.libraryId}/content/search/${query}?type=${props.mediatype == EPlexDataType.MOVIES ? EPlexDataType.MOVIES : EPlexDataType.SHOWS}`,
    )
    const output = resp.map((el) => {
      return {
        id: el.id,
        name: el.title,
        type: el.type === 'movie' ? EPlexDataType.MOVIES : EPlexDataType.SHOWS,
      } as IMediaOptions
    })

    return output
  }

  return (
    <>
      <AsyncSelect
        className="react-select-container"
        classNamePrefix="react-select"
        isClearable
        getOptionLabel={(option: IMediaOptions) => option.name}
        getOptionValue={(option: IMediaOptions) => option.id}
        defaultValue={[]}
        defaultOptions={undefined}
        loadOptions={loadData}
        placeholder="Start typing... "
        onChange={(selectedItem) => {
          props.onChange(selectedItem)
        }}
      />
    </>
  )
}

export default SearchMediaItem
