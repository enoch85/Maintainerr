import { MigrationInterface, QueryRunner } from 'typeorm';

export class RenamePlexIdToMediaServerId1767043644000 implements MigrationInterface {
  name = 'RenamePlexIdToMediaServerId1767043644000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "collection" ADD COLUMN "mediaServerId" varchar`,
    );
    await queryRunner.query(
      `UPDATE "collection" SET "mediaServerId" = CAST("plexId" AS TEXT) WHERE "plexId" IS NOT NULL`,
    );
    await queryRunner.query(`ALTER TABLE "collection" DROP COLUMN "plexId"`);
    await queryRunner.query(
      `ALTER TABLE "collection" ADD COLUMN "mediaServerType" varchar DEFAULT 'plex'`,
    );

    await queryRunner.query(
      `ALTER TABLE "collection_media" ADD COLUMN "mediaServerId" varchar`,
    );
    await queryRunner.query(
      `UPDATE "collection_media" SET "mediaServerId" = CAST("plexId" AS TEXT) WHERE "plexId" IS NOT NULL`,
    );
    await queryRunner.query(`
      CREATE TABLE "temporary_collection_media" (
        "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
        "collectionId" integer NOT NULL,
        "mediaServerId" varchar NOT NULL,
        "tmdbId" integer,
        "addDate" datetime NOT NULL,
        "image_path" varchar,
        "isManual" boolean DEFAULT (0),
        CONSTRAINT "FK_collection_media_collection" FOREIGN KEY ("collectionId") REFERENCES "collection" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
      )
    `);
    await queryRunner.query(`
      INSERT INTO "temporary_collection_media" ("id", "collectionId", "mediaServerId", "tmdbId", "addDate", "image_path", "isManual")
      SELECT "id", "collectionId", "mediaServerId", "tmdbId", "addDate", "image_path", "isManual"
      FROM "collection_media"
    `);
    await queryRunner.query(`DROP TABLE "collection_media"`);
    await queryRunner.query(
      `ALTER TABLE "temporary_collection_media" RENAME TO "collection_media"`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_collection_media_collection_id" ON "collection_media" ("collectionId")`,
    );

    await queryRunner.query(
      `ALTER TABLE "exclusion" ADD COLUMN "mediaServerId" varchar`,
    );
    await queryRunner.query(
      `UPDATE "exclusion" SET "mediaServerId" = CAST("plexId" AS TEXT) WHERE "plexId" IS NOT NULL`,
    );
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
      SELECT "id", "mediaServerId", "ruleGroupId", "parent", "type"
      FROM "exclusion"
    `);
    await queryRunner.query(`DROP TABLE "exclusion"`);
    await queryRunner.query(
      `ALTER TABLE "temporary_exclusion" RENAME TO "exclusion"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "collection" ADD COLUMN "plexId" integer`,
    );
    await queryRunner.query(
      `UPDATE "collection" SET "plexId" = CAST("mediaServerId" AS INTEGER) WHERE "mediaServerId" IS NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "collection" DROP COLUMN "mediaServerId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "collection" DROP COLUMN "mediaServerType"`,
    );

    await queryRunner.query(`
      CREATE TABLE "temporary_collection_media" (
        "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
        "collectionId" integer NOT NULL,
        "plexId" integer NOT NULL,
        "tmdbId" integer,
        "addDate" datetime NOT NULL,
        "image_path" varchar,
        "isManual" boolean DEFAULT (0),
        CONSTRAINT "FK_collection_media_collection" FOREIGN KEY ("collectionId") REFERENCES "collection" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
      )
    `);
    await queryRunner.query(`
      INSERT INTO "temporary_collection_media" ("id", "collectionId", "plexId", "tmdbId", "addDate", "image_path", "isManual")
      SELECT "id", "collectionId", CAST("mediaServerId" AS INTEGER), "tmdbId", "addDate", "image_path", "isManual"
      FROM "collection_media"
    `);
    await queryRunner.query(`DROP TABLE "collection_media"`);
    await queryRunner.query(
      `ALTER TABLE "temporary_collection_media" RENAME TO "collection_media"`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_collection_media_collection_id" ON "collection_media" ("collectionId")`,
    );

    await queryRunner.query(`
      CREATE TABLE "temporary_exclusion" (
        "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
        "plexId" integer NOT NULL,
        "ruleGroupId" integer,
        "parent" integer,
        "type" integer
      )
    `);
    await queryRunner.query(`
      INSERT INTO "temporary_exclusion" ("id", "plexId", "ruleGroupId", "parent", "type")
      SELECT "id", CAST("mediaServerId" AS INTEGER), "ruleGroupId", "parent", "type"
      FROM "exclusion"
    `);
    await queryRunner.query(`DROP TABLE "exclusion"`);
    await queryRunner.query(
      `ALTER TABLE "temporary_exclusion" RENAME TO "exclusion"`,
    );
  }
}
