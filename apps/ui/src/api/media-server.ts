import { useQuery, UseQueryOptions } from '@tanstack/react-query'
import GetApiHandler from '../utils/ApiHandler'

/**
 * Unified Media Server API
 *
 * This module provides React Query hooks for interacting with the media server
 * abstraction layer. These hooks automatically work with whichever media server
 * is configured (Plex, Jellyfin, etc.) without frontend code needing to know
 * which one is active.
 */

// ============================================================
// TYPES
// ============================================================

/**
 * Unified library type that works across all media servers
 */
export interface MediaLibrary {
  id: string
  title: string
  type: 'movie' | 'show' | 'music' | 'photo' | 'other'
  itemCount?: number
}

/**
 * Unified user type
 */
export interface MediaUser {
  id: string
  name: string
  thumb?: string
}

/**
 * Unified media item type
 */
export interface MediaItem {
  id: string
  title: string
  type: 'movie' | 'show' | 'season' | 'episode' | 'unknown'
  year?: number
  thumb?: string
  addedAt?: string
  guid?: string
  providerIds?: Record<string, string>
}

/**
 * Unified collection type
 */
export interface MediaCollection {
  id: string
  title: string
  summary?: string
  thumb?: string
  childCount?: number
}

/**
 * Watch history record
 */
export interface WatchRecord {
  userId: string
  itemId: string
  watchedAt?: string
  playCount?: number
}

/**
 * Paged result wrapper
 */
export interface PagedResult<T> {
  items: T[]
  totalSize: number
  offset: number
  limit: number
}

/**
 * Server status info
 */
export interface MediaServerStatus {
  id: string
  version: string
  name?: string
  platform?: string
}

// ============================================================
// QUERY KEYS
// ============================================================

export const mediaServerKeys = {
  all: ['media-server'] as const,
  status: () => [...mediaServerKeys.all, 'status'] as const,
  type: () => [...mediaServerKeys.all, 'type'] as const,
  libraries: () => [...mediaServerKeys.all, 'libraries'] as const,
  library: (id: string) => [...mediaServerKeys.all, 'library', id] as const,
  libraryContent: (id: string, page?: number, limit?: number) =>
    [...mediaServerKeys.library(id), 'content', { page, limit }] as const,
  libraryCollections: (id: string) =>
    [...mediaServerKeys.library(id), 'collections'] as const,
  users: () => [...mediaServerKeys.all, 'users'] as const,
  user: (id: string) => [...mediaServerKeys.all, 'user', id] as const,
  metadata: (id: string) => [...mediaServerKeys.all, 'meta', id] as const,
  metadataChildren: (id: string) =>
    [...mediaServerKeys.metadata(id), 'children'] as const,
  watchHistory: (id: string) =>
    [...mediaServerKeys.metadata(id), 'seen'] as const,
  collection: (id: string) =>
    [...mediaServerKeys.all, 'collection', id] as const,
  collectionChildren: (id: string) =>
    [...mediaServerKeys.collection(id), 'children'] as const,
  search: (query: string) => [...mediaServerKeys.all, 'search', query] as const,
}

// ============================================================
// HOOKS
// ============================================================

type UseMediaServerLibrariesQueryKey = ReturnType<
  typeof mediaServerKeys.libraries
>
type UseMediaServerLibrariesOptions = Omit<
  UseQueryOptions<
    MediaLibrary[],
    Error,
    MediaLibrary[],
    UseMediaServerLibrariesQueryKey
  >,
  'queryKey' | 'queryFn'
>

/**
 * Hook to fetch libraries from the configured media server.
 * Works with both Plex and Jellyfin.
 */
export const useMediaServerLibraries = (
  options?: UseMediaServerLibrariesOptions,
) => {
  return useQuery<
    MediaLibrary[],
    Error,
    MediaLibrary[],
    UseMediaServerLibrariesQueryKey
  >({
    queryKey: mediaServerKeys.libraries(),
    queryFn: async () => {
      console.log(
        '[DEBUG] useMediaServerLibraries - fetching /media-server/libraries',
      )
      const result = await GetApiHandler<MediaLibrary[]>(
        '/media-server/libraries',
      )
      console.log('[DEBUG] useMediaServerLibraries - response:', result)
      return result
    },
    staleTime: 0,
    ...options,
  })
}

type UseMediaServerStatusQueryKey = ReturnType<typeof mediaServerKeys.status>
type UseMediaServerStatusOptions = Omit<
  UseQueryOptions<
    MediaServerStatus | undefined,
    Error,
    MediaServerStatus | undefined,
    UseMediaServerStatusQueryKey
  >,
  'queryKey' | 'queryFn'
>

/**
 * Hook to fetch media server status.
 */
export const useMediaServerStatus = (options?: UseMediaServerStatusOptions) => {
  return useQuery<
    MediaServerStatus | undefined,
    Error,
    MediaServerStatus | undefined,
    UseMediaServerStatusQueryKey
  >({
    queryKey: mediaServerKeys.status(),
    queryFn: async () => {
      return await GetApiHandler<MediaServerStatus | undefined>('/media-server')
    },
    staleTime: 30000, // 30 seconds
    ...options,
  })
}

type UseMediaServerTypeQueryKey = ReturnType<typeof mediaServerKeys.type>
type UseMediaServerTypeOptions = Omit<
  UseQueryOptions<
    { type: string },
    Error,
    { type: string },
    UseMediaServerTypeQueryKey
  >,
  'queryKey' | 'queryFn'
>

/**
 * Hook to get the type of the configured media server.
 */
export const useMediaServerType = (options?: UseMediaServerTypeOptions) => {
  return useQuery<
    { type: string },
    Error,
    { type: string },
    UseMediaServerTypeQueryKey
  >({
    queryKey: mediaServerKeys.type(),
    queryFn: async () => {
      return await GetApiHandler<{ type: string }>('/media-server/type')
    },
    staleTime: Infinity, // Server type doesn't change
    ...options,
  })
}

type UseMediaServerUsersQueryKey = ReturnType<typeof mediaServerKeys.users>
type UseMediaServerUsersOptions = Omit<
  UseQueryOptions<MediaUser[], Error, MediaUser[], UseMediaServerUsersQueryKey>,
  'queryKey' | 'queryFn'
>

/**
 * Hook to fetch users from the configured media server.
 */
export const useMediaServerUsers = (options?: UseMediaServerUsersOptions) => {
  return useQuery<MediaUser[], Error, MediaUser[], UseMediaServerUsersQueryKey>(
    {
      queryKey: mediaServerKeys.users(),
      queryFn: async () => {
        return await GetApiHandler<MediaUser[]>('/media-server/users')
      },
      staleTime: 60000, // 1 minute
      ...options,
    },
  )
}

type UseMediaServerCollectionsQueryKey = ReturnType<
  typeof mediaServerKeys.libraryCollections
>
type UseMediaServerCollectionsOptions = Omit<
  UseQueryOptions<
    MediaCollection[],
    Error,
    MediaCollection[],
    UseMediaServerCollectionsQueryKey
  >,
  'queryKey' | 'queryFn'
>

/**
 * Hook to fetch collections from a library.
 */
export const useMediaServerCollections = (
  libraryId: string,
  options?: UseMediaServerCollectionsOptions,
) => {
  return useQuery<
    MediaCollection[],
    Error,
    MediaCollection[],
    UseMediaServerCollectionsQueryKey
  >({
    queryKey: mediaServerKeys.libraryCollections(libraryId),
    queryFn: async () => {
      return await GetApiHandler<MediaCollection[]>(
        `/media-server/library/${libraryId}/collections`,
      )
    },
    staleTime: 30000, // 30 seconds
    enabled: !!libraryId,
    ...options,
  })
}

type UseMediaServerMetadataQueryKey = ReturnType<
  typeof mediaServerKeys.metadata
>
type UseMediaServerMetadataOptions = Omit<
  UseQueryOptions<
    MediaItem | undefined,
    Error,
    MediaItem | undefined,
    UseMediaServerMetadataQueryKey
  >,
  'queryKey' | 'queryFn'
>

/**
 * Hook to fetch metadata for a specific item.
 */
export const useMediaServerMetadata = (
  itemId: string,
  options?: UseMediaServerMetadataOptions,
) => {
  return useQuery<
    MediaItem | undefined,
    Error,
    MediaItem | undefined,
    UseMediaServerMetadataQueryKey
  >({
    queryKey: mediaServerKeys.metadata(itemId),
    queryFn: async () => {
      return await GetApiHandler<MediaItem | undefined>(
        `/media-server/meta/${itemId}`,
      )
    },
    staleTime: 60000, // 1 minute
    enabled: !!itemId,
    ...options,
  })
}

type UseMediaServerSearchQueryKey = ReturnType<typeof mediaServerKeys.search>
type UseMediaServerSearchOptions = Omit<
  UseQueryOptions<
    MediaItem[],
    Error,
    MediaItem[],
    UseMediaServerSearchQueryKey
  >,
  'queryKey' | 'queryFn'
>

/**
 * Hook to search media server content.
 */
export const useMediaServerSearch = (
  query: string,
  options?: UseMediaServerSearchOptions,
) => {
  return useQuery<
    MediaItem[],
    Error,
    MediaItem[],
    UseMediaServerSearchQueryKey
  >({
    queryKey: mediaServerKeys.search(query),
    queryFn: async () => {
      return await GetApiHandler<MediaItem[]>(
        `/media-server/search/${encodeURIComponent(query)}`,
      )
    },
    staleTime: 30000, // 30 seconds
    enabled: !!query && query.length > 0,
    ...options,
  })
}

// Re-export types for convenience
export type UseMediaServerLibrariesResult = ReturnType<
  typeof useMediaServerLibraries
>
export type UseMediaServerStatusResult = ReturnType<typeof useMediaServerStatus>
export type UseMediaServerTypeResult = ReturnType<typeof useMediaServerType>
export type UseMediaServerUsersResult = ReturnType<typeof useMediaServerUsers>
export type UseMediaServerCollectionsResult = ReturnType<
  typeof useMediaServerCollections
>
export type UseMediaServerMetadataResult = ReturnType<
  typeof useMediaServerMetadata
>
export type UseMediaServerSearchResult = ReturnType<typeof useMediaServerSearch>
