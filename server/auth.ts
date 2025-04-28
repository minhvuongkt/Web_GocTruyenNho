import express from 'express';
import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import session from 'express-session';
import bcrypt from 'bcryptjs';
import { storage } from './storage';
import { type User } from '@shared/schema';

declare global {
    namespace Express {
        interface User extends User {}
    }
}

export async function hashPassword(password: string) {
    return bcrypt.hash(password, 10);
}

export async function comparePasswords(supplied: string, stored: string) {
    return bcrypt.compare(supplied, stored);
}

export function setupAuth(app: express.Express) {
    // Configure session
    app.use(
        session({
            secret: process.env.SESSION_SECRET || 'super-secret',
            resave: false,
            saveUninitialized: false,
            cookie: {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                maxAge: 24 * 60 * 60 * 1000 // 24 hours
            },
            store: storage.sessionStore
        })
    );

    // Initialize Passport
    app.use(passport.initialize());
    app.use(passport.session());

    // Configure local strategy
    passport.use(
        new LocalStrategy(async (username, password, done) => {
            try {
                // Get user by username
                const user = await storage.getUserByUsername(username);
                
                if (!user) {
                    return done(null, false, { message: 'Incorrect username.' });
                }
                
                // Check password
                const isValid = await comparePasswords(password, user.password);
                
                if (!isValid) {
                    return done(null, false, { message: 'Incorrect password.' });
                }
                
                // Check if the user is active
                if (!user.isActive) {
                    return done(null, false, { message: 'Account is disabled.' });
                }
                
                return done(null, user);
            } catch (err) {
                return done(err);
            }
        })
    );

    // Configure serialization
    passport.serializeUser((user, done) => {
        done(null, user.id);
    });

    passport.deserializeUser(async (id: number, done) => {
        try {
            const user = await storage.getUser(id);
            done(null, user);
        } catch (err) {
            done(err);
        }
    });
}