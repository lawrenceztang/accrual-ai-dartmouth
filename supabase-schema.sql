create table public.journal_entries (
  id uuid not null default gen_random_uuid (),
  transaction_id uuid null,
  entity character varying(100) not null,
  org character varying(100) not null,
  funding character varying(100) not null,
  activity character varying(100) not null,
  subactivity character varying(100) not null,
  natural_class character varying(100) not null,
  amount integer not null,
  created_at timestamp with time zone null default now(),
  entry_type character varying(10) not null default 'credit'::character varying,
  batch_id uuid null,
  constraint journal_entries_pkey primary key (id),
  constraint journal_entries_batch_id_fkey foreign KEY (batch_id) references journal_entry_batches (id),
  constraint journal_entries_transaction_id_fkey foreign KEY (transaction_id) references stripe_transactions (id)
) TABLESPACE pg_default;

create index IF not exists idx_journal_entries_transaction_id on public.journal_entries using btree (transaction_id) TABLESPACE pg_default;

create index IF not exists idx_journal_entries_batch_id on public.journal_entries using btree (batch_id) TABLESPACE pg_default;

create table public.journal_entry_batches (
  id uuid not null default gen_random_uuid (),
  batch_name character varying(255) not null,
  status character varying(20) not null default 'draft'::character varying,
  total_transactions integer not null default 0,
  total_amount integer not null default 0,
  created_at timestamp with time zone null default now(),
  completed_at timestamp with time zone null,
  constraint journal_entry_batches_pkey primary key (id)
) TABLESPACE pg_default;

create index IF not exists idx_journal_entry_batches_status on public.journal_entry_batches using btree (status) TABLESPACE pg_default;

create table public.program_mappings (
  id uuid not null default gen_random_uuid (),
  program_name character varying(255) not null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  debit_entity character varying(100) not null,
  debit_org character varying(100) not null,
  debit_funding character varying(100) not null,
  debit_activity character varying(100) not null,
  debit_subactivity character varying(100) not null,
  debit_natural_class character varying(100) not null,
  credit_entity character varying(100) not null,
  credit_org character varying(100) not null,
  credit_funding character varying(100) not null,
  credit_activity character varying(100) not null,
  credit_subactivity character varying(100) not null,
  credit_natural_class character varying(100) not null,
  constraint program_mappings_pkey primary key (id),
  constraint program_mappings_program_name_key unique (program_name)
) TABLESPACE pg_default;

create index IF not exists idx_program_mappings_program_name on public.program_mappings using btree (program_name) TABLESPACE pg_default;

create table public.stripe_transactions (
  id uuid not null default gen_random_uuid (),
  stripe_payment_id character varying(255) not null,
  program_name character varying(255) not null,
  amount integer not null,
  currency character varying(3) not null default 'usd'::character varying,
  status character varying(50) not null,
  created_at timestamp with time zone null default now(),
  processed boolean null default false,
  batch_id uuid null,
  in_batch boolean null default false,
  constraint stripe_transactions_pkey primary key (id),
  constraint stripe_transactions_stripe_payment_id_key unique (stripe_payment_id),
  constraint stripe_transactions_batch_id_fkey foreign KEY (batch_id) references journal_entry_batches (id)
) TABLESPACE pg_default;

create index IF not exists idx_stripe_transactions_stripe_payment_id on public.stripe_transactions using btree (stripe_payment_id) TABLESPACE pg_default;

create index IF not exists idx_stripe_transactions_processed on public.stripe_transactions using btree (processed) TABLESPACE pg_default;

create index IF not exists idx_stripe_transactions_batch_id on public.stripe_transactions using btree (batch_id) TABLESPACE pg_default;

create index IF not exists idx_stripe_transactions_in_batch on public.stripe_transactions using btree (in_batch) TABLESPACE pg_default;