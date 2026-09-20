-- Password reset tokens are invalidated with a boolean flag. The application
-- deliberately uses this column instead of a `used_at` timestamp.
ALTER TABLE password_reset_tokens
  ADD COLUMN IF NOT EXISTS used BOOLEAN NOT NULL DEFAULT false;
