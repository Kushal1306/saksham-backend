import Campaign from "../models/Campaign.js";
import Candidate from "../models/Candidate.js";
import { convertDate } from "../config/dateHelper.js";
import sendMail from "../helpers/sendMail.js";
import mongoose from "mongoose";
import { getJDBasedOnRequirement, getQuestionForJD } from "../middlewares/OpenAICall.js";
import { createCampaignByUser } from "../helpers/interview.js";

export const getInterviewData = async (req, res) => {
    try {
        const candidate_id = req.params.candidateId;
        console.log("candidateId",candidate_id);
        if (!mongoose.isValidObjectId(candidate_id)) {
            console.log("hii");
            return res.json({
                success: false,
                message: 'Candidate doesnot exist'
            });
        }
        const interviewData = await Candidate.findById(candidate_id).populate('campaign_id');
        console.log(interviewData);

        if (!interviewData) {
            return res.status(404).json({
                success: false,
                message: 'Candidate/Interview does not exist'
            });
        }

        const currentDate = new Date(); 
        if (currentDate > interviewData.campaign_id.expiry_time) {
            return res.status(403).json({ 
                success: false,
                message: 'You cannot take the interview, as the deadline has passed'
            });
        }

        const text = `Hi, ${interviewData.name}. Thank you for applying for the position of ${interviewData.campaign_id.role_name} at QuizAI. Please press Full Screen to begin the interview.`;
        
        return res.status(200).json({
            success: true,
            message: text
        });

    } catch (error) {
        console.log("Error occurred:", error.message); // Fixed typo in 'error.message'
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


export const createCampaign=async(req,res)=>{
    try {
        console.log("hii");
        console.log(req.body);
        const {role_name,job_description,expiry_time}=req.body;
        console.log(role_name,job_description,expiry_time);
         const data=req.body;

         if(data.expiry_time)
            data.expiry_time = convertDate(data.expiry_time);
        // const jd_data=`${role_name} ${job_description}`;
        //  const newCampaign = await Campaign.create(data);

        const newQuestions=await  getQuestionForJD(data.job_description);
        if(!newQuestions)
            return res.status(401).json({
             message:"failed generating questions"
        });
        if(!data.questions)
            data.questions=newQuestions;

        const newCampaign=await createCampaignByUser(data);
         if(!newCampaign)
            return res.status(401).json({
        success:false,
        message:'failed creating campaign'
        });

         return res.status(201).json({
             success: true,
             message: 'Campaign created successfully',
             campaign: newCampaign
         });


    } catch (error) {
        console.log("Error occurred:", error.message); // Fixed typo in 'error.message'
        return res.status(500).json({
            success: false,
            message: error.message
        }); 
    }
}

export const AddCandidate=async(req,res)=>{
    try {
        const data=req.body;
        
        const newCandidate=await Candidate.create(data);
        if(!newCandidate)
            return res.status(201).json({
           success:false,
           message:'Failed creating candidates'
        });

        return res.status(201).json({
            success:true,
            message:'Candidate added successfully',
            newCandidate:newCandidate
        })
        
    } catch (error) {
        console.log("Error occurred:", error.message); // Fixed typo in 'error.message'
        return res.status(500).json({
            success: false,
            message: error.message
        }); 
    }
}

// inviting all not yet invited candidates of a certain interview
export const inviteToInterview=async(req,res)=>{
    try { // missing logic where campaign_id // also need to update candidate status to invited
        const campaign_id=req.params.interviewId;
        console.log(campaign_id);
        const candidates = await Candidate.find(
            {
                'status.invitation_status': 'Not Invited',
                'campaign_id':campaign_id
            },
            {
                _id: 1,
                name: 1,
                email: 1
            }
        );
        console.log(candidates);
        for (const candidate of candidates) {
            const recipient = candidate.email;
            const subject = `Interview Invitation for QuizAI`;
            const url=`${process.env.FRONTEND_URL}/interview/${candidate._id}`

            const text = `Dear ${candidate.name},\n\nYou are invited to interview for the campaign. Please click on the below link to begin the interview.\n link: ${url}\n\nBest regards,\nYour Company`;
            // Call the sendEmail function
            // await sendMail(recipient, subject, text);
            console.log(recipient,subject,text);
        }
        return res.status(201).json({
            message:"suceess inviting users"
        });
        
    } catch (error) {
        console.log("Error occurred:", error.message); 
        return res.status(500).json({
            success: false,
            message: error.message
        }); 
    }
}

export const generateJD=async(req,res)=>{
    try {
        const jd_data=req.body.jd_data;
        const job_description=await getJDBasedOnRequirement(jd_data);
        if(!job_description)
            return res.status(400).json({
            message:"failed geenrating JD"
            });
        return res.status(201).json({
            message:"suceess generating JD",
            job_description:job_description
        });

    } catch (error) {
        console.log("error occured",error.message);
    }
}