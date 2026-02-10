import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitSchema1700000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Enable uuid-ossp extension
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    // Create enums
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE user_status AS ENUM ('active', 'inactive');
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `);
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE user_role AS ENUM ('admin', 'cti_editor', 'group_manager', 'viewer');
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `);
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE source_type AS ENUM ('rss', 'generic_api', 'github_releases', 'html_scrape');
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `);
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE visibility_scope AS ENUM ('public', 'groups');
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `);

    // Users table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "users" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "email" varchar UNIQUE NOT NULL,
        "name" varchar NOT NULL,
        "picture" varchar,
        "status" user_status DEFAULT 'active',
        "role" user_role DEFAULT 'viewer',
        "lastLoginAt" timestamptz,
        "createdAt" timestamptz DEFAULT now(),
        "updatedAt" timestamptz DEFAULT now()
      )
    `);

    // Groups table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "groups" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "name" varchar UNIQUE NOT NULL,
        "description" varchar,
        "createdAt" timestamptz DEFAULT now()
      )
    `);

    // User-Groups join table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "user_groups" (
        "usersId" uuid REFERENCES "users"("id") ON DELETE CASCADE,
        "groupsId" uuid REFERENCES "groups"("id") ON DELETE CASCADE,
        PRIMARY KEY ("usersId", "groupsId")
      )
    `);

    // Group policies
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "group_policies" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "groupId" uuid UNIQUE REFERENCES "groups"("id") ON DELETE CASCADE,
        "followedTags" text DEFAULT '',
        "followedCategories" text DEFAULT '',
        "keywordsInclude" text DEFAULT '',
        "keywordsExclude" text DEFAULT '',
        "dashboardJson" jsonb
      )
    `);

    // Categories
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "categories" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "name" varchar UNIQUE NOT NULL,
        "slug" varchar UNIQUE NOT NULL,
        "description" varchar,
        "createdAt" timestamptz DEFAULT now()
      )
    `);

    // Sources
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "sources" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "name" varchar NOT NULL,
        "type" source_type NOT NULL,
        "url" varchar NOT NULL,
        "scheduleCron" varchar DEFAULT '0 */6 * * *',
        "enabled" boolean DEFAULT true,
        "authConfigEncrypted" text,
        "mappingConfigJson" jsonb,
        "headersJson" jsonb,
        "visibilityScope" visibility_scope DEFAULT 'public',
        "visibilityGroupIds" text DEFAULT '',
        "createdAt" timestamptz DEFAULT now(),
        "updatedAt" timestamptz DEFAULT now()
      )
    `);

    // Source-Categories join
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "source_categories" (
        "sourcesId" uuid REFERENCES "sources"("id") ON DELETE CASCADE,
        "categoriesId" uuid REFERENCES "categories"("id") ON DELETE CASCADE,
        PRIMARY KEY ("sourcesId", "categoriesId")
      )
    `);

    // Items
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "items" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "sourceId" uuid REFERENCES "sources"("id") ON DELETE SET NULL,
        "title" varchar NOT NULL,
        "summary" text,
        "content" text,
        "url" varchar NOT NULL,
        "publishedAt" timestamptz,
        "collectedAt" timestamptz DEFAULT now(),
        "hash" varchar UNIQUE NOT NULL,
        "rawJson" jsonb,
        "visibilityScope" visibility_scope DEFAULT 'public',
        "visibilityGroupIds" text DEFAULT '',
        "cves" text DEFAULT '',
        "cwes" text DEFAULT '',
        "vendors" text DEFAULT '',
        "products" text DEFAULT '',
        "tags" text DEFAULT '',
        "severity" varchar,
        "searchVector" tsvector
      )
    `);

    // Item-Categories join
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "item_categories" (
        "itemsId" uuid REFERENCES "items"("id") ON DELETE CASCADE,
        "categoriesId" uuid REFERENCES "categories"("id") ON DELETE CASCADE,
        PRIMARY KEY ("itemsId", "categoriesId")
      )
    `);

    // User preferences
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "user_preferences" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "userId" uuid REFERENCES "users"("id") ON DELETE CASCADE,
        "followedTags" text DEFAULT '',
        "followedCategories" text DEFAULT '',
        "keywordsInclude" text DEFAULT '',
        "keywordsExclude" text DEFAULT ''
      )
    `);

    // Audit logs
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "audit_logs" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "actorUserId" uuid REFERENCES "users"("id") ON DELETE SET NULL,
        "action" varchar NOT NULL,
        "objectType" varchar NOT NULL,
        "objectId" varchar,
        "timestamp" timestamptz DEFAULT now(),
        "diffJson" jsonb
      )
    `);

    // Full-text search index
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_items_search 
      ON "items" USING GIN ("searchVector")
    `);

    // Trigger to auto-update search vector
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION items_search_vector_update() RETURNS trigger AS $$
      BEGIN
        NEW."searchVector" :=
          setweight(to_tsvector('english', coalesce(NEW."title", '')), 'A') ||
          setweight(to_tsvector('english', coalesce(NEW."summary", '')), 'B') ||
          setweight(to_tsvector('english', coalesce(NEW."content", '')), 'C') ||
          setweight(to_tsvector('english', coalesce(NEW."cves", '')), 'A') ||
          setweight(to_tsvector('english', coalesce(NEW."tags", '')), 'B');
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);

    await queryRunner.query(`
      DROP TRIGGER IF EXISTS items_search_vector_trigger ON "items";
      CREATE TRIGGER items_search_vector_trigger
      BEFORE INSERT OR UPDATE ON "items"
      FOR EACH ROW EXECUTE FUNCTION items_search_vector_update();
    `);

    // Index on items collectedAt for feed ordering
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_items_collected_at ON "items" ("collectedAt" DESC)
    `);

    // Index on items sourceId
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_items_source_id ON "items" ("sourceId")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "audit_logs" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "user_preferences" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "item_categories" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "items" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "source_categories" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "sources" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "categories" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "group_policies" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "user_groups" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "groups" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "users" CASCADE`);
    await queryRunner.query(`DROP TYPE IF EXISTS visibility_scope`);
    await queryRunner.query(`DROP TYPE IF EXISTS source_type`);
    await queryRunner.query(`DROP TYPE IF EXISTS user_role`);
    await queryRunner.query(`DROP TYPE IF EXISTS user_status`);
  }
}
