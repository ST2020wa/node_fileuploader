import express from 'express';
import { PrismaSessionStore } from '@quixo3/prisma-session-store';
import session from 'express-session';
import passport from 'passport';
import { PrismaClient } from '@prisma/client';
import LocalStrategy from 'passport-local';

import multer from 'multer';
const upload = multer({ dest: 'uploads/' });

const prisma = new PrismaClient();
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

passport.use(new LocalStrategy(async (username, password, done) => {
    const user = await prisma.user.findUnique({ where: { username } });
    if (!user || user.password !== password) return done(null, false);
    return done(null, user);
  }));
  passport.serializeUser((user: any, done) => done(null, user.id));
  passport.deserializeUser(async (id: number, done) => {
    const user = await prisma.user.findUnique({ where: { id } });
    done(null, user);
  });

app.use(session({
    secret: process.env.SESSION_SECRET || 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    store: new PrismaSessionStore(new PrismaClient(), {
      checkPeriod: 2 * 60 * 1000,  // Cleanup expired sessions every 2 minutes
      dbRecordIdIsSessionId: true,
    }),
  }));

  app.use(passport.initialize());
  app.use(passport.session());

  app.post('/upload', upload.single('file'), (req, res) => {
    if (!req.file) return res.status(400).send('No file uploaded.');
    res.send('File uploaded!');
  });
  
app.listen(3000, () => console.log('Server running on port 3000'));
