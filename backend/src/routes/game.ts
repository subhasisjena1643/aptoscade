import { Router } from 'express';
import { getGames, getGame, submitScore, getGameScores } from '../controllers/gameController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/', getGames);
router.get('/:id', getGame);
router.post('/:id/score', authenticate, submitScore);
router.get('/:id/scores', getGameScores);

export default router;
