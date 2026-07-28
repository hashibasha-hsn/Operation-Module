ALTER TABLE submissions ADD COLUMN IF NOT EXISTS "currentReviewerId" VARCHAR(255);

CREATE INDEX IF NOT EXISTS idx_submissions_pending_reviewer
  ON submissions("organizationId", status, "currentReviewerId");
