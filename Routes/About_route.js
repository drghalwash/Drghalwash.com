import { Router } from 'express';
import { index,index2 } from '../Controller/About.js';
const router = new Router();
router.get('/Dr_Khaled', index);
router.get('/Dr_Mohamed', index2);
export default router;