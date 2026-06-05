-- Fix historical grading levels: normalize REJECTED and other invalid values to SCRAP
-- This fixes the bug where REJECTED (which is a ProcurementStatus, not a GradingLevel)
-- was incorrectly stored as a grading level value

BEGIN;

-- Update all invalid grading levels to SCRAP
UPDATE "gradings"
SET "level" = 'SCRAP'
WHERE "level" NOT IN ('A', 'B', 'C', 'SCRAP')
   OR "level" = 'REJECTED'
   OR "level" = 'rejected';

COMMIT;
