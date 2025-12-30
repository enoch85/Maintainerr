import { Module } from '@nestjs/common';
import { SettingsModule } from '../../../modules/settings/settings.module';
import { MediaServerModule } from '../media-server/media-server.module';
import { PlexApiController } from './plex-api.controller';
import { PlexApiService } from './plex-api.service';

@Module({
  imports: [SettingsModule, MediaServerModule],
  controllers: [PlexApiController],
  providers: [PlexApiService],
  exports: [PlexApiService],
})
export class PlexApiModule {}
