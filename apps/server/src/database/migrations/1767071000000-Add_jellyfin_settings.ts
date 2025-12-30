import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddJellyfinSettings1767071000000 implements MigrationInterface {
  name = 'AddJellyfinSettings1767071000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add media_server_type column - NULL by default for new installs
    // Existing installs with Plex configured will have this set to 'plex' after migration
    await queryRunner.query(
      `ALTER TABLE settings ADD COLUMN "media_server_type" varchar`,
    );

    // For existing installations, if Plex is configured, set media_server_type to 'plex'
    await queryRunner.query(
      `UPDATE settings SET media_server_type = 'plex' WHERE plex_hostname IS NOT NULL AND plex_auth_token IS NOT NULL`,
    );

    // Add Jellyfin-specific columns
    await queryRunner.query(
      `ALTER TABLE settings ADD COLUMN "jellyfin_url" varchar`,
    );
    await queryRunner.query(
      `ALTER TABLE settings ADD COLUMN "jellyfin_api_key" varchar`,
    );
    await queryRunner.query(
      `ALTER TABLE settings ADD COLUMN "jellyfin_user_id" varchar`,
    );
    await queryRunner.query(
      `ALTER TABLE settings ADD COLUMN "jellyfin_server_name" varchar`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE settings DROP COLUMN "media_server_type"`,
    );
    await queryRunner.query(`ALTER TABLE settings DROP COLUMN "jellyfin_url"`);
    await queryRunner.query(
      `ALTER TABLE settings DROP COLUMN "jellyfin_api_key"`,
    );
    await queryRunner.query(
      `ALTER TABLE settings DROP COLUMN "jellyfin_user_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE settings DROP COLUMN "jellyfin_server_name"`,
    );
  }
}
