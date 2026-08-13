export const shorthands = undefined;

export const up = (pgm) => {
  pgm.addColumn("users", {
    auth_token_version: { type: "integer", notNull: true, default: 0 },
  });
};

export const down = (pgm) => {
  pgm.dropColumn("users", "auth_token_version");
};
