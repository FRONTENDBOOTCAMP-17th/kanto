-- Admin teams
CREATE TABLE IF NOT EXISTS admin_teams (
  id   bigserial PRIMARY KEY,
  name text        NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Team permissions (one row per permission per team)
CREATE TABLE IF NOT EXISTS team_permissions (
  team_id    bigint NOT NULL REFERENCES admin_teams(id) ON DELETE CASCADE,
  permission text   NOT NULL,
  PRIMARY KEY (team_id, permission)
);

-- Link admins to a team
ALTER TABLE users ADD COLUMN IF NOT EXISTS admin_team_id bigint REFERENCES admin_teams(id) ON DELETE SET NULL;

-- Support super_admin role (role column is already text, no enum change needed)

-- RLS: only admins/super_admins can read; only super_admins can write
ALTER TABLE admin_teams      ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admins_read_teams"
  ON admin_teams FOR SELECT
  USING ((SELECT role FROM users WHERE auth_id = auth.uid()) IN ('admin', 'super_admin'));

CREATE POLICY "super_admin_write_teams"
  ON admin_teams FOR ALL
  USING ((SELECT role FROM users WHERE auth_id = auth.uid()) = 'super_admin');

CREATE POLICY "admins_read_team_permissions"
  ON team_permissions FOR SELECT
  USING ((SELECT role FROM users WHERE auth_id = auth.uid()) IN ('admin', 'super_admin'));

CREATE POLICY "super_admin_write_team_permissions"
  ON team_permissions FOR ALL
  USING ((SELECT role FROM users WHERE auth_id = auth.uid()) = 'super_admin');
