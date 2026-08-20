/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
export const shorthands = undefined;

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const up = (pgm) => {
  pgm.createTable("job_recipients", {
    id: {
      type: "serial",
      primaryKey: true,
    },

    job_id: {
      type: "integer",
      notNull: true,
      references: "jobs(id)",
      onDelete: "CASCADE",
    },

    recipient_id: {
      type: "integer",
      notNull: true,
      references: "users(id)",
      onDelete: "CASCADE",
    },
  });

  pgm.addConstraint("job_recipients", "unique_job_recipient", {
    unique: ["job_id", "recipient_id"],
  });
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const down = (pgm) => {
    pgm.dropTable("job_recipients");
};
