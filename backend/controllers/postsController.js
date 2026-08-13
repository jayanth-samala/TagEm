import pool from "../config/db.js";
import { cleanString } from "../utils/validation.js";

export async function createPosts(req, res) {
    try {
        const user_id = req.user.id;
        const content = cleanString(req.body.content, { max: 5000 });
        const parent_post_id = req.body.parent_post_id || null;
        if (!content) {
            return res.status(400).json({ message: "Content cannot be empty" });
        }
        const result = await pool.query(
            `INSERT INTO posts (user_id, content, parent_post_id) VALUES ($1, $2, $3) RETURNING *`,
            [user_id, content, parent_post_id]
        );
        console.log("Post created successfully");
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Internal Server Error" });
    }
}
export async function getPosts(req, res) {
    try {
        const result = await pool.query(
            'SELECT * FROM posts WHERE parent_post_id IS NULL ORDER BY created_at DESC'
        );
        res.status(200).json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Internal Server Error" });
    }
}
export async function getPostsByUserId(req,res){
    try{
        const userId = req.params.userId;
        const result = await pool.query(
            'SELECT * FROM posts WHERE user_id = $1 AND parent_post_id IS NULL ORDER BY created_at DESC', [userId]
        );
        res.status(200).json(result.rows);
    } catch(err){
        console.log(err);
        return res.status(500).json({message: "Database error"});
    }
} 
export async function getPostsById(req, res) {
    try {
        const Id = req.params.id;
        const result = await pool.query(
            'SELECT * FROM posts WHERE id = $1',
            [Id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ message: "Post not found" });
        }
        const post = result.rows[0];
        const commentsResult = await pool.query(
            'SELECT * FROM posts WHERE parent_post_id = $1 ORDER BY created_at ASC',
            [Id]
        );
        post.comments = commentsResult.rows;
        res.status(200).json(post);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Internal Server Error" });
    }
}
export async function likePost(req, res) {
    let client;
    try {
        const postId = req.params.id;
        client = await pool.connect();
        await client.query("BEGIN");
        const inserted = await client.query(
            `INSERT INTO post_likes (post_id, user_id)
             SELECT id, $2 FROM posts WHERE id = $1
             ON CONFLICT DO NOTHING
             RETURNING post_id`,
            [postId, req.user.id]
        );
        const post = await client.query(
            `UPDATE posts
             SET likes_count = (SELECT COUNT(*) FROM post_likes WHERE post_id = $1)
             WHERE id = $1
             RETURNING *`,
            [postId]
        );
        if (post.rows.length === 0) {
            await client.query("ROLLBACK");
            return res.status(404).json({ message: "Post not found" });
        }
        await client.query("COMMIT");
        res.status(inserted.rows.length ? 200 : 409).json({
            ...post.rows[0],
            message: inserted.rows.length ? "Post liked" : "You already liked this post",
        });
    } catch (err) {
        if (client) await client.query("ROLLBACK");
        console.error(err);
        res.status(500).json({ message: "Internal Server Error"})
    } finally {
        client?.release();
    }

}
