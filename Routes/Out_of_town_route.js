import { Router } from 'express';
import { index ,Concierge_Services,Consultation_Process,Hotels_Accommodations,Alexandria_Attractions} from '../Controller/Out_of_town.js';
const router = new Router();
router.get('/', index);
router.get('/Concierge_Services', Concierge_Services);
router.get('/Consultation_Process', Consultation_Process);
router.get('/Hotels_Accommodations', Hotels_Accommodations);
router.get('/Alexandria_Attractions', Alexandria_Attractions);

export default router;
