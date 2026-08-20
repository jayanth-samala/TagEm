import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import pool from "../config/db.js"
import bcrypt from "bcrypt";

passport.use(new LocalStrategy ({
      usernameField: "email", passwordField: "password"
    },(async function verify(user_email, user_password, cb) {
    try{
        const result = await pool.query("SELECT * FROM users WHERE email = $1", [user_email]);
        if(result.rows.length === 0) {
            return cb(null, false, { message: 'Incorrect username or password.' });
        }
        const user = result.rows[0];
        const hashed_password = user["password"];
        if (!hashed_password) {
             return cb(null, false, { message: 'This account was created with Google. Please click "Log in with Google".' });
        }
        const match = await bcrypt.compare(user_password, hashed_password);

        if(!match) {
            return cb(null, false, { message: 'Incorrect username or password.' });
        } else {
            console.log("Login successful");
            return cb(null, user);
        }
    } catch(err) {
        return cb(err);
    }
})));
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "/api/auth/google/callback",
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails[0].value;
        const name = profile.displayName;
        const picture = profile.photos && profile.photos.length > 0 ? profile.photos[0].value : null;

        const result = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
        
        if (result.rows.length > 0) {
          return done(null, result.rows[0]);
        } else {
          const newUser = await pool.query(
            'INSERT INTO users (name, email, "profilePicUrl") VALUES ($1, $2, $3) RETURNING *',
            [name, email,picture]
          );
          return done(null, newUser.rows[0]);
        }
      } catch (err) {
        return done(err, null);
      }
    }
  )
);

export default passport;

