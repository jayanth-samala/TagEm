import pool from "../config/db.js"
import { cleanString } from "../utils/validation.js";

export async function updateProfile(req, res){
    try{
        const id = req.user.id;
        const user_name = cleanString(req.body.name, { min: 2, max: 100 });
        if (!user_name) return res.status(400).json({ message: "Invalid profile name" });
        const user_profilePicUrl = req.files?.image
            ? `${process.env.BACKEND_URL || "http://localhost:5001"}/uploads/${req.files.image[0].filename}`
            : null;
        const user_resumeUrl = req.files?.resume
            ? `/uploads/${req.files.resume[0].filename}`
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
            return res.status(200).json(result.rows[0]);
    } catch(err){
        console.log(err);
        return res.status(500).json({message: "Database error"});
    }
   
}

export async function showProfile(req, res){
    try {
        const id = Number(req.params.id);
        const isOwnerOrAdmin = id === req.user.id || req.user.is_admin;
        const user = await pool.query(
          `SELECT name, "profilePicUrl", "genderIdentity", occupation, bio${isOwnerOrAdmin ? ", resumeattached" : ""}
           FROM users WHERE id = $1`, [id]
        );
        if (user.rows.length === 0) return res.status(404).json({ message: "User not found" });
        res.send(user.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Database error" });
    }
}
