import { MediaItemType } from '@maintainerr/contracts'
import { useState } from 'react'
import GetApiHandler, { PostApiHandler } from '../../utils/ApiHandler'
import Alert from '../Common/Alert'
import FormItem from '../Common/FormItem'
import Modal from '../Common/Modal'
import { IAddModal, IAlterableMediaDto, ICollectionMedia } from './interfaces'

const AddModal = (props: IAddModal) => {
  const [selectedCollection, setSelectedCollection] = useState<
    number | string
  >()
  const [loading, setLoading] = useState(true)
  const [alert, setAlert] = useState(false)
  const [forceRemovalcheck, setForceRemovalCheck] = useState(false)
  const [selectedAction, setSelectedAction] = useState<number>(0)
  // For show only
  const [selectedSeasons, setSelectedSeasons] = useState<number | string>(-1)
  const [selectedEpisodes, setSelectedEpisodes] = useState<number | string>(-1)

  const [collectionOptions, setCollectionOptions] = useState<
    ICollectionMedia[]
  >([])
  const [seasonOptions, setSeasonOptions] = useState<ICollectionMedia[]>([
    {
      id: -1,
      title: 'All seasons',
    },
  ])
  const [episodeOptions, setEpisodeOptions] = useState<ICollectionMedia[]>([
    {
      id: -1,
      title: 'All episodes',
    },
  ])

  // Compute inline - React Compiler will optimize
  const origCollectionOptions =
    props.modalType === 'exclude'
      ? [
          {
            id: -1,
            title: 'All collections',
          },
        ]
      : []

  const selectedMediaId =
    props.type === 'movie'
      ? -1
      : selectedEpisodes !== -1
        ? selectedEpisodes
        : selectedSeasons

  const selectedContext: MediaItemType =
    props.type === 'show'
      ? selectedEpisodes !== -1
        ? 'episode'
        : selectedSeasons !== -1
          ? 'season'
          : 'show'
      : 'movie'

  const handleCancel = () => {
    props.onCancel()
  }

  const handleOk = () => {
    const collection = effectiveSelectedCollection
    if (collection !== undefined) {
      const mediaDto: IAlterableMediaDto = {
        id: selectedMediaId,
        type: selectedContext,
      }

      if (props.modalType === 'add') {
        PostApiHandler(`/collections/media/add`, {
          mediaId: props.mediaServerId,
          context: mediaDto,
          collectionId: collection,
          action: selectedAction,
        })
      } else {
        PostApiHandler('/rules/exclusion', {
          mediaId: props.mediaServerId,
          context: mediaDto,
          collectionId: collection !== -1 ? collection : undefined,
          action: selectedAction,
        })
      }

      props.onSubmit()
    } else {
      setAlert(true)
    }
  }

  const handleForceRemoval = () => {
    setForceRemovalCheck(false)
    if (props.modalType === 'add') {
      PostApiHandler(`/collections/media/add`, {
        mediaId: props.mediaServerId,
        context: { id: -1, type: props.type },
        collectionId: undefined,
        action: 1,
      })
    }
    props.onSubmit()
  }

  // Fetch collections based on current selection state
  const fetchCollections = async (
    type: string,
    seasons: number | string,
    episodes: number | string,
    baseOptions: ICollectionMedia[],
  ) => {
    setLoading(true)
    if (type === 'show') {
      if (episodes !== -1) {
        const resp = await GetApiHandler(`/collections?typeId=episode`)
        setCollectionOptions([...baseOptions, ...resp])
      } else if (seasons !== -1) {
        const [resp, resp2] = await Promise.all([
          GetApiHandler(`/collections?typeId=season`),
          GetApiHandler(`/collections?typeId=episode`),
        ])
        setCollectionOptions([...baseOptions, ...resp, ...resp2])
      } else {
        const [resp, resp2, resp3] = await Promise.all([
          GetApiHandler(`/collections?typeId=show`),
          GetApiHandler(`/collections?typeId=season`),
          GetApiHandler(`/collections?typeId=episode`),
        ])
        setCollectionOptions([...baseOptions, ...resp, ...resp2, ...resp3])
      }
    } else {
      const resp = await GetApiHandler(`/collections?typeId=movie`)
      setCollectionOptions([...baseOptions, ...resp])
    }
    setLoading(false)
  }

  // Handler for season selection change
  const handleSeasonChange = async (newSeason: number | string) => {
    setSelectedSeasons(newSeason)
    setSelectedEpisodes(-1)
    setEpisodeOptions([{ id: -1, title: 'All episodes' }])

    if (newSeason !== -1) {
      setLoading(true)
      const resp: { id: string; index: number }[] = await GetApiHandler(
        `/media-server/meta/${newSeason}/children`,
      )
      setEpisodeOptions([
        { id: -1, title: 'All episodes' },
        ...resp.map((el) => ({
          id: el.id,
          title: `Episode ${el.index}`,
        })),
      ])
    }

    await fetchCollections(props.type, newSeason, -1, origCollectionOptions)
  }

  // Handler for episode selection change
  const handleEpisodeChange = async (newEpisode: number | string) => {
    setSelectedEpisodes(newEpisode)
    await fetchCollections(
      props.type,
      selectedSeasons,
      newEpisode,
      origCollectionOptions,
    )
  }

  // Initialize data on first render using lazy state initializer pattern
  const [initialized] = useState(() => {
    // Schedule async initialization
    queueMicrotask(async () => {
      if (props.type === 'show') {
        // get seasons
        const resp: { id: string; title: string }[] = await GetApiHandler(
          `/media-server/meta/${props.mediaServerId}/children`,
        )
        setSeasonOptions([
          { id: -1, title: 'All seasons' },
          ...resp.map((el) => ({
            id: el.id,
            title: el.title,
          })),
        ])
      }

      // Fetch initial collections
      await fetchCollections(props.type, -1, -1, origCollectionOptions)
    })
    return true
  })
  // Suppress unused variable warning
  void initialized

  // Auto-select first collection when options change
  const effectiveSelectedCollection =
    selectedCollection ?? collectionOptions[0]?.id

  return (
    <>
      <Modal
        loading={loading}
        backgroundClickable={false}
        onCancel={handleCancel}
        onOk={handleOk}
        okDisabled={false}
        title={
          props.modalType === 'add' ? 'Add / Remove Media' : 'Exclude Media'
        }
        okText={'Submit'}
        okButtonType={'primary'}
        onSecondary={() => {}}
        specialButtonType="warning"
        specialDisabled={props.modalType !== 'add'}
        specialText={'Remove from all collections'}
        onSpecial={
          props.modalType === 'add'
            ? () => {
                setForceRemovalCheck(true)
              }
            : undefined
        }
        iconSvg={''}
      >
        {forceRemovalcheck ? (
          <Modal
            loading={loading}
            backgroundClickable={false}
            onCancel={() => setForceRemovalCheck(false)}
            onOk={handleForceRemoval}
            okDisabled={false}
            title={'Confirmation Required'}
            okText={'Submit'}
          >
            Are you certain you want to proceed? This action will remove the{' '}
            {props.modalType === 'add' ? 'media ' : 'exclusion '}
            from all collections. For shows, this entails removing all
            associated {props.modalType === 'add' ? '' : 'exclusions for '}
            seasons and episodes as well.
          </Modal>
        ) : undefined}

        {alert ? (
          <Alert title="Please select a collection" type="warning" />
        ) : undefined}

        <div className="mt-6">
          <FormItem label="Action">
            <select
              name={`Action-field`}
              id={`Action-field`}
              value={selectedAction}
              onChange={(e: { target: { value: string } }) => {
                setSelectedAction(+e.target.value)
              }}
            >
              <option value={0}>Add</option>
              <option value={1}>Remove</option>
            </select>
          </FormItem>

          {/* For shows */}
          {props.type === 'show' ? (
            <FormItem label="Seasons">
              <select
                name={`Seasons-field`}
                id={`Seasons-field`}
                value={selectedSeasons}
                onChange={(e: { target: { value: string } }) => {
                  const value = e.target.value
                  handleSeasonChange(value === '-1' ? -1 : value)
                }}
              >
                {seasonOptions.map((e: ICollectionMedia) => {
                  return (
                    <option key={e.id} value={e.id}>
                      {e.title}
                    </option>
                  )
                })}
              </select>
            </FormItem>
          ) : undefined}
          {/* For shows and specific seasons */}
          {props.type === 'show' && selectedSeasons !== -1 ? (
            <FormItem label="Episodes">
              <select
                name={`Episodes-field`}
                id={`Episodes-field`}
                value={selectedEpisodes}
                onChange={(e: { target: { value: string } }) => {
                  const value = e.target.value
                  handleEpisodeChange(value === '-1' ? -1 : value)
                }}
              >
                {episodeOptions.map((e: ICollectionMedia) => {
                  return (
                    <option key={e.id} value={e.id}>
                      {e.title}
                    </option>
                  )
                })}
              </select>
            </FormItem>
          ) : undefined}

          <FormItem label="Collection">
            <select
              name={`Collection-field`}
              id={`Collection-field`}
              value={effectiveSelectedCollection}
              onChange={(e: { target: { value: string } }) => {
                setSelectedCollection(+e.target.value)
              }}
            >
              {collectionOptions?.map((e: ICollectionMedia) => {
                return (
                  <option key={e?.id} value={e?.id}>
                    {e?.title}
                  </option>
                )
              })}
            </select>
          </FormItem>
        </div>
      </Modal>
    </>
  )
}
export default AddModal
