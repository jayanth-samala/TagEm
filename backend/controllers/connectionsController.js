import pool from "../config/db.js"

export async function getUsers(req, res) {
    try {
        const users = await pool.query('SELECT id, name, email, "profilePicUrl" from users');
        const people = [];
      for(let i = 0; i < users.rows.length; i++) {
        if(users.rows[i].name.toLowerCase().startsWith(req.query.search.toLowerCase()) && req.query.search.length != 0) {
          people.push(users.rows[i]);
        }
      }
      res.send(people);
        
    } catch(err) {
        console.log(err);
        res.status(500).json({message: "Database error"});
    }
}

export async function sendRequest(req, res) {
  try{
    const {sender_id, receiver_id} = req.body;
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
    const id = req.params.id;

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
    try {
        const requestId = req.params.id;

        const request = await pool.query(
            `SELECT sender_id, receiver_id
             FROM "connectionRequests"
             WHERE id = $1`,
            [requestId]
        );

        if (request.rows.length === 0) {
            return res.status(404).json({
                message: "Request not found"
            });
        }

        const { sender_id, receiver_id } = request.rows[0];

        await pool.query(
            `UPDATE "connectionRequests"
             SET status = 'accepted'
             WHERE id = $1`,
            [requestId]
        );

        const user1 = Math.min(sender_id, receiver_id);
        const user2 = Math.max(sender_id, receiver_id);

        await pool.query(
            `INSERT INTO connections (user1_id, user2_id)
             VALUES ($1, $2)`,
            [user1, user2]
        );

        return res.status(200).json({
            message: "Request accepted"
        });
        console.log("accepted");

    } catch (err) {
        console.log(err);
        return res.status(500).json({
            message: "Database error"
        });
    }
}

export async function rejectRequest(req, res) {
    try {
        const requestId = req.params.id;

        await pool.query(
            `DELETE FROM "connectionRequests"
             WHERE id = $1`,
            [requestId]
        );

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
    const { senderId, receiverId } = req.params;

    const request = await pool.query(
      `SELECT status
       FROM "connectionRequests"
       WHERE 
       (sender_id = $1 AND receiver_id = $2)
       OR
       (sender_id = $2 AND receiver_id = $1)`,
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
      `SELECT *
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
    const id = req.params.id;

    const result = await pool.query(
      `SELECT 
        u.id,
        u.name,
        u.email,
        u."profilePicUrl",
        ct.tag_type
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
