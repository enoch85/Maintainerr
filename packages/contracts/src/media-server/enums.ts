/**
 * Media server type enumeration
 * Identifies which media server implementation is being used
 */
export enum EMediaServerType {
  PLEX = 'plex',
  JELLYFIN = 'jellyfin',
}

/**
 * String type representation for media data types
 * Uses singular lowercase names to match API conventions
 */
export type MediaItemType = 'movie' | 'show' | 'season' | 'episode'

/**
 * MediaItemType values array for validation and iteration
 */
export const MediaItemTypes: MediaItemType[] = [
  'movie',
  'show',
  'season',
  'episode',
]

/**
 * MediaItemType values as uppercase strings for YAML serialization
 */
export const MediaDataTypeStrings: string[] = [
  'MOVIES',
  'SHOWS',
  'SEASONS',
  'EPISODES',
]

/**
 * Check if a MediaItemType matches a specific type
 */
export function isMediaType(
  itemType: MediaItemType | null | undefined,
  expectedType: MediaItemType,
): boolean {
  return itemType === expectedType
}

/**
 * Validate if a string is a valid MediaItemType
 */
export function isValidMediaItemType(type: string): type is MediaItemType {
  return MediaItemTypes.includes(type as MediaItemType)
}

/**
 * Convert EPlexDataType numeric enum to MediaItemType string.
 * This is used when the frontend sends numeric enum values that need
 * to be stored as string types in the database.
 *
 * @param plexType - The numeric EPlexDataType value (1=movie, 2=show, etc.)
 * @returns The corresponding MediaItemType string
 */
export function plexDataTypeToMediaItemType(
  plexType: number | undefined,
): MediaItemType {
  switch (plexType) {
    case 1: // EPlexDataType.MOVIES
      return 'movie'
    case 2: // EPlexDataType.SHOWS
      return 'show'
    case 3: // EPlexDataType.SEASONS
      return 'season'
    case 4: // EPlexDataType.EPISODES
      return 'episode'
    default:
      return 'movie'
  }
}

/**
 * Feature flags for capability detection
 * Different media servers support different features
 */
export enum EMediaServerFeature {
  /** Ability to set collection visibility (home/recommended) */
  COLLECTION_VISIBILITY = 'collection_visibility',
  /** Watchlist functionality via external API (Plex.tv) */
  WATCHLIST = 'watchlist',
  /** Central watch history endpoint (vs per-user iteration) */
  CENTRAL_WATCH_HISTORY = 'central_watch_history',
  /** Support for labels/tags on media items */
  LABELS = 'labels',
  /** Playlist management */
  PLAYLISTS = 'playlists',
}
