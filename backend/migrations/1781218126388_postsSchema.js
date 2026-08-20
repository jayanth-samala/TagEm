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
  pgm.createTable("posts", {
    id: {
      type: "serial",
      primaryKey: true,
      notNull: true,
    },
    user_id: {
      type: "integer",
      references: "users(id)",
      onDelete: "CASCADE",
    },
    content: {
      type: "text",
      notNull: true,
    },
    parent_post_id: {
      type: "integer",
      references: "posts(id)", // This allows comments to reference head posts!
      onDelete: "CASCADE",
    },
    likes_count: {
      type: "integer",
      default: 0,
    },
    created_at: {
      type: "timestamptz", // 'timestamp with time zone' in Postgres
      default: pgm.func("CURRENT_TIMESTAMP"),
    },
  });
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const down = (pgm) => {
  pgm.dropTable("posts");
};