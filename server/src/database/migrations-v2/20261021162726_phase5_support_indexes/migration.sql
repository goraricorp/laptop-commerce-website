CREATE INDEX "conversation_owner_updated_idx" ON "conversation" ("owner_id","updated_at","id");--> statement-breakpoint
CREATE INDEX "conversation_assignee_updated_idx" ON "conversation" ("assigned_to_id","updated_at","id");--> statement-breakpoint
-- Native auth writes may already be in flight when anonymization revokes sessions.
-- The row lock orders these writes with the account lifecycle transaction.
CREATE FUNCTION phase5_guard_auth_owner() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE deleted_at timestamptz;
BEGIN
 SELECT anonymized_at INTO deleted_at FROM "user" WHERE id=NEW.user_id FOR SHARE;
 IF deleted_at IS NOT NULL THEN
  RAISE EXCEPTION 'Account is anonymized' USING ERRCODE='42501';
 END IF;
 RETURN NEW;
END;
$$;
--> statement-breakpoint
CREATE TRIGGER account_active_owner BEFORE INSERT OR UPDATE OF user_id ON account FOR EACH ROW EXECUTE FUNCTION phase5_guard_auth_owner();
--> statement-breakpoint
CREATE TRIGGER session_active_owner BEFORE INSERT OR UPDATE OF user_id ON session FOR EACH ROW EXECUTE FUNCTION phase5_guard_auth_owner();
--> statement-breakpoint
CREATE FUNCTION phase5_guard_tombstone() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF OLD.anonymized_at IS NOT NULL THEN
  RAISE EXCEPTION 'Account is anonymized' USING ERRCODE='42501';
 END IF;
 RETURN NEW;
END;
$$;
--> statement-breakpoint
CREATE TRIGGER user_tombstone_immutable BEFORE UPDATE ON "user" FOR EACH ROW EXECUTE FUNCTION phase5_guard_tombstone();
