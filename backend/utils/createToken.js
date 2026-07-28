import jwt from "jsonwebtoken";

export function createToken(user) {
    return jwt.sign(
        {
            id: user.id,
        },
        process.env.JWT_SECRET,
        {
            expiresIn: process.env.JWT_EXPIRES_IN || "1h",
        }
    );
}
