import { MediaItemType } from '@maintainerr/contracts'

export interface IAddModal {
  onCancel: () => void
  onSubmit: () => void
  libraryId?: string
  type?: number
  plexId: number
  modalType: 'add' | 'exclude'
}

export interface ICollectionMedia {
  media?: []
  id: number
  plexId?: number
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
  id: number
  index?: number
  parenIndex?: number
  type: MediaItemType
}
