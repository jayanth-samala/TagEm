import pool from "../config/db.js";
import bcrypt from "bcrypt";

async function checkAdmin(adminId, res) {
  const admin = await pool.query(
    "SELECT is_admin FROM users WHERE id = $1",
    [adminId]
  );

  if (admin.rows.length === 0) {
    res.status(404).json({ message: "Admin user not found" });
    return false;
  }

  if (!admin.rows[0].is_admin) {
    res.status(403).json({ message: "Admin access only" });
    return false;
  }

  return true;
}

export async function getAllUsers(req, res) {
  try {
    const adminId = req.user.id;

    const allowed = await checkAdmin(adminId, res);
    if (!allowed) return;

    const users = await pool.query(`
      SELECT id, name, email, "profilePicUrl", genderIdentity,
             occupation, bio, resumeattached, networkconnections, is_admin
      FROM users
      ORDER BY id
    `);

    res.json(users.rows);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Database error" });
  }
}

export async function updateUser(req, res) {
  try {
    const adminId = req.user.id;
    const userId = req.params.userId;

    const allowed = await checkAdmin(adminId, res);
    if (!allowed) return;

    const { name, email, profilePicUrl, genderIdentity, occupation, bio, resumeattached, networkconnections, is_admin } = req.body;

    const updatedUser = await pool.query(
      `
      UPDATE users
      SET name = $1,
          email = $2,
          "profilePicUrl" = $3,
          genderIdentity = $4,
          occupation = $5,
          bio = $6,
          resumeattached = $7,
          networkconnections = $8,
          is_admin = $9
      WHERE id = $10
      RETURNING id, name, email, "profilePicUrl", genderIdentity,
                occupation, bio, resumeattached, networkconnections, is_admin
      `,
      [
        name,
        email,
        profilePicUrl,
        genderIdentity,
        occupation,
        bio,
        resumeattached,
        networkconnections,
        is_admin,
        userId,
      ]
    );

    if (updatedUser.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      message: "User updated",
      user: updatedUser.rows[0],
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Database error during update" });
  }
}

export async function changeUserPassword(req, res) {
  try {
    const adminId = req.user.id;
    const userId = req.params.userId;
    const newPassword = req.body.password;

    const allowed = await checkAdmin(adminId, res);
    if (!allowed) return;

    if (!newPassword) {
      return res.status(400).json({ message: "Password is required" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    const updatedUser = await pool.query(
      `
      UPDATE users
      SET password = $1
      WHERE id = $2
      RETURNING id
      `,
      [hashedPassword, userId]
    );

    if (updatedUser.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ message: "Password updated" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Database error during password update" });
  }
}

export async function deleteUser(req, res) {
  try {
    const adminId = req.user.id;
    const userId = req.params.userId;

    const allowed = await checkAdmin(adminId, res);
    if (!allowed) return;

    const deletedUser = await pool.query(
      `
      DELETE FROM users
      WHERE id = $1
      RETURNING id
      `,
      [userId]
    );

    if (deletedUser.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ message: "User deleted" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Database error during delete" });
  }
}

export async function resetDatabase(req, res) {
  try {
    const adminId = req.user.id;

    const allowed = await checkAdmin(adminId, res);
    if (!allowed) return;

    await pool.query("BEGIN");

    await pool.query(`DELETE FROM connections`);
    await pool.query(`DELETE FROM "connectionRequests"`);
    await pool.query(`DELETE FROM users`);

    const password = await bcrypt.hash("password123", 10);

    await pool.query(
      `
      INSERT INTO users (name, email, password, is_admin)
      VALUES
        ($1, $2, $3, $4)`,
      [
        "Admin User",
        "admin@test.com",
        password,
        true
      ]
    );

    await pool.query("COMMIT");

    res.json({ message: "Database reset and repopulated" });
  } catch (err) {
    await pool.query("ROLLBACK");
    console.log(err);
    res.status(500).json({ message: "Database reset failed" });
  }
}