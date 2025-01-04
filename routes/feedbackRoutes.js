import express from 'express';
import { getInterviewFeedback } from '../controllers/feeback.js';

const feedbackRoutes=express.Router();

feedbackRoutes.get("/:conversationId",getInterviewFeedback);


export default feedbackRoutes;