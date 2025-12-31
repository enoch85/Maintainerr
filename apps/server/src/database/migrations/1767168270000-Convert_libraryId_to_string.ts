import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migration to convert libraryId from INTEGER to TEXT (string)
 *
 * This change is needed to support Jellyfin's UUID-based library IDs
 * while maintaining compatibility with Plex's numeric library IDs.
 *
 * SQLite doesn't support ALTER COLUMN, so we need to:
 * 1. Create new tables with the correct column type
 * 2. Copy data (casting integers to text)
 * 3. Drop old tables
 * 4. Rename new tables
 */
export class ConvertLibraryIdToString1767168270000
  implements MigrationInterface
{
  name = 'ConvertLibraryIdToString1767168270000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // =====================================================
    // COLLECTION TABLE
    // =====================================================

    // 1. Get the current table schema
    const collectionColumns = await queryRunner.query(
      `PRAGMA table_info(collection)`,
    );

    // 2. Create a new table with libraryId as TEXT
    await queryRunner.query(`
      CREATE TABLE "collection_new" (
        "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
        "mediaServerId" varchar,
        "mediaServerType" varchar DEFAULT ('plex'),
        "libraryId" varchar NOT NULL,
        "title" varchar NOT NULL,
        "description" varchar,
        "isActive" boolean NOT NULL DEFAULT (1),
        "arrAction" integer NOT NULL DEFAULT (0),
        "visibleOnRecommended" boolean NOT NULL DEFAULT (0),
        "visibleOnHome" boolean NOT NULL DEFAULT (0),
        "deleteAfterDays" integer,
        "manualCollection" boolean NOT NULL DEFAULT (0),
        "manualCollectionName" varchar DEFAULT (''),
        "listExclusions" boolean NOT NULL DEFAULT (0),
        "forceOverseerr" boolean NOT NULL DEFAULT (0),
        "type" varchar NOT NULL DEFAULT ('movie'),
        "keepLogsForMonths" integer NOT NULL DEFAULT (6),
        "addDate" date DEFAULT (CURRENT_TIMESTAMP),
        "handledMediaAmount" integer NOT NULL DEFAULT (0),
        "lastDurationInSeconds" integer NOT NULL DEFAULT (0),
        "tautulliWatchedPercentOverride" integer,
        "radarrSettingsId" integer,
        "sonarrSettingsId" integer,
        "sortTitle" varchar,
        CONSTRAINT "FK_radarr" FOREIGN KEY ("radarrSettingsId") REFERENCES "radarr_settings" ("id") ON DELETE SET NULL ON UPDATE NO ACTION,
        CONSTRAINT "FK_sonarr" FOREIGN KEY ("sonarrSettingsId") REFERENCES "sonarr_settings" ("id") ON DELETE SET NULL ON UPDATE NO ACTION
      )
    `);

    // 3. Copy data, converting libraryId to string
    await queryRunner.query(`
      INSERT INTO "collection_new" (
        "id", "mediaServerId", "mediaServerType", "libraryId", "title", "description",
        "isActive", "arrAction", "visibleOnRecommended", "visibleOnHome", "deleteAfterDays",
        "manualCollection", "manualCollectionName", "listExclusions", "forceOverseerr",
        "type", "keepLogsForMonths", "addDate", "handledMediaAmount", "lastDurationInSeconds",
        "tautulliWatchedPercentOverride", "radarrSettingsId", "sonarrSettingsId", "sortTitle"
      )
      SELECT 
        "id", "mediaServerId", "mediaServerType", CAST("libraryId" AS TEXT), "title", "description",
        "isActive", "arrAction", "visibleOnRecommended", "visibleOnHome", "deleteAfterDays",
        "manualCollection", "manualCollectionName", "listExclusions", "forceOverseerr",
        "type", "keepLogsForMonths", "addDate", "handledMediaAmount", "lastDurationInSeconds",
        "tautulliWatchedPercentOverride", "radarrSettingsId", "sonarrSettingsId", "sortTitle"
      FROM "collection"
    `);

    // 4. Drop the old table
    await queryRunner.query(`DROP TABLE "collection"`);

    // 5. Rename the new table
    await queryRunner.query(
      `ALTER TABLE "collection_new" RENAME TO "collection"`,
    );

    // =====================================================
    // RULE_GROUP TABLE
    // =====================================================

    // 1. Create a new table with libraryId as TEXT
    await queryRunner.query(`
      CREATE TABLE "rule_group_new" (
        "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
        "name" varchar NOT NULL,
        "description" varchar,
        "libraryId" varchar NOT NULL,
        "isActive" boolean NOT NULL DEFAULT (1),
        "collectionId" integer,
        "useRules" boolean NOT NULL DEFAULT (1),
        "dataType" varchar,
        "ruleHandlerCronSchedule" varchar,
        CONSTRAINT "FK_collection" FOREIGN KEY ("collectionId") REFERENCES "collection" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
      )
    `);

    // 2. Copy data, converting libraryId to string
    await queryRunner.query(`
      INSERT INTO "rule_group_new" (
        "id", "name", "description", "libraryId", "isActive", "collectionId", 
        "useRules", "dataType", "ruleHandlerCronSchedule"
      )
      SELECT 
        "id", "name", "description", CAST("libraryId" AS TEXT), "isActive", "collectionId",
        "useRules", "dataType", "ruleHandlerCronSchedule"
      FROM "rule_group"
    `);

    // 3. Drop the old table
    await queryRunner.query(`DROP TABLE "rule_group"`);

    // 4. Rename the new table
    await queryRunner.query(
      `ALTER TABLE "rule_group_new" RENAME TO "rule_group"`,
    );

    // 5. Recreate foreign keys and indexes for rules table
    // The rules table has a foreign key to rule_group, we need to ensure it still works
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // =====================================================
    // RULE_GROUP TABLE (revert)
    // =====================================================

    await queryRunner.query(`
      CREATE TABLE "rule_group_old" (
        "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
        "name" varchar NOT NULL,
        "description" varchar,
        "libraryId" integer NOT NULL,
        "isActive" boolean NOT NULL DEFAULT (1),
        "collectionId" integer,
        "useRules" boolean NOT NULL DEFAULT (1),
        "dataType" varchar,
        "ruleHandlerCronSchedule" varchar,
        CONSTRAINT "FK_collection" FOREIGN KEY ("collectionId") REFERENCES "collection" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
      )
    `);

    await queryRunner.query(`
      INSERT INTO "rule_group_old" (
        "id", "name", "description", "libraryId", "isActive", "collectionId",
        "useRules", "dataType", "ruleHandlerCronSchedule"
      )
      SELECT 
        "id", "name", "description", CAST("libraryId" AS INTEGER), "isActive", "collectionId",
        "useRules", "dataType", "ruleHandlerCronSchedule"
      FROM "rule_group"
    `);

    await queryRunner.query(`DROP TABLE "rule_group"`);
    await queryRunner.query(
      `ALTER TABLE "rule_group_old" RENAME TO "rule_group"`,
    );

    // =====================================================
    // COLLECTION TABLE (revert)
    // =====================================================

    await queryRunner.query(`
      CREATE TABLE "collection_old" (
        "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
        "mediaServerId" varchar,
        "mediaServerType" varchar DEFAULT ('plex'),
        "libraryId" integer NOT NULL,
        "title" varchar NOT NULL,
        "description" varchar,
        "isActive" boolean NOT NULL DEFAULT (1),
        "arrAction" integer NOT NULL DEFAULT (0),
        "visibleOnRecommended" boolean NOT NULL DEFAULT (0),
        "visibleOnHome" boolean NOT NULL DEFAULT (0),
        "deleteAfterDays" integer,
        "manualCollection" boolean NOT NULL DEFAULT (0),
        "manualCollectionName" varchar DEFAULT (''),
        "listExclusions" boolean NOT NULL DEFAULT (0),
        "forceOverseerr" boolean NOT NULL DEFAULT (0),
        "type" varchar NOT NULL DEFAULT ('movie'),
        "keepLogsForMonths" integer NOT NULL DEFAULT (6),
        "addDate" date DEFAULT (CURRENT_TIMESTAMP),
        "handledMediaAmount" integer NOT NULL DEFAULT (0),
        "lastDurationInSeconds" integer NOT NULL DEFAULT (0),
        "tautulliWatchedPercentOverride" integer,
        "radarrSettingsId" integer,
        "sonarrSettingsId" integer,
        "sortTitle" varchar,
        CONSTRAINT "FK_radarr" FOREIGN KEY ("radarrSettingsId") REFERENCES "radarr_settings" ("id") ON DELETE SET NULL ON UPDATE NO ACTION,
        CONSTRAINT "FK_sonarr" FOREIGN KEY ("sonarrSettingsId") REFERENCES "sonarr_settings" ("id") ON DELETE SET NULL ON UPDATE NO ACTION
      )
    `);

    await queryRunner.query(`
      INSERT INTO "collection_old" (
        "id", "mediaServerId", "mediaServerType", "libraryId", "title", "description",
        "isActive", "arrAction", "visibleOnRecommended", "visibleOnHome", "deleteAfterDays",
        "manualCollection", "manualCollectionName", "listExclusions", "forceOverseerr",
        "type", "keepLogsForMonths", "addDate", "handledMediaAmount", "lastDurationInSeconds",
        "tautulliWatchedPercentOverride", "radarrSettingsId", "sonarrSettingsId", "sortTitle"
      )
      SELECT 
        "id", "mediaServerId", "mediaServerType", CAST("libraryId" AS INTEGER), "title", "description",
        "isActive", "arrAction", "visibleOnRecommended", "visibleOnHome", "deleteAfterDays",
        "manualCollection", "manualCollectionName", "listExclusions", "forceOverseerr",
        "type", "keepLogsForMonths", "addDate", "handledMediaAmount", "lastDurationInSeconds",
        "tautulliWatchedPercentOverride", "radarrSettingsId", "sonarrSettingsId", "sortTitle"
      FROM "collection"
    `);

    await queryRunner.query(`DROP TABLE "collection"`);
    await queryRunner.query(
      `ALTER TABLE "collection_old" RENAME TO "collection"`,
    );
  }
}
