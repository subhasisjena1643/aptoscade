import { Router } from 'express';
import { getAccount, getBalance, getTransaction, submitTransaction, requestFaucet } from '../controllers/aptosController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/account/:address', getAccount);
router.get('/balance/:address', getBalance);
router.get('/transaction/:hash', getTransaction);
router.post('/transactions', authenticate, submitTransaction);
router.post('/faucet', requestFaucet);

export default router;
