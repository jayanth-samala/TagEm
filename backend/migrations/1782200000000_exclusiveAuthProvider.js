export const shorthands = undefined;

export const up = (pgm) => {
  pgm.sql(`
    ALTER TABLE users
    ADD CONSTRAINT users_exactly_one_auth_provider
    CHECK (
      (password IS NOT NULL AND google_subject IS NULL)
      OR
      (password IS NULL AND google_subject IS NOT NULL)
    ) NOT VALID
  `);
};

export const down = (pgm) => {
  pgm.dropConstraint("users", "users_exactly_one_auth_provider");
};
