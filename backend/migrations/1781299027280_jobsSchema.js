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
  pgm.createTable("jobs", {
    id: {
      type: "serial",
      primaryKey: true,
    },

    title: {
      type: "varchar(255)",
      notNull: true,
    },

    company: {
      type: "varchar(255)",
      notNull: true,
    },

    location: {
      type: "varchar(255)",
      notNull: true,
    },

    description: {
      type: "text",
      notNull: true,
    },

    sender_id: {
      type: "integer",
      notNull: true,
      references: "users(id)",
      onDelete: "CASCADE",
    },

    created_at: {
      type: "timestamp",
      default: pgm.func("current_timestamp"),
    },
  });
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const down = (pgm) => {
    pgm.dropTable("jobs");
};
