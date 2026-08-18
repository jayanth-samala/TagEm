import pool from "../config/db.js";
import bcrypt from "bcrypt";
import { isStrongPassword } from "../utils/validation.js";
import { canAdminManageTarget } from "../utils/authorization.js";

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

async function checkManageableTarget(userId, res) {
  const id = Number(userId);
  if (!Number.isInteger(id) || id <= 0) {
    res.status(400).json({ message: "Invalid user" });
    return false;
  }

  const target = await pool.query("SELECT id, is_admin FROM users WHERE id = $1", [id]);
  if (target.rows.length === 0) {
    res.status(404).json({ message: "User not found" });
    return false;
  }
  if (!canAdminManageTarget(target.rows[0])) {
    res.status(403).json({ message: "Administrator accounts cannot be modified by other administrators" });
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
      SELECT id, name, email, "profilePicUrl", "genderIdentity",
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
    const manageable = await checkManageableTarget(userId, res);
    if (!manageable) return;

    const { name, email, profilePicUrl, genderIdentity, occupation, bio, resumeattached, networkconnections } = req.body;

    const updatedUser = await pool.query(
      `
      UPDATE users
      SET name = $1,
          email = $2,
          "profilePicUrl" = $3,
          "genderIdentity" = $4,
          occupation = $5,
          bio = $6,
          resumeattached = $7,
          networkconnections = $8
      WHERE id = $9 AND is_admin = false
      RETURNING id, name, email, "profilePicUrl", "genderIdentity",
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
    const manageable = await checkManageableTarget(userId, res);
    if (!manageable) return;

    if (!isStrongPassword(newPassword)) {
      return res.status(400).json({ message: "Password must be 8–128 characters with at least one letter and one number" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    const updatedUser = await pool.query(
      `
      UPDATE users
      SET password = $1,
          auth_token_version = auth_token_version + 1
      WHERE id = $2 AND is_admin = false
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
    const manageable = await checkManageableTarget(userId, res);
    if (!manageable) return;

    const deletedUser = await pool.query(
      `
      DELETE FROM users
      WHERE id = $1 AND is_admin = false
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
