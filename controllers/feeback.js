import mongoose from "mongoose";
import ConversationModel from "../models/ChatHistory.js";
import { getCandidateConversation,checkFeedback, updateCandidateFeedback } from "../helpers/feedback.js";
import { openAIFeedBack } from "../middlewares/OpenAICall.js";
import { notifyFeedback } from "../helpers/twilio.js";

export const getInterviewFeedback=async(req,res)=>{
              const conversationId=req.params.conversationId;
             try {
                if(!conversationId||!mongoose.isValidObjectId(conversationId)){ 
                return res.status(400).json({
                    message:"Failed Getting converstaion, Interview Doesnot exist"
                  });
                }
                
                 let feedBack=null;
                 feedBack=await checkFeedback(conversationId);
                 if(feedBack){
                    return res.status(200).json({
                        message:'Feedback retreved successfully',
                        feedBack:feedBack
                    })
                 };

                 const {campaign_id,job_description,interview_conversation}=await getCandidateConversation(conversationId);
                 if(!(interview_conversation && job_description))
                    return res.staus(400).json({
                  message:"Failed Getting converstaion"
                });
                feedBack=await openAIFeedBack(job_description,interview_conversation);
                if(!feedBack)
                    return res.status.json({
                     message:'failed getting Feedback'
                });
                // const notifyFeedbacktoKushal=await notifyFeedback(conversationId,feedBack);
                // const candidate_feedback=await updateCandidateFeedback(conversationId,campaign_id,feedBack);
                const [notifyFeedbacktoKushal,candidate_feedback]=await Promise.all([
                  notifyFeedback(conversationId,feedBack),
                  updateCandidateFeedback(conversationId,campaign_id,feedBack)
                ])
                if(!candidate_feedback)
                        return res.status.json({
                         message:'failed getting Feedback'
                });
                return res.status(201).json({
                    message:'feedback retreived successfully',
                    feedBack:candidate_feedback.parameters
                })

             } catch (error) {
                console.log("error occured:",error.message);
                return res.status(500).json({
                    message:'Internal Server Error'
                });
             }
};