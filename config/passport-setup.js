const express = require('express');
const router = express.Router();
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const dotenv = require('dotenv').config();
const User = require('../models/userModel');

passport.serializeUser((user, done) => {
    done(null, user);
});

passport.deserializeUser((id, done) => {
    User.findById(id).then((user) => {
        done(null, user);
    }).catch(err => done(err));
});


passport.use(
    new GoogleStrategy({
        clientID: process.env.clientID,
        clientSecret: process.env.clientSecret,
        callbackURL: process.env.CALLBACK_URL,
    }, (accessToken, refreshToken, profile, done) => {

        console.log('passport-callback-function-fired');

        User.findOne({ googleId: profile.id }).then((currentUser) => {
            if (currentUser) {
                done(null, currentUser);
            } else {
                User.findOne({ email: profile.emails ? profile.emails[0].value : null }).then((userWithEmail) => {
                    if (userWithEmail) {
                        userWithEmail.googleId = profile.id;
                        userWithEmail.save().then((updatedUser) => {
                            console.log('Existing user updated with Google ID');
                            done(null, updatedUser);
                        }).catch(err => done(err));
                    } else {
                        new User({
                            username: profile.displayName,
                            googleId: profile.id,
                            email: profile.emails ? profile.emails[0].value : null
                        }).save().then((newUser) => {
                            console.log('New user saved to database');
                            done(null, newUser);
                        }).catch(err => done(err));
                    }
                }).catch(err => done(err));
            }
        }).catch(err => done(err));
    })
);



module.exports = router;
