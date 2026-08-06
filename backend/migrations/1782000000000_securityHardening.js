export const shorthands = undefined;

export const up = (pgm) => {
  pgm.addColumn("users", {
    auth_token_version: { type: "integer", notNull: true, default: 0 },
  });
  pgm.sql(`UPDATE users SET password = NULL, is_admin = FALSE
           WHERE email = 'admin@test.com' AND name = 'Admin User'`);
};

export const down = (pgm) => {
  pgm.dropColumn("users", "auth_token_version");
};
