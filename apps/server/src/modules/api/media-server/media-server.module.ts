import { forwardRef, Module } from '@nestjs/common';
import { PlexApiModule } from '../plex-api/plex-api.module';
import { SettingsModule } from '../../settings/settings.module';
import { MediaServerFactory } from './media-server.factory';
import { PlexAdapterService } from './plex/plex-adapter.service';

/**
 * Media Server Module
 *
 * Provides abstraction layer for media server operations.
 * Currently supports Plex, with Jellyfin support to be added.
 *
 * Usage:
 * ```typescript
 * // In a service or controller
 * constructor(private readonly mediaServerFactory: MediaServerFactory) {}
 *
 * async someMethod() {
 *   const mediaServer = await this.mediaServerFactory.getService();
 *   const libraries = await mediaServer.getLibraries();
 * }
 * ```
 */
@Module({
  imports: [
    forwardRef(() => PlexApiModule),
    forwardRef(() => SettingsModule),
  ],
  providers: [
    PlexAdapterService,
    MediaServerFactory,
  ],
  exports: [
    PlexAdapterService,
    MediaServerFactory,
  ],
})
export class MediaServerModule {}
