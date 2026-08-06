import pool from "../config/db.js"

export async function getUsers(req, res) {
    try {
        const users = await pool.query('SELECT id, name, email, "profilePicUrl", occupation, bio FROM users ORDER BY name');
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
          `SELECT id, name, email, "genderIdentity", occupation, bio, "profilePicUrl"${includeResume ? ", resumeattached" : ""}
           FROM users WHERE id = $1`, [userId]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ message: "User not found" });
        }
        const user = result.rows[0];
        const profileData = {
            name: user.name,
            email: user.email,
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
