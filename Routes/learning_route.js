
import express from 'express';
import { addLearning } from '../Controller/learning.js';

const router = express.Router();
router.post('/add', addLearning);

export default router;
