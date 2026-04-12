-- Add year_of_construction column to listings_analyses
-- Used to improve IRPL legal cap accuracy via year-band correction factors

ALTER TABLE listings_analyses
  ADD COLUMN IF NOT EXISTS year_of_construction TEXT;

COMMENT ON COLUMN listings_analyses.year_of_construction IS
  'Construction era band: pre1960 | 1960_1990 | 1991_2007 | 2008_plus. Used to apply IRPL year-of-construction correction factor.';
