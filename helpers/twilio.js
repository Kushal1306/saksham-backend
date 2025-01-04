import twilio from 'twilio';
import dotenv from 'dotenv';
import { findCandidateByCandidateId } from './feedback.js';

dotenv.config();

const accountSid =process.env.ACCOUNTSId;
const authToken=process.env.TWILIO_AUTH_TOKEN;
const client = twilio(accountSid, authToken);


export const notifyFeedback=async(conversationId,feedBack)=>{
    try {
        const candidateDetails=await findCandidateByCandidateId(conversationId);
        if(!candidateDetails)
            return false;
        let message=`${candidateDetails.name} ( ${candidateDetails.email}) \n took the interview and Feedback has been generated\n`;
        const response=await client.messages.create({
            body: message,
            from: '+19785416859',
            to: '+916281142549'
        });
        // console.log("response is:",response);
        if(!response)
            return false;
        return true;
    } catch (error) {
        console.log("error occured",error.message);
        return false;
    }
}