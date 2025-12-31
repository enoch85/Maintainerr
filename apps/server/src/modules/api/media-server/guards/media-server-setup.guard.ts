import { CanActivate, Injectable, Logger } from '@nestjs/common';
import { SettingsService } from '../../../settings/settings.service';

/**
 * Guard that checks if a media server (Plex or Jellyfin) is configured.
 * Returns false (denies access with 403 Forbidden) if no media server is set up.
 *
 * Use this guard on endpoints that require a working media server connection.
 * For fresh installations, users must first select and configure their
 * media server before accessing protected endpoints.
 */
@Injectable()
export class MediaServerSetupGuard implements CanActivate {
  private readonly logger = new Logger(MediaServerSetupGuard.name);

  constructor(private readonly settingsService: SettingsService) {}

  async canActivate(): Promise<boolean> {
    const result = await this.settingsService.testSetup();
    this.logger.debug(
      `[DEBUG] MediaServerSetupGuard.canActivate() = ${result}, media_server_type = ${this.settingsService.media_server_type}`,
    );
    return result;
  }
}
