import pool from "../config/db.js";
import { cleanString } from "../utils/validation.js";

export async function getMeetups(req, res) {
  try {
    const result = await pool.query(`
      SELECT meetups.*, users.name AS event_creator_name 
      FROM meetups 
      JOIN users ON meetups.event_creator_id = users.id 
      ORDER BY event_date ASC
    `);

    res.status(200).json(result.rows);
  } catch (error) {
    res.status(500).json({ error: "Failed to get meetups" });
  }
}

export async function getMeetupById(req, res) {
  const { id } = req.params;
  try {
    const result = await pool.query(
      `
      SELECT 
        meetups.*, 
        users.name AS event_creator_name
      FROM meetups
      JOIN users 
      ON meetups.event_creator_id = users.id
      WHERE meetups.id = $1
      `,
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Meetup not found" });
    }
    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Failed to get meetup" });
  }
}

export async function getSuggestedMeetups(req, res) {
  const { location, currentMeetupId } = req.params;
  try {
    const result = await pool.query(
      `
      SELECT 
        meetups.*, 
        users.name AS event_creator_name
      FROM meetups
      JOIN users 
      ON meetups.event_creator_id = users.id
      WHERE LOWER(meetups.event_location) = LOWER($1)
      AND meetups.id != $2
      ORDER BY meetups.event_date ASC
      LIMIT 5
      `,
      [location, currentMeetupId]
    );
    res.status(200).json(result.rows);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Failed to get suggested meetups" });
  }
}

export async function createMeetup(req, res) {
  const {
    event_name,
    event_location,
    event_date,
    event_bio,
  } = req.body;
  const safeName = cleanString(event_name, { max: 100 });
  const safeLocation = cleanString(event_location, { max: 100 });
  const safeBio = cleanString(event_bio || "", { min: 0, max: 2000 });
  if (!safeName || !safeLocation || !/^\d{4}-\d{2}-\d{2}$/.test(event_date || "")) {
    return res.status(400).json({ error: "Invalid meetup details" });
  }
  try {
    const result = await pool.query(
      `INSERT INTO meetups 
        (event_name, event_location, event_date, event_bio, event_creator_id)
       VALUES 
        ($1, $2, $3, $4, $5)
       RETURNING *`,
      [safeName, safeLocation, event_date, safeBio, req.user.id]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Failed to create meetup" });
  }
}

export async function updateMeetup(req, res) {
  const { id } = req.params;
  const {
    event_name,
    event_location,
    event_date,
    event_bio,
  } = req.body;
  const safeName = cleanString(event_name, { max: 100 });
  const safeLocation = cleanString(event_location, { max: 100 });
  const safeBio = cleanString(event_bio || "", { min: 0, max: 2000 });
  if (!safeName || !safeLocation || !/^\d{4}-\d{2}-\d{2}$/.test(event_date || "")) {
    return res.status(400).json({ error: "Invalid meetup details" });
  }
  try {
    const result = await pool.query(
      `UPDATE meetups
       SET 
        event_name = $1,
        event_location = $2,
        event_date = $3,
        event_bio = $4
       WHERE id = $5 AND event_creator_id = $6
       RETURNING *`,
      [safeName, safeLocation, event_date, safeBio, id, req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Meetup not found" });
    }
    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Failed to update meetup" });
  }
}

export async function deleteMeetup(req, res) {
  const { id } = req.params;
  try {
    const result = await pool.query(
      "DELETE FROM meetups WHERE id = $1 AND event_creator_id = $2 RETURNING id",
      [id, req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Meetup not found" });
    }
    res.status(200).json({ message: "Meetup deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete meetup" });
  }
}
