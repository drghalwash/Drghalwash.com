import { Router } from 'express';
import { index } from '../Controller/Questions_And_Answer.js';
const router = new Router();
router.get('/', index);
export default router;
