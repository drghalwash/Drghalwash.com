import { Router } from 'express';
import { index, convertQuestionsToBlogsAPI } from '../Controller/Blog.js';
const router = new Router();
router.get('/', index);
router.get('/api/generate-from-qa', convertQuestionsToBlogsAPI);

export default router;