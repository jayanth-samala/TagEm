import pool from "../config/db.js";
import { cleanString, parseOptionalPositiveInteger } from "../utils/validation.js";

export async function createPosts(req, res) {
    try {
        const user_id = req.user.id;
        const content = cleanString(req.body.content, { max: 5000 });
        const parent_post_id = parseOptionalPositiveInteger(req.body.parent_post_id);
        if (!content || parent_post_id === undefined) {
            return res.status(400).json({ message: "Invalid post content or parent post" });
        }
        const result = parent_post_id === null
            ? await pool.query(
                `INSERT INTO posts (user_id, content, parent_post_id)
                 VALUES ($1, $2, NULL)
                 RETURNING *`,
                [user_id, content]
            )
            : await pool.query(
                `INSERT INTO posts (user_id, content, parent_post_id)
                 SELECT $1, $2, id
                 FROM posts
                 WHERE id = $3 AND parent_post_id IS NULL
                 RETURNING *`,
                [user_id, content, parent_post_id]
            );
        if (result.rows.length === 0) {
            return res.status(404).json({ message: "Parent post not found" });
        }
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
            `SELECT p.*,
                    EXISTS (
                      SELECT 1 FROM post_likes pl
                      WHERE pl.post_id = p.id AND pl.user_id = $1
                    ) AS liked_by_user
             FROM posts p
             WHERE p.parent_post_id IS NULL
             ORDER BY p.created_at DESC`,
            [req.user.id]
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
            `SELECT p.*,
                    EXISTS (
                      SELECT 1 FROM post_likes pl
                      WHERE pl.post_id = p.id AND pl.user_id = $2
                    ) AS liked_by_user
             FROM posts p
             WHERE p.user_id = $1 AND p.parent_post_id IS NULL
             ORDER BY p.created_at DESC`,
            [userId, req.user.id]
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
            `SELECT p.*,
                    EXISTS (
                      SELECT 1 FROM post_likes pl
                      WHERE pl.post_id = p.id AND pl.user_id = $2
                    ) AS liked_by_user
             FROM posts p
             WHERE p.id = $1 AND p.parent_post_id IS NULL`,
            [Id, req.user.id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ message: "Post not found" });
        }
        const post = result.rows[0];
        const commentsResult = await pool.query(
            `SELECT p.*, u.name AS user_name
             FROM posts p
             JOIN users u ON u.id = p.user_id
             WHERE p.parent_post_id = $1
             ORDER BY p.created_at ASC`,
            [Id]
        );
        post.comments = commentsResult.rows;
        res.status(200).json(post);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Internal Server Error" });
    }
}
export async function deleteReply(req, res) {
    try {
        const replyId = Number(req.params.id);
        if (!Number.isInteger(replyId) || replyId <= 0) {
            return res.status(400).json({ message: "Invalid reply" });
        }

        const deleted = await pool.query(
            `DELETE FROM posts
             WHERE id = $1
               AND user_id = $2
               AND parent_post_id IS NOT NULL
             RETURNING id`,
            [replyId, req.user.id]
        );

        if (deleted.rows.length === 0) {
            return res.status(404).json({ message: "Reply not found" });
        }

        return res.json({ message: "Reply deleted" });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Internal Server Error" });
    }
}
export async function deletePost(req, res) {
    try {
        const postId = Number(req.params.id);
        if (!Number.isInteger(postId) || postId <= 0) {
            return res.status(400).json({ message: "Invalid post" });
        }

        const deleted = await pool.query(
            `DELETE FROM posts
             WHERE id = $1
               AND user_id = $2
               AND parent_post_id IS NULL
             RETURNING id`,
            [postId, req.user.id]
        );

        if (deleted.rows.length === 0) {
            return res.status(404).json({ message: "Post not found" });
        }

        return res.json({ message: "Post deleted" });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Internal Server Error" });
    }
}
export async function likePost(req, res) {
    let client;
    try {
        const postId = Number(req.params.id);
        if (!Number.isInteger(postId) || postId <= 0) {
            return res.status(400).json({ message: "Invalid post" });
        }
        client = await pool.connect();
        await client.query("BEGIN");
        const removed = await client.query(
            `DELETE FROM post_likes
             WHERE post_id = $1 AND user_id = $2
             RETURNING post_id`,
            [postId, req.user.id]
        );
        let liked = false;
        if (removed.rows.length === 0) {
            const inserted = await client.query(
                `INSERT INTO post_likes (post_id, user_id)
                 SELECT id, $2 FROM posts WHERE id = $1 AND parent_post_id IS NULL
                 ON CONFLICT DO NOTHING
                 RETURNING post_id`,
                [postId, req.user.id]
            );
            liked = inserted.rows.length > 0;
        }
        const post = await client.query(
            `UPDATE posts
             SET likes_count = (SELECT COUNT(*) FROM post_likes WHERE post_id = $1)
             WHERE id = $1 AND parent_post_id IS NULL
             RETURNING *`,
            [postId]
        );
        if (post.rows.length === 0) {
            await client.query("ROLLBACK");
            return res.status(404).json({ message: "Post not found" });
        }
        await client.query("COMMIT");
        res.status(200).json({
            ...post.rows[0],
            liked_by_user: liked,
            message: liked ? "Post liked" : "Post unliked",
        });
    } catch (err) {
        if (client) await client.query("ROLLBACK");
        console.error(err);
        res.status(500).json({ message: "Internal Server Error"})
    } finally {
        client?.release();
    }

}
