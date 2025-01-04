import express from 'express';
import { getInterviewData,createCampaign,AddCandidate, inviteToInterview, generateJD } from '../controllers/saksham.js';

const sakshamRouter=express.Router();

sakshamRouter.get("/interview/:candidateId",getInterviewData);

sakshamRouter.post("/campaign",createCampaign);

sakshamRouter.post("/candidate",AddCandidate);

sakshamRouter.post("/invite/:interviewId",inviteToInterview);

sakshamRouter.post("/generate",generateJD);




export default sakshamRouter;