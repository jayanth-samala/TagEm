/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
export const shorthands = undefined;

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const up = async (pgm) => {
  pgm.createTable("users", {
    id: {
      type: "serial",
      primaryKey: true,
    },
    email: {
      type: "varchar(255)",
      notNull: true,
      unique: true,
    },
    password: {
      type: "varchar(255)",
    },
    name: {
      type: "varchar(255)",
    },

    genderIdentity: {
      type: "varchar(255)",
    },
    occupation: {
      type: "varchar(255)",
    },
    bio: {
      type: "text",
    },
    resumeattached: {
      type: "text",
      default: "false",
    },
    profilePicUrl: {
      type: "text",
    },
    networkconnections: {
      type: "integer",
      default: 0,
    },
    is_admin: {
      type: "boolean",
      notNull: true,
      default: false,
    }
  });
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const down = (pgm) => {
  pgm.dropTable("users");
};
