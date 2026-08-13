import pool from "../config/db.js"

export async function getUsers(req, res) {
    try {
      const search = typeof req.query.search === "string" ? req.query.search.trim() : "";
      if (!search || search.length > 100) return res.json([]);
      const users = await pool.query(
        `SELECT id, name, email, "profilePicUrl" FROM users
         WHERE name ILIKE $1 AND id <> $2 ORDER BY name LIMIT 25`,
        [`${search}%`, req.user.id]
      );
      res.send(users.rows);
        
    } catch(err) {
        console.log(err);
        res.status(500).json({message: "Database error"});
    }
}

export async function sendRequest(req, res) {
  try{
    const sender_id = req.user.id;
    const receiver_id = Number(req.body.receiver_id);
    if (!Number.isInteger(receiver_id) || receiver_id <= 0) return res.status(400).json({ message: "Invalid receiver" });
    if (sender_id === receiver_id) {
      return res.status(400).json({ message: "You cannot connect with yourself" });
    }
    await pool.query(
      `INSERT INTO "connectionRequests"
       (sender_id, receiver_id, status)
       VALUES ($1, $2, $3)`,
      [sender_id, receiver_id, "pending"]
    );
    res.status(201).json({ message: "Request sent" });
  } catch(err) {
    console.log(err);
    res.status(500).json({ message: "Database error during sending request" });
  }
}

export async function getRequests(req, res) {
  try {
    const id = req.user.id;
    if (Number(req.params.id) !== id) return res.status(403).json({ message: "Access denied" });

    const requests = await pool.query(
      `SELECT
        cr.id,
        cr.sender_id,
        cr.receiver_id,
        cr.status,
        u.name,
        u.email,
        u."profilePicUrl"
      FROM "connectionRequests" cr
      JOIN users u
      ON cr.sender_id = u.id
      WHERE cr.receiver_id = $1
      AND cr.status = 'pending'`,
      [id]
    );
    res.json(requests.rows);
  } catch (err) {
    console.log(err);
  }
}

export async function acceptRequest(req, res) {
    let client;
    try {
        const requestId = req.params.id;
        client = await pool.connect();
        await client.query("BEGIN");

        const request = await client.query(
            `SELECT sender_id, receiver_id
             FROM "connectionRequests"
             WHERE id = $1 AND receiver_id = $2`,
            [requestId, req.user.id]
        );

        if (request.rows.length === 0) {
            await client.query("ROLLBACK");
            return res.status(404).json({
                message: "Request not found"
            });
        }

        const { sender_id, receiver_id } = request.rows[0];

        await client.query(
            `UPDATE "connectionRequests"
             SET status = 'accepted'
             WHERE id = $1 AND receiver_id = $2`,
            [requestId, req.user.id]
        );

        const user1 = Math.min(sender_id, receiver_id);
        const user2 = Math.max(sender_id, receiver_id);

        await client.query(
            `INSERT INTO connections (user1_id, user2_id)
             VALUES ($1, $2)
             ON CONFLICT DO NOTHING`,
            [user1, user2]
        );

        await client.query("COMMIT");

        return res.status(200).json({
            message: "Request accepted"
        });
    } catch (err) {
        if (client) await client.query("ROLLBACK");
        console.log(err);
        return res.status(500).json({
            message: "Database error"
        });
    } finally {
        client?.release();
    }
}

export async function rejectRequest(req, res) {
    try {
        const requestId = req.params.id;

        const deleted = await pool.query(
            `DELETE FROM "connectionRequests"
             WHERE id = $1 AND receiver_id = $2
             RETURNING id`,
            [requestId, req.user.id]
        );

        if (deleted.rows.length === 0) return res.status(404).json({ message: "Request not found" });

        return res.status(200).json({
            message: "Request rejected"
        });

    } catch (err) {
        console.log(err);
        return res.status(500).json({
            message: "Database error"
        });
    }
}

export async function getConnectionStatus(req, res) {
  try {
    const senderId = req.user.id;
    const receiverId = Number(req.params.receiverId);
    if (Number(req.params.senderId) !== senderId || !Number.isInteger(receiverId)) {
      return res.status(403).json({ message: "Access denied" });
    }

    const request = await pool.query(
      `SELECT status
       FROM "connectionRequests"
       WHERE 
       (sender_id = $1 AND receiver_id = $2)
       OR (sender_id = $2 AND receiver_id = $1)`,
      [senderId, receiverId]
    );

    if (request.rows.length > 0) {
      if (request.rows[0].status === "accepted") {
        return res.json({ status: "connected" });
      }

      return res.json({ status: request.rows[0].status });
    }

    const user1 = Math.min(Number(senderId), Number(receiverId));
    const user2 = Math.max(Number(senderId), Number(receiverId));

    const connection = await pool.query(
      `SELECT id
       FROM connections
       WHERE user1_id = $1 AND user2_id = $2`,
      [user1, user2]
    );

    if (connection.rows.length > 0) {
      return res.json({ status: "connected" });
    }

    return res.json({ status: "connect" });

  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Database error" });
  }
}

export async function getConnections(req, res) {
  try {
    const id = Number(req.params.id);
    const includePrivateTags = id === req.user.id || req.user.is_admin;

    const result = await pool.query(
      `SELECT 
        u.id,
        u.name,
        u.email,
        u."profilePicUrl",
        ${includePrivateTags ? "ct.tag_type" : "NULL AS tag_type"}
      FROM connections c
      JOIN users u
      ON u.id = CASE
        WHEN c.user1_id = $1 THEN c.user2_id
        ELSE c.user1_id
      END
      LEFT JOIN connection_tags ct
      ON ct.owner_id = $1
      AND ct.connection_user_id = u.id
      WHERE c.user1_id = $1 OR c.user2_id = $1`,
      [id]
    );

    res.json(result.rows);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Database error" });
  }
}
