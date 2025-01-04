import ConversationModel from "../models/ChatHistory.js";
import mongoose from "mongoose";
import Feedback from "../models/Feedback.js";
import Candidate from "../models/Candidate.js";

export const checkFeedback=async(conversationId)=>{
     try {
          let response=null;
          if(mongoose.isValidObjectId(conversationId)){
            response=await Feedback.findOne({
               'candidate_id':conversationId 
            }).populate('campaign_id');
          }
          if(!response)
            return null;
        return response;
     } catch (error) {
        console.log("error occured:",error.message);
        return null;
        
     }
}

export const getCandidateConversation=async(conversationId)=>{
    try {  
        let response=null; 
        if(mongoose.isValidObjectId(conversationId)){
            response = await ConversationModel.find(
                {
    
                    'conversationId':conversationId
                }
            ).populate({
                path:'conversationId',
                populate:{
                    path:'campaign_id'
                }
            });
        }
        // console.log("the response is:",response);
        // console.log("campaigndata is:",response[0].conversationId.campaign_id.job_description)
        if(!response)
            return null;
        // console.log("userData is:",response);
        const job_description=response[0].conversationId.campaign_id.job_description
        const extractedMessages = response[0].messages.map(({ role, content }) => ({ role, content }));
        // console.log("extracted messages",extractedMessages);
        return {
            campaign_id:response[0].conversationId.campaign_id._id,
            job_description:job_description,
            interview_conversation:extractedMessages
        };
    
    } catch (error) {
        console.log("error occured:",error.message);
        return null;
    }
}


export const updateCandidateFeedback=async(candidate_id,campaign_id,parameters)=>{

     try {
        const updatedFeedback=await Feedback.findOneAndUpdate(
            {candidate_id, campaign_id, }, 
            { parameters },
            {
              new: true,
              upsert: true, 
              setDefaultsOnInsert: true, 
            });
        if(!updatedFeedback)
            return null;
        return updatedFeedback;
        
     } catch (error) {
        console.log("error occured:",error.message);
        return null;
     }
}

export const findCandidateByCandidateId=async(candidate_id)=>{
      try {
        const response=await Candidate.findById(candidate_id);
        if(!response)
            return null;
        return response;
        
      } catch (error) {
          console.log("error occured",error.message);
          return null;
      }
}