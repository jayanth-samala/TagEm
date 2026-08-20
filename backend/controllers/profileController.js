import pool from "../config/db.js"

export async function updateProfile(req, res){
    try{
        console.log("hi");
        const id = req.params.id;
        const user_name = req.body.name;
        const user_profilePicUrl = req.files?.image
            ? `http://localhost:5001/${req.files.image[0].path}`
            : req.body.profilePicUrl;
        const user_resumeUrl = req.files.resume
            ? `/uploads/${req.files.resume[0].filename}`
            : req.body.resume;
        const user_genderIdentity = req.body.genderIdentity;
        const user_occupation = req.body.occupation;
        const user_bio = req.body.bio;
        const updatedPicUrl = req.file ? req.file.path : req.body.profilePicUrl;
            const result = await pool.query(
            `UPDATE users
             SET name = $1,
                "profilePicUrl" = $2,
                "genderIdentity" = $3,
                occupation = $4,
                bio = $5,
                resumeattached = $6
             WHERE id = $7
             RETURNING name, "profilePicUrl", "genderIdentity", occupation, bio, resumeattached`,
            [user_name, user_profilePicUrl, user_genderIdentity, user_occupation, user_bio, user_resumeUrl, id]
        );
            console.log("User updated successfully");
            return res.status(200).json(result.rows[0]);
    } catch(err){
        console.log(err);
        return res.status(500).json({message: "Database error"});
    }
   
}

export async function showProfile(req, res){
    const id = req.params.id;
    const user = await pool.query('SELECT name, "profilePicUrl", "genderIdentity", occupation, bio, resumeattached FROM users WHERE id = $1', [id]);
    console.log(user.rows[0]);
    res.send(user.rows[0]);
}
