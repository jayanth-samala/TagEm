import pool from "../config/db.js"
import { clearAuthCookies } from "../utils/authCookies.js";
import { deleteStoredFile } from "../utils/fileStorage.js";

export async function getUsers(req, res) {
    try {
        const users = await pool.query('SELECT id, name, "profilePicUrl", occupation, bio FROM users ORDER BY name');
        res.json(users.rows);
        
    } catch(err) {
        console.log(err);
        res.status(500).json({message: "Database error"});
    }
}
export async function getUserProfile(req, res) {
    try {
        const userId = req.params.id; 
        const includeResume = Number(userId) === req.user.id || req.user.is_admin;
        const result = await pool.query(
          `SELECT id, name, "genderIdentity", occupation, bio, "profilePicUrl"${includeResume ? ", email, resumeattached" : ""}
           FROM users WHERE id = $1`, [userId]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ message: "User not found" });
        }
        const user = result.rows[0];
        const profileData = {
            name: user.name,
            ...(includeResume ? { email: user.email } : {}),
            genderIdentity: user.genderIdentity,
            occupation: user.occupation,
            bio: user.bio,
            ...(includeResume ? { resumeAttached: user.resumeattached } : {}),
            profilePicUrl: user.profilePicUrl,
            networkConnections: 124
        };
        return res.status(200).json(profileData);
    } catch (err) {
        console.error("Error fetching user profile:", err);
        return res.status(500).json({ message: "Database error" });
    }
}

export async function deleteOwnAccount(req, res) {
    let client;
    try {
        client = await pool.connect();
        await client.query("BEGIN");

        const account = await client.query(
          `SELECT "profilePicUrl", resumeattached
           FROM users
           WHERE id = $1
           FOR UPDATE`,
          [req.user.id]
        );
        if (account.rows.length === 0) {
            await client.query("ROLLBACK");
            clearAuthCookies(res);
            return res.status(404).json({ message: "Account not found" });
        }

        const references = [
            account.rows[0].profilePicUrl,
            account.rows[0].resumeattached,
        ].filter(Boolean);
        await Promise.all(references.map(deleteStoredFile));

        const deleted = await client.query(
          `DELETE FROM users
           WHERE id = $1
           RETURNING id`,
          [req.user.id]
        );
        if (deleted.rows.length === 0) {
            await client.query("ROLLBACK");
            return res.status(404).json({ message: "Account not found" });
        }

        await client.query("COMMIT");
        clearAuthCookies(res);
        return res.json({ message: "Account and associated data deleted" });
    } catch (error) {
        if (client) await client.query("ROLLBACK");
        console.error("Account deletion error:", error);
        return res.status(500).json({ message: "Unable to delete account" });
    } finally {
        client?.release();
    }
}
