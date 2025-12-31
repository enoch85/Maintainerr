import { EMediaServerType } from '@maintainerr/contracts';
import { forwardRef, Inject, Injectable, Optional } from '@nestjs/common';
import { Settings } from '../../settings/entities/settings.entities';
import { SettingsService } from '../../settings/settings.service';
import { JellyfinService } from './jellyfin/jellyfin-adapter.service';
import { IMediaServerService } from './media-server.interface';
import { PlexAdapterService } from './plex/plex-adapter.service';

/**
 * Type guard to check if settings response is a Settings object
 */
function isSettings(obj: unknown): obj is Settings {
  return obj !== null && typeof obj === 'object' && 'media_server_type' in obj;
}

/**
 * Factory for obtaining the appropriate media server service based on settings.
 *
 * Usage:
 * ```typescript
 * const mediaServer = await this.mediaServerFactory.getService();
 * const libraries = await mediaServer.getLibraries();
 * ```
 */
@Injectable()
export class MediaServerFactory {
  constructor(
    @Inject(forwardRef(() => SettingsService))
    private readonly settingsService: SettingsService,
    private readonly plexAdapter: PlexAdapterService,
    @Optional() private readonly jellyfinService?: JellyfinService,
  ) {}

  /**
   * Get the media server service based on current settings.
   * This method reads from settings on each call to support runtime configuration changes.
   */
  async getService(): Promise<IMediaServerService> {
    const settings = await this.settingsService.getSettings();

    // Handle case where getSettings returns error response
    if (!isSettings(settings)) {
      // Fall back to Plex if settings unavailable
      return this.plexAdapter;
    }

    const serverType =
      (settings.media_server_type as EMediaServerType) || EMediaServerType.PLEX;

    return await this.getServiceByType(serverType);
  }

  /**
   * Get a specific media server service by type.
   * Useful for testing or when the type is known.
   * Ensures the service is initialized before returning.
   */
  async getServiceByType(
    serverType: EMediaServerType,
  ): Promise<IMediaServerService> {
    switch (serverType) {
      case EMediaServerType.JELLYFIN:
        if (!this.jellyfinService) {
          throw new Error('Jellyfin service not available');
        }
        // Initialize Jellyfin if not already initialized
        if (!this.jellyfinService.isSetup()) {
          await this.jellyfinService.initialize();
        }
        return this.jellyfinService;

      case EMediaServerType.PLEX:
      default:
        // Initialize Plex if not already initialized
        if (!this.plexAdapter.isSetup()) {
          await this.plexAdapter.initialize();
        }
        return this.plexAdapter;
    }
  }

  /**
   * Get the currently configured media server type.
   */
  async getConfiguredServerType(): Promise<EMediaServerType> {
    const settings = await this.settingsService.getSettings();

    if (!isSettings(settings)) {
      return EMediaServerType.PLEX;
    }

    return (
      (settings.media_server_type as EMediaServerType) || EMediaServerType.PLEX
    );
  }
}
