import pool from "../config/db.js"
import { cleanString } from "../utils/validation.js";
import { deleteStoredFile, sendStoredFile, storeUpload } from "../utils/fileStorage.js";
import { canAccessPrivateResource } from "../utils/authorization.js";

export async function updateProfile(req, res){
    try{
        const id = req.user.id;
        const user_name = cleanString(req.body.name, { min: 2, max: 100 });
        if (!user_name) return res.status(400).json({ message: "Invalid profile name" });
        const existing = await pool.query(
            `SELECT "profilePicUrl", resumeattached FROM users WHERE id = $1`,
            [id]
        );
        if (existing.rows.length === 0) return res.status(404).json({ message: "User not found" });
        const user_profilePicUrl = req.files?.image
            ? await storeUpload(req.files.image[0], { userId: id, category: "images" })
            : null;
        const user_resumeUrl = req.files?.resume
            ? await storeUpload(req.files.resume[0], { userId: id, category: "resumes" })
            : null;
        const user_genderIdentity = cleanString(req.body.genderIdentity || "", { min: 0, max: 100 });
        const user_occupation = cleanString(req.body.occupation || "", { min: 0, max: 150 });
        const user_bio = cleanString(req.body.bio || "", { min: 0, max: 2000 });
            const result = await pool.query(
            `UPDATE users
             SET name = $1,
                "profilePicUrl" = COALESCE($2, "profilePicUrl"),
                "genderIdentity" = $3,
                occupation = $4,
                bio = $5,
                resumeattached = COALESCE($6, resumeattached)
             WHERE id = $7
             RETURNING name, "profilePicUrl", "genderIdentity", occupation, bio, resumeattached`,
            [user_name, user_profilePicUrl, user_genderIdentity, user_occupation, user_bio, user_resumeUrl, id]
        );
            const oldFiles = existing.rows[0];
            const staleReferences = [
                user_profilePicUrl && oldFiles.profilePicUrl,
                user_resumeUrl && oldFiles.resumeattached,
            ].filter(Boolean);
            await Promise.allSettled(staleReferences.map(deleteStoredFile));
            return res.status(200).json(result.rows[0]);
    } catch(err){
        console.log(err);
        return res.status(500).json({message: "Database error"});
    }
   
}

export async function showProfile(req, res){
    try {
        const id = Number(req.params.id);
        const isOwnerOrAdmin = canAccessPrivateResource(req.user, id);
        const user = await pool.query(
          `SELECT name, "profilePicUrl", "genderIdentity", occupation, bio${isOwnerOrAdmin ? ", resumeattached" : ""}
           FROM users WHERE id = $1`, [id]
        );
        if (user.rows.length === 0) return res.status(404).json({ message: "User not found" });
        const profile = user.rows[0];
        const baseUrl = process.env.BACKEND_URL || "http://localhost:5001";
        if (profile.profilePicUrl) profile.profilePicUrl = `${baseUrl}/api/Profile/${id}/image`;
        if (profile.resumeattached) profile.resumeattached = `/api/Profile/${id}/resume`;
        res.send(profile);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Database error" });
    }
}

export async function removeResume(req, res) {
    const id = req.user.id;
    let client;
    let resumeReference = null;

    try {
        client = await pool.connect();
        await client.query("BEGIN");

        const existing = await client.query(
          `SELECT resumeattached
           FROM users
           WHERE id = $1
           FOR UPDATE`,
          [id]
        );

        if (existing.rows.length === 0) {
            await client.query("ROLLBACK");
            return res.status(404).json({ message: "User not found" });
        }

        resumeReference = existing.rows[0].resumeattached;
        await client.query(
          "UPDATE users SET resumeattached = NULL WHERE id = $1",
          [id]
        );
        await client.query("COMMIT");

        if (resumeReference) {
            try {
                await deleteStoredFile(resumeReference);
            } catch (error) {
                console.error("Unable to delete removed resume file:", error);
            }
        }

        return res.json({ message: "Resume removed", resumeattached: null });
    } catch (error) {
        if (client) await client.query("ROLLBACK").catch(() => {});
        console.error("Remove resume error:", error);
        return res.status(500).json({ message: "Unable to remove resume" });
    } finally {
        client?.release();
    }
}

export function sendProfileFile(kind) {
    return async (req, res) => {
        const userId = Number(req.params.id);
        if (kind === "resume" && !canAccessPrivateResource(req.user, userId)) {
            return res.status(404).json({ message: "File not found" });
        }
        try {
            const column = kind === "image" ? '"profilePicUrl"' : "resumeattached";
            const result = await pool.query(`SELECT ${column} AS reference FROM users WHERE id = $1`, [userId]);
            if (result.rows.length === 0 || !await sendStoredFile(res, result.rows[0].reference)) {
                return res.status(404).json({ message: "File not found" });
            }
        } catch (error) {
            console.error("Stored file error:", error);
            if (!res.headersSent) res.status(500).json({ message: "Unable to retrieve file" });
        }
    };
}
