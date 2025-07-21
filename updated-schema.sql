-- Update program_mappings table to include separate debit and credit fields
ALTER TABLE program_mappings 
DROP COLUMN entity,
DROP COLUMN org,
DROP COLUMN funding,
DROP COLUMN activity,
DROP COLUMN subactivity,
DROP COLUMN natural_class;

-- Add separate debit and credit fields
ALTER TABLE program_mappings 
ADD COLUMN debit_entity VARCHAR(100) NOT NULL DEFAULT '',
ADD COLUMN debit_org VARCHAR(100) NOT NULL DEFAULT '',
ADD COLUMN debit_funding VARCHAR(100) NOT NULL DEFAULT '',
ADD COLUMN debit_activity VARCHAR(100) NOT NULL DEFAULT '',
ADD COLUMN debit_subactivity VARCHAR(100) NOT NULL DEFAULT '',
ADD COLUMN debit_natural_class VARCHAR(100) NOT NULL DEFAULT '',
ADD COLUMN credit_entity VARCHAR(100) NOT NULL DEFAULT '',
ADD COLUMN credit_org VARCHAR(100) NOT NULL DEFAULT '',
ADD COLUMN credit_funding VARCHAR(100) NOT NULL DEFAULT '',
ADD COLUMN credit_activity VARCHAR(100) NOT NULL DEFAULT '',
ADD COLUMN credit_subactivity VARCHAR(100) NOT NULL DEFAULT '',
ADD COLUMN credit_natural_class VARCHAR(100) NOT NULL DEFAULT '';

-- Update journal_entries table to include entry_type
ALTER TABLE journal_entries 
ADD COLUMN entry_type VARCHAR(10) NOT NULL DEFAULT 'credit';

-- Remove default constraints once data is migrated
ALTER TABLE program_mappings 
ALTER COLUMN debit_entity DROP DEFAULT,
ALTER COLUMN debit_org DROP DEFAULT,
ALTER COLUMN debit_funding DROP DEFAULT,
ALTER COLUMN debit_activity DROP DEFAULT,
ALTER COLUMN debit_subactivity DROP DEFAULT,
ALTER COLUMN debit_natural_class DROP DEFAULT,
ALTER COLUMN credit_entity DROP DEFAULT,
ALTER COLUMN credit_org DROP DEFAULT,
ALTER COLUMN credit_funding DROP DEFAULT,
ALTER COLUMN credit_activity DROP DEFAULT,
ALTER COLUMN credit_subactivity DROP DEFAULT,
ALTER COLUMN credit_natural_class DROP DEFAULT;