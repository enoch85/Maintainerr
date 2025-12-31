import { EPlexDataType, type MediaItem } from '@maintainerr/contracts'

export interface ICollection {
  id?: number
  plexId?: number
  libraryId: string
  title: string
  description?: string
  isActive: boolean
  visibleOnRecommended?: boolean
  visibleOnHome?: boolean
  deleteAfterDays?: number
  listExclusions?: boolean
  forceOverseerr?: boolean
  type: EPlexDataType
  arrAction: number
  media: ICollectionMedia[]
  manualCollection: boolean
  manualCollectionName: string
  addDate: Date
  handledMediaAmount: number
  lastDurationInSeconds: number
  keepLogsForMonths: number
  tautulliWatchedPercentOverride?: number
  radarrSettingsId?: number
  sonarrSettingsId?: number
  sortTitle?: string
}

export interface ICollectionMedia {
  id: number
  collectionId: number
  plexId: number
  tmdbId: number
  tvdbid: number
  addDate: Date
  image_path: string
  isManual: boolean
  collection: ICollection
  /** Media metadata from the media server */
  plexData?: MediaItem
}
