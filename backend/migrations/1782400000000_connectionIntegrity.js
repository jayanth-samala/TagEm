export const shorthands = undefined;

export const up = (pgm) => {
  pgm.sql(`
    DELETE FROM connections WHERE user1_id = user2_id;

    UPDATE connections
    SET user1_id = LEAST(user1_id, user2_id),
        user2_id = GREATEST(user1_id, user2_id);

    DELETE FROM connections newer
    USING connections older
    WHERE newer.id > older.id
      AND newer.user1_id = older.user1_id
      AND newer.user2_id = older.user2_id;

    DELETE FROM "connectionRequests"
    WHERE sender_id = receiver_id;

    DELETE FROM "connectionRequests" pending
    USING connections connected
    WHERE pending.status = 'pending'
      AND LEAST(pending.sender_id, pending.receiver_id) = connected.user1_id
      AND GREATEST(pending.sender_id, pending.receiver_id) = connected.user2_id;

    DELETE FROM "connectionRequests" newer
    USING "connectionRequests" older
    WHERE newer.id > older.id
      AND newer.status = 'pending'
      AND older.status = 'pending'
      AND LEAST(newer.sender_id, newer.receiver_id) = LEAST(older.sender_id, older.receiver_id)
      AND GREATEST(newer.sender_id, newer.receiver_id) = GREATEST(older.sender_id, older.receiver_id);
  `);

  pgm.addConstraint("connections", "connections_canonical_pair", {
    check: "user1_id < user2_id",
  });
  pgm.addConstraint("connections", "connections_unique_pair", {
    unique: ["user1_id", "user2_id"],
  });
  pgm.addConstraint("connectionRequests", "connection_requests_distinct_users", {
    check: "sender_id <> receiver_id",
  });
  pgm.sql(`
    CREATE UNIQUE INDEX connection_requests_unique_pending_pair
    ON "connectionRequests" (
      LEAST(sender_id, receiver_id),
      GREATEST(sender_id, receiver_id)
    )
    WHERE status = 'pending'
  `);
};

export const down = (pgm) => {
  pgm.sql("DROP INDEX connection_requests_unique_pending_pair");
  pgm.dropConstraint("connectionRequests", "connection_requests_distinct_users");
  pgm.dropConstraint("connections", "connections_unique_pair");
  pgm.dropConstraint("connections", "connections_canonical_pair");
};
