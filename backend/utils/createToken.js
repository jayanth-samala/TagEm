import jwt from "jsonwebtoken";

export function createToken(user) {
    return jwt.sign(
        {
            id: user.id,
            tokenVersion: user.auth_token_version ?? 0,
        },
        process.env.JWT_SECRET,
        {
            expiresIn: process.env.JWT_EXPIRES_IN || "1h",
        }
    );
}
