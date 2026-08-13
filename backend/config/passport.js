import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import pool from "../config/db.js"
import bcrypt from "bcrypt";

passport.use(new LocalStrategy ({
      usernameField: "email", passwordField: "password"
    },(async function verify(user_email, user_password, cb) {
    try{
        const result = await pool.query(
          `SELECT id, name, email, password, is_admin, "profilePicUrl", auth_token_version
           FROM users WHERE email = $1`, [user_email.trim().toLowerCase()]
        );
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
        const googleEmail = profile.emails?.find((entry) => entry.verified === true) || profile.emails?.[0];
        if (!googleEmail?.value || googleEmail.verified === false) {
          return done(null, false, { message: "Google did not provide a verified email address." });
        }
        const email = googleEmail.value.toLowerCase();
        const googleSubject = profile.id;
        const name = profile.displayName;
        const picture = profile.photos && profile.photos.length > 0 ? profile.photos[0].value : null;

        const result = await pool.query(
          `SELECT id, name, email, password, google_subject, is_admin, "profilePicUrl", auth_token_version
           FROM users WHERE email = $1`, [email]
        );
        
        if (result.rows.length > 0) {
          const existingUser = result.rows[0];
          if (existingUser.google_subject === googleSubject) {
            return done(null, existingUser);
          }
          if (existingUser.password || existingUser.google_subject) {
            return done(null, false, { message: "This email is already registered with another sign-in method." });
          }

          const linked = await pool.query(
            `UPDATE users SET google_subject = $1
             WHERE id = $2 AND password IS NULL AND google_subject IS NULL
             RETURNING id, name, email, is_admin, "profilePicUrl", auth_token_version`,
            [googleSubject, existingUser.id]
          );
          if (linked.rows.length === 0) return done(null, false);
          return done(null, linked.rows[0]);
        } else {
          const newUser = await pool.query(
            `INSERT INTO users (name, email, "profilePicUrl", google_subject)
             VALUES ($1, $2, $3, $4)
             RETURNING id, name, email, is_admin, "profilePicUrl", auth_token_version`,
            [name, email, picture, googleSubject]
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
