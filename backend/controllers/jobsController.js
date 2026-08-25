import pool from "../config/db.js";
import { cleanPositiveIntegerArray, cleanString, cleanStringArray } from "../utils/validation.js";

export async function getJobsForUser(req, res) {
  try {
    const userId = req.user.id;
    if (Number(req.params.userId) !== userId) return res.status(403).json({ message: "Access denied" });
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
    const userId = req.user.id;
    if (Number(req.params.userId) !== userId) return res.status(403).json({ message: "Access denied" });
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
  let client;
  try {
    const {
      title,
      company,
      location,
      description,
      selectedUserIds,
      selectedTagTypes,
    } = req.body;

    const sender_id = req.user.id;
    const safeTitle = cleanString(title, { max: 255 });
    const safeCompany = cleanString(company, { max: 255 });
    const safeLocation = cleanString(location, { max: 255 });
    const safeDescription = cleanString(description, { max: 5000 });
    const safeUserIds = cleanPositiveIntegerArray(selectedUserIds, { max: 100 });
    const safeTagTypes = cleanStringArray(selectedTagTypes, { maxItems: 50, maxLength: 255 });
    if (!safeTitle || !safeCompany || !safeLocation || !safeDescription || !safeUserIds || !safeTagTypes) {
      return res.status(400).json({ message: "Invalid job details or recipient selection" });
    }
    client = await pool.connect();
    await client.query("BEGIN");

    const newJob = await client.query(
      `
      INSERT INTO jobs (title, company, location, description, sender_id)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id
      `,
      [safeTitle, safeCompany, safeLocation, safeDescription, sender_id]
    );
    const jobId = newJob.rows[0].id;
    await client.query(
      `WITH requested_recipients AS (
         SELECT UNNEST($2::integer[]) AS recipient_id
         UNION
         SELECT connection_user_id
         FROM connection_tags
         WHERE owner_id = $3
           AND tag_type = ANY($4::varchar[])
       )
       INSERT INTO job_recipients (job_id, recipient_id)
       SELECT $1, requested.recipient_id
       FROM requested_recipients requested
       WHERE EXISTS (
         SELECT 1
         FROM connections
         WHERE (user1_id = $3 AND user2_id = requested.recipient_id)
            OR (user1_id = requested.recipient_id AND user2_id = $3)
       )
       ON CONFLICT DO NOTHING`,
      [jobId, safeUserIds, sender_id, safeTagTypes]
    );

    await client.query("COMMIT");

    res.status(201).json({ message: "Job created" });
  } catch (err) {
    if (client) await client.query("ROLLBACK");
    console.log(err);
    res.status(500).json({ message: "Database error creating job" });
  } finally {
    client?.release();
  }
}

export async function getJobSendOptions(req, res) {
  try {
    const userId = req.user.id;
    if (Number(req.params.userId) !== userId) return res.status(403).json({ message: "Access denied" });
    const connections = await pool.query(
      `
      SELECT 
        u.id,
        u.name,
        u."profilePicUrl",
        COALESCE(
          ARRAY_AGG(DISTINCT ct.tag_type ORDER BY ct.tag_type)
            FILTER (WHERE ct.tag_type IS NOT NULL),
          ARRAY[]::varchar[]
        ) AS tags
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
      GROUP BY u.id, u.name, u."profilePicUrl"
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
    const owner_id = req.user.id;
    const { connection_user_id } = req.body;
    const tag_type = cleanString(req.body.tag_type, { max: 255 });

    if (!owner_id || !connection_user_id || !tag_type) {
      return res.status(400).json({ message: "Missing required fields" });
    }
    await pool.query(
      `INSERT INTO connection_tags (owner_id, connection_user_id, tag_type)
      SELECT $1, $2, $3
      WHERE EXISTS (
        SELECT 1 FROM connections
        WHERE (user1_id = $1 AND user2_id = $2) OR (user1_id = $2 AND user2_id = $1)
      )
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

export async function updateConnectionTag(req, res) {
  try {
    const ownerId = req.user.id;
    const connectionUserId = Number(req.params.connectionUserId);
    const oldTag = cleanString(req.body.old_tag, { max: 255 });
    const newTag = cleanString(req.body.new_tag, { max: 255 });

    if (!Number.isInteger(connectionUserId) || connectionUserId <= 0 || !oldTag || !newTag) {
      return res.status(400).json({ message: "Invalid tag details" });
    }

    const updated = await pool.query(
      `UPDATE connection_tags
       SET tag_type = $1
       WHERE owner_id = $2
         AND connection_user_id = $3
         AND tag_type = $4
       RETURNING tag_type`,
      [newTag, ownerId, connectionUserId, oldTag]
    );

    if (updated.rows.length === 0) {
      return res.status(404).json({ message: "Tag not found" });
    }

    res.json({ message: "Connection tag updated", tag: updated.rows[0].tag_type });
  } catch (err) {
    if (err.code === "23505") {
      return res.status(409).json({ message: "That tag already exists" });
    }
    console.log(err);
    res.status(500).json({ message: "Database error updating tag" });
  }
}

export async function deleteConnectionTag(req, res) {
  try {
    const { connectionUserId, tagType } = req.params;
    const ownerId = req.user.id;
    if (Number(req.params.ownerId) !== ownerId) return res.status(403).json({ message: "Access denied" });

    const deleted = await pool.query(
      `
      DELETE FROM connection_tags
      WHERE owner_id = $1
      AND connection_user_id = $2
      AND tag_type = $3
      RETURNING id
      `,
      [ownerId, connectionUserId, tagType]
    );

    if (deleted.rows.length === 0) {
      return res.status(404).json({ message: "Tag not found" });
    }

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
      WHERE id = $1 AND sender_id = $2
      RETURNING id
      `,
      [jobId, req.user.id]
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
