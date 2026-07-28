import pool from "../config/db.js";

export async function getJobsForUser(req, res) {
  try {
    const userId = req.params.userId;
    const jobs = await pool.query(
      `
      SELECT 
        j.id,
        j.title,
        j.company,
        j.location,
        j.description,
        j.sender_id,
        sender.name AS sender,
        j.created_at,
        ARRAY_AGG(recipient.name) AS "taggedContacts"
      FROM jobs j
      JOIN users sender
        ON j.sender_id = sender.id
      JOIN job_recipients jr
        ON j.id = jr.job_id
      JOIN users recipient
        ON jr.recipient_id = recipient.id
      WHERE j.id IN (
           SELECT job_id
           FROM job_recipients
           WHERE recipient_id = $1
         )
      GROUP BY j.id, sender.name
      ORDER BY j.created_at DESC
      `,
      [userId]
    );
    res.json(jobs.rows);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Database error getting jobs" });
  }
}

export async function getJobsSentByUser(req, res) {
  try {
    const userId = req.params.userId;
    const jobs = await pool.query(
      `
      SELECT 
        j.id,
        j.title,
        j.company,
        j.location,
        j.description,
        j.sender_id,
        sender.name AS sender,
        j.created_at,
        ARRAY_AGG(recipient.name) AS "taggedContacts"
      FROM jobs j
      JOIN users sender
        ON j.sender_id = sender.id
      JOIN job_recipients jr
        ON j.id = jr.job_id
      JOIN users recipient
        ON jr.recipient_id = recipient.id
      WHERE j.sender_id = $1
      GROUP BY j.id, sender.name
      ORDER BY j.created_at DESC
      `,
      [userId]
    );
    res.json(jobs.rows);
  }
  catch (err) {
    console.log(err);
    res.status(500).json({ message: "Database error getting jobs" });
  }
} 

export async function createJob(req, res) {
  try {
    const {
      title,
      company,
      location,
      description,
      sender_id,
      selectedUserIds,
      selectedTagTypes,
    } = req.body;

    if (!title || !company || !location || !description || !sender_id) {
      return res.status(400).json({ message: "Missing required fields" });
    }
    await pool.query("BEGIN");

    const newJob = await pool.query(
      `
      INSERT INTO jobs (title, company, location, description, sender_id)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id
      `,
      [title, company, location, description, sender_id]
    );
    const jobId = newJob.rows[0].id;
    const recipients = new Set();

    if (selectedUserIds && selectedUserIds.length > 0) {
      for (let i = 0; i < selectedUserIds.length; i++) {
        recipients.add(Number(selectedUserIds[i]));
      }
    }
    if (selectedTagTypes && selectedTagTypes.length > 0) {
      for (let i = 0; i < selectedTagTypes.length; i++) {
        const taggedUsers = await pool.query(
          `
          SELECT connection_user_id
          FROM connection_tags
          WHERE owner_id = $1
          AND tag_type = $2
          `,
          [sender_id, selectedTagTypes[i]]
        );

        for (let j = 0; j < taggedUsers.rows.length; j++) {
          recipients.add(Number(taggedUsers.rows[j].connection_user_id));
        }
      }
    }

    for (const recipientId of recipients) {
      await pool.query(
        `
        INSERT INTO job_recipients (job_id, recipient_id)
        VALUES ($1, $2)
        ON CONFLICT DO NOTHING
        `,
        [jobId, recipientId]
      );
    }

    await pool.query("COMMIT");

    res.status(201).json({ message: "Job created" });
  } catch (err) {
    await pool.query("ROLLBACK");
    console.log(err);
    res.status(500).json({ message: "Database error creating job" });
  }
}

export async function getJobSendOptions(req, res) {
  try {
    const userId = req.params.userId;
    const connections = await pool.query(
      `
      SELECT 
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
      WHERE c.user1_id = $1 OR c.user2_id = $1
      ORDER BY u.name
      `,
      [userId]
    );

    const tags = await pool.query(
      `
      SELECT DISTINCT tag_type
      FROM connection_tags
      WHERE owner_id = $1
      ORDER BY tag_type
      `,
      [userId]
    );

    res.json({
      connections: connections.rows,
      tags: tags.rows.map((row) => row.tag_type),
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Database error getting job options" });
  }
}

export async function setConnectionTag(req, res) {
  try {
    const { owner_id, connection_user_id, tag_type } = req.body;

    if (!owner_id || !connection_user_id || !tag_type) {
      return res.status(400).json({ message: "Missing required fields" });
    }
    await pool.query(
      `INSERT INTO connection_tags (owner_id, connection_user_id, tag_type)
      VALUES ($1, $2, $3)
      ON CONFLICT DO NOTHING
      `,
      [owner_id, connection_user_id, tag_type]
    );

    res.status(201).json({ message: "Connection tag added" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Database error adding tag" });
  }
}

export async function deleteConnectionTag(req, res) {
  try {
    const { ownerId, connectionUserId, tagType } = req.params;

    await pool.query(
      `
      DELETE FROM connection_tags
      WHERE owner_id = $1
      AND connection_user_id = $2
      AND tag_type = $3
      `,
      [ownerId, connectionUserId, tagType]
    );

    res.json({ message: "Connection tag deleted" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Database error deleting tag" });
  }
}
export async function deleteJob(req, res) {
  try {
    const jobId = req.params.jobId;

    const deletedJob = await pool.query(
      `
      DELETE FROM jobs
      WHERE id = $1
      RETURNING id
      `,
      [jobId]
    );
    if (deletedJob.rows.length === 0) {
      return res.status(404).json({ message: "Job not found" });
    }
    res.json({ message: "Job deleted" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Database error deleting job" });
  }
}