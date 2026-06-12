import express from 'express';
import { listTeam, addTeamMember, removeTeamMember } from '../controllers/team.js';
import { verifyPartner } from '../utils/verifyToken.js';

const router = express.Router();

// All team routes require a verified partner (or admin)
router.get('/:id/team', verifyPartner, listTeam);
router.post('/:id/team', verifyPartner, addTeamMember);
router.delete('/:id/team/:userId', verifyPartner, removeTeamMember);

export default router;
