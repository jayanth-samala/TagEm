export const shorthands = undefined;

export const up = (pgm) => {
  pgm.addColumns("users", {
    google_subject: { type: "varchar(255)", unique: true },
  });

  pgm.createTable("post_likes", {
    post_id: {
      type: "integer",
      notNull: true,
      references: "posts(id)",
      onDelete: "CASCADE",
    },
    user_id: {
      type: "integer",
      notNull: true,
      references: "users(id)",
      onDelete: "CASCADE",
    },
    created_at: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("CURRENT_TIMESTAMP"),
    },
  });

  pgm.addConstraint("post_likes", "post_likes_pkey", {
    primaryKey: ["post_id", "user_id"],
  });
  pgm.sql("UPDATE posts SET likes_count = 0");
};

export const down = (pgm) => {
  pgm.dropTable("post_likes");
  pgm.dropColumn("users", "google_subject");
};
