import express from 'express';
import isAuthenticated from '../middlewares/isAuthenticated.js';
import { fetchArticles, fetchPublicArticles } from '../controllers/fetch.controller.js';

const router = express.Router();

// Public route for fetching articles (no auth required)
router.get('/', fetchPublicArticles);

// Authenticated route for personalized articles
router.get('/fetch', isAuthenticated, fetchArticles);

export default router;
