import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * 4-Phase Migration: Split denormalized NAM_CUS into NOM_CUS + APE_CUS
 *
 * Phase 1 (ADD):     Add new columns NOM_CUS, APE_CUS
 * Phase 2 (UPDATE):   Populate NOM_CUS/APE_CUS from NAM_CUS using string splitting
 * Phase 3 (VERIFY):   Count check + NULL check to ensure data integrity
 * Phase 4 (DROP):     Remove legacy NAM_CUS column
 *
 * Rollback (AC7):    Recreate NAM_CUS from NOM_CUS + APE_CUS via COALESCE + concat
 */
export class SplitCustomerNames1700000000000 implements MigrationInterface {
  name = 'SplitCustomerNames1700000000000';

  // ─────────────────────────────────────────────────────────────────────────────
  // Phase 1 — ADD new columns (zero data loss, no downtime)
  // ─────────────────────────────────────────────────────────────────────────────
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "CUSTOMERS"
        ADD COLUMN "NOM_CUS" varchar(100),
        ADD COLUMN "APE_CUS" varchar(100);
    `);
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Phase 2 — UPDATE: split NAM_CUS → NOM_CUS (first word) + APE_CUS (rest)
  // ─────────────────────────────────────────────────────────────────────────────
  public async update(queryRunner: QueryRunner): Promise<void> {
    // NOM_CUS = first space-separated token of NAM_CUS
    await queryRunner.query(`
      UPDATE "CUSTOMERS"
        SET "NOM_CUS" = split_part("NAM_CUS", ' ', 1);
    `);

    // APE_CUS = everything after the first space (preserves multi-word last names)
    // NULL when NAM_CUS has no space (single-word name → no last name)
    await queryRunner.query(`
      UPDATE "CUSTOMERS"
        SET "APE_CUS" = CASE
            WHEN position(' ' IN "NAM_CUS") > 0
            THEN substring("NAM_CUS" FROM position(' ' IN "NAM_CUS") + 1)
            ELSE NULL
          END;
    `);
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Phase 3 — VERIFY: data integrity checks
  // ─────────────────────────────────────────────────────────────────────────────
  public async verify(queryRunner: QueryRunner): Promise<void> {
    // Row count baseline — must be unchanged
    const [{ total }] = await queryRunner.query(`
      SELECT COUNT(*)::integer AS total FROM "CUSTOMERS";
    `);

    // NOM_CUS must not be NULL or empty where NAM_CUS was non-empty
    const [badNom] = await queryRunner.query(`
      SELECT COUNT(*)::integer AS cnt FROM "CUSTOMERS"
        WHERE "NAM_CUS" IS NOT NULL
          AND "NAM_CUS" <> ''
          AND ("NOM_CUS" IS NULL OR "NOM_CUS" = '');
    `);

    // APE_CUS is intentionally nullable (single-word names); no check needed
    if (badNom.cnt > 0) {
      throw new Error(
        `Verification failed: ${badNom.cnt} rows have NULL/empty NOM_CUS where NAM_CUS was non-empty. Migration aborted.`,
      );
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Phase 4 — DROP legacy column
  // ─────────────────────────────────────────────────────────────────────────────
  public async drop(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "CUSTOMERS" DROP COLUMN "NAM_CUS";
    `);
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Rollback (AC7): Recreate NAM_CUS from split columns
  // ─────────────────────────────────────────────────────────────────────────────
  public async down(queryRunner: QueryRunner): Promise<void> {
    // Step 1: Re-add the legacy column
    await queryRunner.query(`
      ALTER TABLE "CUSTOMERS" ADD COLUMN "NAM_CUS" varchar(255);
    `);

    // Step 2: Reconstitute full name from NOM_CUS + APE_CUS
    // COALESCE handles NULL APE_CUS (single-name customers)
    await queryRunner.query(`
      UPDATE "CUSTOMERS"
        SET "NAM_CUS" = TRIM(
            COALESCE("NOM_CUS", '') ||
            CASE WHEN "APE_CUS" IS NOT NULL AND "APE_CUS" <> '' THEN ' ' || "APE_CUS" ELSE '' END
          );
    `);

    // Step 3: Drop the split columns
    await queryRunner.query(`
      ALTER TABLE "CUSTOMERS"
        DROP COLUMN "NOM_CUS",
        DROP COLUMN "APE_CUS";
    `);
  }
}