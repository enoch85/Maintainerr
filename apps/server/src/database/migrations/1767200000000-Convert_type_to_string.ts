import { MigrationInterface, QueryRunner } from 'typeorm';

export class ConvertTypeToString1767200000000 implements MigrationInterface {
  name = 'ConvertTypeToString1767200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "collection" ADD COLUMN "type_new" varchar`,
    );
    await queryRunner.query(`
      UPDATE "collection" SET "type_new" = CASE
        WHEN "type" = 1 OR "type" = '1' THEN 'movie'
        WHEN "type" = 2 OR "type" = '2' THEN 'show'
        WHEN "type" = 3 OR "type" = '3' THEN 'season'
        WHEN "type" = 4 OR "type" = '4' THEN 'episode'
        ELSE 'movie'
      END
    `);
    await queryRunner.query(`
      CREATE TABLE "temporary_collection" (
        "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
        "mediaServerId" varchar,
        "mediaServerType" varchar DEFAULT 'plex',
        "libraryId" varchar NOT NULL,
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
    await queryRunner.query(`
      INSERT INTO "temporary_collection" (
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
    await queryRunner.query(`DROP TABLE "collection"`);
    await queryRunner.query(
      `ALTER TABLE "temporary_collection" RENAME TO "collection"`,
    );

    await queryRunner.query(
      `ALTER TABLE "exclusion" ADD COLUMN "type_new" varchar`,
    );
    await queryRunner.query(`
      UPDATE "exclusion" SET "type_new" = CASE
        WHEN "type" = 1 OR "type" = '1' THEN 'movie'
        WHEN "type" = 2 OR "type" = '2' THEN 'show'
        WHEN "type" = 3 OR "type" = '3' THEN 'season'
        WHEN "type" = 4 OR "type" = '4' THEN 'episode'
        ELSE NULL
      END
    `);
    await queryRunner.query(`
      CREATE TABLE "temporary_exclusion" (
        "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
        "mediaServerId" varchar NOT NULL,
        "ruleGroupId" integer,
        "parent" integer,
        "type" varchar
      )
    `);
    await queryRunner.query(`
      INSERT INTO "temporary_exclusion" ("id", "mediaServerId", "ruleGroupId", "parent", "type")
      SELECT "id", "mediaServerId", "ruleGroupId", "parent", "type_new"
      FROM "exclusion"
    `);
    await queryRunner.query(`DROP TABLE "exclusion"`);
    await queryRunner.query(
      `ALTER TABLE "temporary_exclusion" RENAME TO "exclusion"`,
    );

    await queryRunner.query(
      `ALTER TABLE "rule_group" ADD COLUMN "dataType_new" varchar`,
    );
    await queryRunner.query(`
      UPDATE "rule_group" SET "dataType_new" = CASE
        WHEN "dataType" = 1 OR "dataType" = '1' THEN 'movie'
        WHEN "dataType" = 2 OR "dataType" = '2' THEN 'show'
        WHEN "dataType" = 3 OR "dataType" = '3' THEN 'season'
        WHEN "dataType" = 4 OR "dataType" = '4' THEN 'episode'
        ELSE NULL
      END
    `);
    await queryRunner.query(`
      CREATE TABLE "temporary_rule_group" (
        "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
        "name" varchar NOT NULL,
        "description" varchar,
        "libraryId" varchar NOT NULL,
        "isActive" boolean NOT NULL DEFAULT (1),
        "collectionId" integer,
        "useRules" boolean NOT NULL DEFAULT (1),
        "dataType" varchar,
        "ruleHandlerCronSchedule" varchar
      )
    `);
    await queryRunner.query(`
      INSERT INTO "temporary_rule_group" (
        "id", "name", "description", "libraryId", "isActive",
        "collectionId", "useRules", "dataType", "ruleHandlerCronSchedule"
      )
      SELECT
        "id", "name", "description", "libraryId", "isActive",
        "collectionId", "useRules", "dataType_new", "ruleHandlerCronSchedule"
      FROM "rule_group"
    `);
    await queryRunner.query(`DROP TABLE "rule_group"`);
    await queryRunner.query(
      `ALTER TABLE "temporary_rule_group" RENAME TO "rule_group"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
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
      CREATE TABLE "temporary_rule_group" (
        "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
        "name" varchar NOT NULL,
        "description" varchar,
        "libraryId" varchar NOT NULL,
        "isActive" boolean NOT NULL DEFAULT (1),
        "collectionId" integer,
        "useRules" boolean NOT NULL DEFAULT (1),
        "dataType" integer,
        "ruleHandlerCronSchedule" varchar
      )
    `);
    await queryRunner.query(`
      INSERT INTO "temporary_rule_group" (
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
      `ALTER TABLE "temporary_rule_group" RENAME TO "rule_group"`,
    );

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
      CREATE TABLE "temporary_exclusion" (
        "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
        "mediaServerId" varchar NOT NULL,
        "ruleGroupId" integer,
        "parent" integer,
        "type" integer
      )
    `);
    await queryRunner.query(`
      INSERT INTO "temporary_exclusion" ("id", "mediaServerId", "ruleGroupId", "parent", "type")
      SELECT "id", "mediaServerId", "ruleGroupId", "parent", "type_old"
      FROM "exclusion"
    `);
    await queryRunner.query(`DROP TABLE "exclusion"`);
    await queryRunner.query(
      `ALTER TABLE "temporary_exclusion" RENAME TO "exclusion"`,
    );

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
      CREATE TABLE "temporary_collection" (
        "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
        "mediaServerId" varchar,
        "mediaServerType" varchar DEFAULT 'plex',
        "libraryId" varchar NOT NULL,
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
      INSERT INTO "temporary_collection" (
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
      `ALTER TABLE "temporary_collection" RENAME TO "collection"`,
    );
  }
}
