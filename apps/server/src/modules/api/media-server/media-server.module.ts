import { forwardRef, Module } from '@nestjs/common';
import { PlexApiModule } from '../plex-api/plex-api.module';
import { SettingsModule } from '../../settings/settings.module';
import { MediaServerSetupGuard } from './guards/media-server-setup.guard';
import { MediaServerController } from './media-server.controller';
import { MediaServerFactory } from './media-server.factory';
import { PlexAdapterService } from './plex/plex-adapter.service';
import { JellyfinModule } from './jellyfin/jellyfin.module';
import { JellyfinService } from './jellyfin/jellyfin.service';

/**
 * Media Server Module
 *
 * Provides abstraction layer for media server operations.
 * Supports both Plex and Jellyfin media servers.
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
 *
 * The MediaServerController provides unified HTTP endpoints at /api/media-server
 * that automatically route to the configured media server (Plex or Jellyfin).
 */
@Module({
  imports: [
    forwardRef(() => PlexApiModule),
    forwardRef(() => SettingsModule),
    JellyfinModule,
  ],
  controllers: [MediaServerController],
  providers: [
    PlexAdapterService,
    JellyfinService,
    MediaServerFactory,
    MediaServerSetupGuard,
  ],
  exports: [
    PlexAdapterService,
    JellyfinService,
    MediaServerFactory,
    MediaServerSetupGuard,
  ],
})
export class MediaServerModule {}
