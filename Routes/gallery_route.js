
import express from 'express';
import { index } from '../Controller/gallery.js';
import { validatePassword, checkAccess, clearAuth } from '../Controller/galleryAccess.js';
import cookieParser from 'cookie-parser';
import expressSession from 'express-session';

const router = express.Router();

// Apply cookie-parser middleware
router.use(cookieParser());

// Add session middleware for temporary storage
router.use(expressSession({
  secret: process.env.SESSION_SECRET || 'gallery-session-secret',
  resave: false,
  saveUninitialized: true,
  cookie: { maxAge: 60 * 60 * 1000 } // 1 hour
}));

// Add body parsers for JSON and form data
router.use(express.json());
router.use(express.urlencoded({ extended: true }));

// Password validation endpoint
router.post('/validate-password', validatePassword);

// Clear authentication tokens
router.get('/clear-auth', clearAuth);

// Gallery/subgallery pages with access check
router.get('/:slug?/:subSlug?', checkAccess, index);

export default router;
