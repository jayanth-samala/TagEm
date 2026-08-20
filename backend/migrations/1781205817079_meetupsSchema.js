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
  pgm.createTable("meetups", {
    id: {
      type: "serial",
      primaryKey: true,
      unique: true,
    },

    event_name: {
      type: "varchar(100)",
      notNull: true,
    },

    event_location: {
      type: "varchar(100)",
      notNull: true,
    },

    event_date: {
      type: "date",
      notNull: true,
    },

    event_bio: {
      type: "text",
    },

    event_creator_id: {
      type: "integer",
      references: "users(id)",
      onDelete: "CASCADE",
    },
  });
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const down = (pgm) => {
  pgm.dropTable("meetups");
};