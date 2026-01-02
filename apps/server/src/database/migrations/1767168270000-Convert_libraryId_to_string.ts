import { MigrationInterface, QueryRunner } from 'typeorm';

export class ConvertLibraryIdToString1767168270000 implements MigrationInterface {
  name = 'ConvertLibraryIdToString1767168270000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "temporary_collection" (
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
    await queryRunner.query(`
      INSERT INTO "temporary_collection" (
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
    await queryRunner.query(`DROP TABLE "collection"`);
    await queryRunner.query(
      `ALTER TABLE "temporary_collection" RENAME TO "collection"`,
    );

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
        "ruleHandlerCronSchedule" varchar,
        CONSTRAINT "FK_collection" FOREIGN KEY ("collectionId") REFERENCES "collection" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
      )
    `);
    await queryRunner.query(`
      INSERT INTO "temporary_rule_group" (
        "id", "name", "description", "libraryId", "isActive", "collectionId", 
        "useRules", "dataType", "ruleHandlerCronSchedule"
      )
      SELECT 
        "id", "name", "description", CAST("libraryId" AS TEXT), "isActive", "collectionId",
        "useRules", "dataType", "ruleHandlerCronSchedule"
      FROM "rule_group"
    `);
    await queryRunner.query(`DROP TABLE "rule_group"`);
    await queryRunner.query(
      `ALTER TABLE "temporary_rule_group" RENAME TO "rule_group"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "temporary_rule_group" (
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
      INSERT INTO "temporary_rule_group" (
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
      `ALTER TABLE "temporary_rule_group" RENAME TO "rule_group"`,
    );

    await queryRunner.query(`
      CREATE TABLE "temporary_collection" (
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
      INSERT INTO "temporary_collection" (
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
      `ALTER TABLE "temporary_collection" RENAME TO "collection"`,
    );
  }
}
