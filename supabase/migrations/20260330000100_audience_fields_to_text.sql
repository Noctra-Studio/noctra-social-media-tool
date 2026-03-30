ALTER TABLE platform_audiences
  ALTER COLUMN pain_points TYPE text
  USING array_to_string(pain_points, E'\n'),
  ALTER COLUMN desired_outcomes TYPE text
  USING array_to_string(desired_outcomes, E'\n');
