-- Create a table to store user data (replacing Firestore 'users' collection topics/settings/quizResults)
-- We use TEXT for user_id to match Firebase UID strings.
create table if not exists public.user_data (
  user_id text primary key,
  topics jsonb default '[]'::jsonb,
  settings jsonb default '{}'::jsonb,
  quiz_results jsonb default '[]'::jsonb,
  google_auth jsonb default null,  -- Added to store Google Calendar tokens
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security
alter table public.user_data enable row level security;

create policy "Allow all operations for now"
on public.user_data
for all
using (true)
with check (true);


-- Create a table to store Push Subscriptions (FCM Tokens)
create table if not exists public.push_subscriptions (
  user_id text not null,
  fcm_token text not null,
  device_type text,
  last_updated timestamp with time zone default timezone('utc'::text, now()) not null,
  primary key (user_id, fcm_token)
);

alter table public.push_subscriptions enable row level security;

create policy "Allow all operations for subs"
on public.push_subscriptions
for all
using (true)
with check (true);

-- Create a table/log for Notification History (optional, good for debugging)
create table if not exists public.notification_history (
  id uuid default gen_random_uuid() primary key,
  user_id text not null,
  title text,
  body text,
  sent_at timestamp with time zone default timezone('utc'::text, now()) not null,
  status text
);

alter table public.notification_history enable row level security;

create policy "Allow insert for anon"
on public.notification_history
for insert
with check (true);
