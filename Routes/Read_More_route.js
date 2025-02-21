import { Router } from 'express';
import { index as readMoreIndex, blog_back as readMoreBack } from '../Controller/Read_More.js';

const router = new Router();
router.get('/:id', readMoreIndex); // Handles Read More pages by slug
router.get('/blog_back/:id', readMoreBack); // Handles back navigation by category

export default router;
