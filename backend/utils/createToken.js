import jwt from "jsonwebtoken";
import { getJwtSecret } from "../config/securityEnvironment.js";

export function createToken(user) {
    return jwt.sign(
        {
            id: user.id,
            tokenVersion: user.auth_token_version ?? 0,
        },
        getJwtSecret(),
        {
            expiresIn: process.env.JWT_EXPIRES_IN || "1h",
        }
    );
}
