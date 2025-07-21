-- Insert a default mapping for transactions without program names
INSERT INTO program_mappings (
  program_name,
  entity,
  org,
  funding,
  activity,
  subactivity,
  natural_class
) VALUES (
  'Unknown Program',
  'DEFAULT_ENTITY',
  'DEFAULT_ORG', 
  'DEFAULT_FUNDING',
  'DEFAULT_ACTIVITY',
  'DEFAULT_SUBACTIVITY',
  'DEFAULT_NATURAL_CLASS'
) ON CONFLICT (program_name) DO NOTHING;