-- Enable RLS on all tables
ALTER TABLE public.user_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_simplefin_tokens ENABLE ROW LEVEL SECURITY;

-- Create policies for user_accounts
CREATE POLICY "Users can view their own accounts"
ON public.user_accounts
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own accounts"
ON public.user_accounts
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own accounts"
ON public.user_accounts
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own accounts"
ON public.user_accounts
FOR DELETE
USING (auth.uid() = user_id);

-- Create policies for user_settings
CREATE POLICY "Users can view their own settings"
ON public.user_settings
FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Users can insert their own settings"
ON public.user_settings
FOR INSERT
WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own settings"
ON public.user_settings
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can delete their own settings"
ON public.user_settings
FOR DELETE
USING (auth.uid() = id);

-- For user_simplefin_tokens, we only want service role to access
-- First create a policy that denies access to normal authenticated users
CREATE POLICY "Prevent regular users from selecting simplefin tokens"
ON public.user_simplefin_tokens
FOR SELECT
USING (false);

CREATE POLICY "Prevent regular users from inserting simplefin tokens"
ON public.user_simplefin_tokens
FOR INSERT
WITH CHECK (false);

CREATE POLICY "Prevent regular users from updating simplefin tokens"
ON public.user_simplefin_tokens
FOR UPDATE
USING (false)
WITH CHECK (false);

CREATE POLICY "Prevent regular users from deleting simplefin tokens"
ON public.user_simplefin_tokens
FOR DELETE
USING (false);

-- To use the service role, you'll need to make API calls using your service_role key
-- No policy is needed for the service role as it bypasses RLS by default 