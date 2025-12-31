import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migration to convert numeric type columns to string values.
 *
 * Converts:
 * - 1 → 'movie'
 * - 2 → 'show'
 * - 3 → 'season'
 * - 4 → 'episode'
 *
 * Affected tables:
 * - collection.type
 * - exclusion.type
 * - rule_group.dataType
 */
export class ConvertTypeToString1767200000000 implements MigrationInterface {
  name = 'ConvertTypeToString1767200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // =====================================================
    // COLLECTION TABLE
    // =====================================================

    // Create new column
    await queryRunner.query(
      `ALTER TABLE "collection" ADD COLUMN "type_new" varchar`,
    );

    // Convert numeric values to strings
    await queryRunner.query(`
      UPDATE "collection" SET "type_new" = CASE
        WHEN "type" = 1 THEN 'movie'
        WHEN "type" = 2 THEN 'show'
        WHEN "type" = 3 THEN 'season'
        WHEN "type" = 4 THEN 'episode'
        ELSE 'movie'
      END
    `);

    // SQLite doesn't support DROP COLUMN directly, recreate the table
    await queryRunner.query(`
      CREATE TABLE "collection_new" (
        "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
        "mediaServerId" varchar,
        "mediaServerType" varchar DEFAULT 'plex',
        "libraryId" integer NOT NULL,
        "title" varchar NOT NULL,
        "description" varchar,
        "isActive" boolean NOT NULL DEFAULT (1),
        "arrAction" integer NOT NULL DEFAULT (0),
        "visibleOnRecommended" boolean NOT NULL DEFAULT (0),
        "visibleOnHome" boolean NOT NULL DEFAULT (0),
        "deleteAfterDays" integer,
        "manualCollection" boolean NOT NULL DEFAULT (0),
        "manualCollectionName" varchar DEFAULT '',
        "listExclusions" boolean NOT NULL DEFAULT (0),
        "forceOverseerr" boolean NOT NULL DEFAULT (0),
        "type" varchar NOT NULL DEFAULT 'movie',
        "keepLogsForMonths" integer NOT NULL DEFAULT (6),
        "addDate" date DEFAULT (CURRENT_TIMESTAMP),
        "handledMediaAmount" integer NOT NULL DEFAULT (0),
        "lastDurationInSeconds" integer NOT NULL DEFAULT (0),
        "tautulliWatchedPercentOverride" integer,
        "radarrSettingsId" integer,
        "sonarrSettingsId" integer,
        "sortTitle" varchar
      )
    `);

    // Copy data
    await queryRunner.query(`
      INSERT INTO "collection_new" (
        "id", "mediaServerId", "mediaServerType", "libraryId", "title", "description",
        "isActive", "arrAction", "visibleOnRecommended", "visibleOnHome", "deleteAfterDays",
        "manualCollection", "manualCollectionName", "listExclusions", "forceOverseerr",
        "type", "keepLogsForMonths", "addDate", "handledMediaAmount", "lastDurationInSeconds",
        "tautulliWatchedPercentOverride", "radarrSettingsId", "sonarrSettingsId", "sortTitle"
      )
      SELECT
        "id", "mediaServerId", "mediaServerType", "libraryId", "title", "description",
        "isActive", "arrAction", "visibleOnRecommended", "visibleOnHome", "deleteAfterDays",
        "manualCollection", "manualCollectionName", "listExclusions", "forceOverseerr",
        "type_new", "keepLogsForMonths", "addDate", "handledMediaAmount", "lastDurationInSeconds",
        "tautulliWatchedPercentOverride", "radarrSettingsId", "sonarrSettingsId", "sortTitle"
      FROM "collection"
    `);

    // Drop old table and rename new one
    await queryRunner.query(`DROP TABLE "collection"`);
    await queryRunner.query(
      `ALTER TABLE "collection_new" RENAME TO "collection"`,
    );

    // =====================================================
    // EXCLUSION TABLE
    // =====================================================

    // Create new column
    await queryRunner.query(
      `ALTER TABLE "exclusion" ADD COLUMN "type_new" varchar`,
    );

    // Convert numeric values to strings
    await queryRunner.query(`
      UPDATE "exclusion" SET "type_new" = CASE
        WHEN "type" = 1 THEN 'movie'
        WHEN "type" = 2 THEN 'show'
        WHEN "type" = 3 THEN 'season'
        WHEN "type" = 4 THEN 'episode'
        ELSE NULL
      END
    `);

    // Recreate table with string type
    await queryRunner.query(`
      CREATE TABLE "exclusion_new" (
        "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
        "mediaServerId" varchar NOT NULL,
        "ruleGroupId" integer,
        "parent" integer,
        "type" varchar
      )
    `);

    // Copy data
    await queryRunner.query(`
      INSERT INTO "exclusion_new" ("id", "mediaServerId", "ruleGroupId", "parent", "type")
      SELECT "id", "mediaServerId", "ruleGroupId", "parent", "type_new"
      FROM "exclusion"
    `);

    // Drop old table and rename new one
    await queryRunner.query(`DROP TABLE "exclusion"`);
    await queryRunner.query(
      `ALTER TABLE "exclusion_new" RENAME TO "exclusion"`,
    );

    // =====================================================
    // RULE_GROUP TABLE
    // =====================================================

    // Create new column
    await queryRunner.query(
      `ALTER TABLE "rule_group" ADD COLUMN "dataType_new" varchar`,
    );

    // Convert numeric values to strings
    await queryRunner.query(`
      UPDATE "rule_group" SET "dataType_new" = CASE
        WHEN "dataType" = 1 THEN 'movie'
        WHEN "dataType" = 2 THEN 'show'
        WHEN "dataType" = 3 THEN 'season'
        WHEN "dataType" = 4 THEN 'episode'
        ELSE NULL
      END
    `);

    // Recreate table with string type
    await queryRunner.query(`
      CREATE TABLE "rule_group_new" (
        "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
        "name" varchar NOT NULL,
        "description" varchar,
        "libraryId" integer NOT NULL,
        "isActive" boolean NOT NULL DEFAULT (1),
        "collectionId" integer,
        "useRules" boolean NOT NULL DEFAULT (1),
        "dataType" varchar,
        "ruleHandlerCronSchedule" varchar
      )
    `);

    // Copy data
    await queryRunner.query(`
      INSERT INTO "rule_group_new" (
        "id", "name", "description", "libraryId", "isActive",
        "collectionId", "useRules", "dataType", "ruleHandlerCronSchedule"
      )
      SELECT
        "id", "name", "description", "libraryId", "isActive",
        "collectionId", "useRules", "dataType_new", "ruleHandlerCronSchedule"
      FROM "rule_group"
    `);

    // Drop old table and rename new one
    await queryRunner.query(`DROP TABLE "rule_group"`);
    await queryRunner.query(
      `ALTER TABLE "rule_group_new" RENAME TO "rule_group"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // =====================================================
    // RULE_GROUP TABLE - Revert to numeric
    // =====================================================

    await queryRunner.query(
      `ALTER TABLE "rule_group" ADD COLUMN "dataType_old" integer`,
    );

    await queryRunner.query(`
      UPDATE "rule_group" SET "dataType_old" = CASE
        WHEN "dataType" = 'movie' THEN 1
        WHEN "dataType" = 'show' THEN 2
        WHEN "dataType" = 'season' THEN 3
        WHEN "dataType" = 'episode' THEN 4
        ELSE NULL
      END
    `);

    await queryRunner.query(`
      CREATE TABLE "rule_group_old" (
        "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
        "name" varchar NOT NULL,
        "description" varchar,
        "libraryId" integer NOT NULL,
        "isActive" boolean NOT NULL DEFAULT (1),
        "collectionId" integer,
        "useRules" boolean NOT NULL DEFAULT (1),
        "dataType" integer,
        "ruleHandlerCronSchedule" varchar
      )
    `);

    await queryRunner.query(`
      INSERT INTO "rule_group_old" (
        "id", "name", "description", "libraryId", "isActive",
        "collectionId", "useRules", "dataType", "ruleHandlerCronSchedule"
      )
      SELECT
        "id", "name", "description", "libraryId", "isActive",
        "collectionId", "useRules", "dataType_old", "ruleHandlerCronSchedule"
      FROM "rule_group"
    `);

    await queryRunner.query(`DROP TABLE "rule_group"`);
    await queryRunner.query(
      `ALTER TABLE "rule_group_old" RENAME TO "rule_group"`,
    );

    // =====================================================
    // EXCLUSION TABLE - Revert to numeric
    // =====================================================

    await queryRunner.query(
      `ALTER TABLE "exclusion" ADD COLUMN "type_old" integer`,
    );

    await queryRunner.query(`
      UPDATE "exclusion" SET "type_old" = CASE
        WHEN "type" = 'movie' THEN 1
        WHEN "type" = 'show' THEN 2
        WHEN "type" = 'season' THEN 3
        WHEN "type" = 'episode' THEN 4
        ELSE NULL
      END
    `);

    await queryRunner.query(`
      CREATE TABLE "exclusion_old" (
        "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
        "mediaServerId" varchar NOT NULL,
        "ruleGroupId" integer,
        "parent" integer,
        "type" integer
      )
    `);

    await queryRunner.query(`
      INSERT INTO "exclusion_old" ("id", "mediaServerId", "ruleGroupId", "parent", "type")
      SELECT "id", "mediaServerId", "ruleGroupId", "parent", "type_old"
      FROM "exclusion"
    `);

    await queryRunner.query(`DROP TABLE "exclusion"`);
    await queryRunner.query(
      `ALTER TABLE "exclusion_old" RENAME TO "exclusion"`,
    );

    // =====================================================
    // COLLECTION TABLE - Revert to numeric
    // =====================================================

    await queryRunner.query(
      `ALTER TABLE "collection" ADD COLUMN "type_old" integer`,
    );

    await queryRunner.query(`
      UPDATE "collection" SET "type_old" = CASE
        WHEN "type" = 'movie' THEN 1
        WHEN "type" = 'show' THEN 2
        WHEN "type" = 'season' THEN 3
        WHEN "type" = 'episode' THEN 4
        ELSE 1
      END
    `);

    await queryRunner.query(`
      CREATE TABLE "collection_old" (
        "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
        "mediaServerId" varchar,
        "mediaServerType" varchar DEFAULT 'plex',
        "libraryId" integer NOT NULL,
        "title" varchar NOT NULL,
        "description" varchar,
        "isActive" boolean NOT NULL DEFAULT (1),
        "arrAction" integer NOT NULL DEFAULT (0),
        "visibleOnRecommended" boolean NOT NULL DEFAULT (0),
        "visibleOnHome" boolean NOT NULL DEFAULT (0),
        "deleteAfterDays" integer,
        "manualCollection" boolean NOT NULL DEFAULT (0),
        "manualCollectionName" varchar DEFAULT '',
        "listExclusions" boolean NOT NULL DEFAULT (0),
        "forceOverseerr" boolean NOT NULL DEFAULT (0),
        "type" integer NOT NULL DEFAULT (1),
        "keepLogsForMonths" integer NOT NULL DEFAULT (6),
        "addDate" date DEFAULT (CURRENT_TIMESTAMP),
        "handledMediaAmount" integer NOT NULL DEFAULT (0),
        "lastDurationInSeconds" integer NOT NULL DEFAULT (0),
        "tautulliWatchedPercentOverride" integer,
        "radarrSettingsId" integer,
        "sonarrSettingsId" integer,
        "sortTitle" varchar
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
        "id", "mediaServerId", "mediaServerType", "libraryId", "title", "description",
        "isActive", "arrAction", "visibleOnRecommended", "visibleOnHome", "deleteAfterDays",
        "manualCollection", "manualCollectionName", "listExclusions", "forceOverseerr",
        "type_old", "keepLogsForMonths", "addDate", "handledMediaAmount", "lastDurationInSeconds",
        "tautulliWatchedPercentOverride", "radarrSettingsId", "sonarrSettingsId", "sortTitle"
      FROM "collection"
    `);

    await queryRunner.query(`DROP TABLE "collection"`);
    await queryRunner.query(
      `ALTER TABLE "collection_old" RENAME TO "collection"`,
    );
  }
}
