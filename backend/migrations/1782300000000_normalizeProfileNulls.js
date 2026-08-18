export const shorthands = undefined;

export const up = (pgm) => {
  pgm.sql(`UPDATE users SET resumeattached = NULL WHERE resumeattached = 'false'`);
  pgm.sql(`ALTER TABLE users ALTER COLUMN resumeattached DROP DEFAULT`);
};

export const down = (pgm) => {
  pgm.sql(`ALTER TABLE users ALTER COLUMN resumeattached SET DEFAULT 'false'`);
};
