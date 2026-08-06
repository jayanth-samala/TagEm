import pool from "../config/db.js"
import bcrypt from "bcrypt"
import { cleanString, isStrongPassword } from "../utils/validation.js";

export async function createUser(req, res) {
    try {
        const user_name = cleanString(req.body.name, { min: 2, max: 100 });
        const user_email = cleanString(req.body.email, { min: 3, max: 255 })?.toLowerCase();
        const user_password = req.body.password;

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if(user_name && isStrongPassword(user_password) && user_email && emailRegex.test(user_email)){
            const result = await pool.query("SELECT id FROM users WHERE email = $1", [user_email]);
            if(result.rows.length === 0) {
                const hashed_password = await bcrypt.hash(user_password, 10);
                await pool.query("INSERT INTO users(name, email, password) VALUES($1, $2, $3)",
                    [user_name, user_email, hashed_password]);
                    console.log("User created successfully");
                return res.status(201).json({message: "User created successfully"});
            } else {
                return res.status(409).json({message: "Email already exists"});
            }
        } else {
            return res.status(400).json({message: "Use a valid name and email, and a 12–128 character password containing uppercase, lowercase, number, and symbol"});
        }
        
    } catch(err) {
        console.log(err);
        return res.status(500).json({message: "Database error"});
    }
    
}
