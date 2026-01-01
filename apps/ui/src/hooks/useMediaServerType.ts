import { useSettings, type MediaServerType } from '../api/settings'

/**
 * Hook to get the current media server type from settings.
 * Used for conditional rendering and feature detection in UI components.
 */
export function useMediaServerType() {
  const { data: settings, isLoading } = useSettings()

  const mediaServerType = settings?.media_server_type as
    | MediaServerType
    | null
    | undefined

  return {
    /** Current media server type ('plex', 'jellyfin', or null/undefined if not set) */
    mediaServerType,
    /** Whether settings are still loading */
    isLoading,
    /** True if Plex is the configured media server */
    isPlex: mediaServerType === 'plex',
    /** True if Jellyfin is the configured media server */
    isJellyfin: mediaServerType === 'jellyfin',
    /** True if no media server type has been selected yet */
    isNotConfigured: !mediaServerType,
  }
}
