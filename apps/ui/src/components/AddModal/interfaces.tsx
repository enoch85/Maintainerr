import { MediaItemType } from '@maintainerr/contracts'

export interface IAddModal {
  onCancel: () => void
  onSubmit: () => void
  libraryId?: string
  type?: MediaItemType
  plexId: number | string
  modalType: 'add' | 'exclude'
}

export interface ICollectionMedia {
  media?: []
  id: number | string
  plexId?: number | string
  libraryId?: string
  title: string
  description?: string
  isActive?: boolean
  arrAction?: number
  visibleOnRecommended?: boolean
  visibleOnHome?: boolean
  deleteAfterDays?: number
  type?: MediaItemType
  collectionMedia?: []
}

export interface IAlterableMediaDto {
  id: number | string
  index?: number
  parenIndex?: number
  type: MediaItemType
}
