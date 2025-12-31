import { EMediaServerType } from '@maintainerr/contracts';
import {
  forwardRef,
  Inject,
  Injectable,
  Logger,
  Optional,
} from '@nestjs/common';
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
  private readonly logger = new Logger(MediaServerFactory.name);

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
    this.logger.debug('[DEBUG] getService() called');
    const settings = await this.settingsService.getSettings();

    // Handle case where getSettings returns error response
    if (!isSettings(settings)) {
      this.logger.debug(
        '[DEBUG] getService() - settings not valid, falling back to Plex',
      );
      // Fall back to Plex if settings unavailable
      return this.plexAdapter;
    }

    const serverType =
      (settings.media_server_type as EMediaServerType) || EMediaServerType.PLEX;
    this.logger.debug(`[DEBUG] getService() - serverType = ${serverType}`);

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
    this.logger.debug(`[DEBUG] getServiceByType(${serverType})`);
    switch (serverType) {
      case EMediaServerType.JELLYFIN:
        if (!this.jellyfinService) {
          this.logger.error('[DEBUG] Jellyfin service not available!');
          throw new Error('Jellyfin service not available');
        }
        // Initialize Jellyfin if not already initialized
        this.logger.debug(
          `[DEBUG] JellyfinService.isSetup() = ${this.jellyfinService.isSetup()}`,
        );
        if (!this.jellyfinService.isSetup()) {
          this.logger.debug('[DEBUG] Initializing JellyfinService...');
          await this.jellyfinService.initialize();
          this.logger.debug('[DEBUG] JellyfinService initialized');
        }
        return this.jellyfinService;

      case EMediaServerType.PLEX:
      default:
        // Initialize Plex if not already initialized
        this.logger.debug(
          `[DEBUG] PlexAdapter.isSetup() = ${this.plexAdapter.isSetup()}`,
        );
        if (!this.plexAdapter.isSetup()) {
          this.logger.debug('[DEBUG] Initializing PlexAdapter...');
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
