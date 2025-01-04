import OpenAI from 'openai';
import dotenv from 'dotenv';
import ConversationModel from '../models/ChatHistory.js';
import Candidate from '../models/Candidate.js';

dotenv.config();

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});



const getConversationHistory = async (conversationId) => {
    try {
        const Conversation = await ConversationModel.findOne({
            conversationId: conversationId
        });
        return Conversation ? Conversation.messages : [];

    } catch (error) {
        console.log(error);
    }
};

const updateConversationHistory = async (conversationId, newMessage) => {
    try {
        await ConversationModel.updateOne(
            { conversationId: conversationId },
            { $push: { messages: newMessage } },
            { upsert: true }
        );
    } catch (error) {
        console.log("error occured:", error.message);
    }

};
export const getJDData = async (candidate_id) => {
    try {
        const JDdata = await Candidate.findById(candidate_id)
            .populate('campaign_id')
            .exec();
        if (!JDdata)
            return null;
        return JDdata.campaign_id;
    } catch (error) {
        console.log("error occured:", error.message);
        return null;
    }
}

const activeJDS = new Map();
const campaignData = new Map();

export const llmCall = async (userReply, conversationId) => {
    try {
        let jd, questions, campaign_id;
        if (campaignData.has(conversationId)) {
            campaign_id = campaignData.get(conversationId);
            const data = activeJDS.get(campaign_id);
            jd = data.jd;
            questions = data.questions;

        }
        else {
            const JDdata = await getJDData(conversationId);
            console.log("jd data is", JDdata);
            activeJDS.set(JDdata._id, {
                jd: JDdata.job_description,
                questions: JDdata.questions
            });
            campaignData.set(conversationId, JDdata._id)
            jd = JDdata.job_description;
            questions = JDdata.questions;

        }

        const history = await getConversationHistory(conversationId);
        // const history = await getConversationHistory(callId) || [];
        // const messages=[
        //     {role:"system",content:"You are helpful assistant."},
        //     ...history,
        //     {role:"user",content:userReply}
        // ];
        // const messages = [
        //     { role: "system", content: "You are Saksham, prescreening assistant from Kushal Consultancies. I have already introduced you to the user. Do not act like a bot. Act naturally and ask one question at a time. Please start by asking: 'What’s your experience with React and Next.js?' Then continue with: 'How comfortable are you with Node.js or Nest.js backends?' followed by 'How proficient are you in Typescript?' Ask 'Have you built UIs from scratch? Can you share an example?' next, then 'Do you have experience with Figma, Tailwind CSS, or Zustand?' Finally, ask: 'What’s your experience with Postgres/SQL and Prisma?'" },
        //     ...history,
        //     { role: "user", content: userReply }
        //   ];
        // const messages = [
        //     { 
        //         role: "system", 
        //         content: `You are Saksham, a prescreening assistant.. Firstly Introduce Yourselves. Act naturally, asking one question at a time, and assess the candidate on technical, behavioral, communication skills, availability, and compensation expectations. Use the job description: ${jd} as a guide. You may ask up to 10 questions total, including:

        //         1. Start by asking the candidate to introduce themselves.
        //         2. Ask about their relevant experience with technologies in the job description.
        //         3. Evaluate their problem-solving skills by discussing past challenges and resolutions.
        //         4. Assess communication skills by asking them to explain a complex topic simply.
        //         5. Ask about their experience working in teams or handling interpersonal challenges.
        //         6. Discuss their availability for the role and if they have any upcoming commitments.
        //         7. Ask about their expectations for compensation and growth.
        //         8. Confirm technical details like their experience with specific tools or frameworks listed in the job description.
        //         9. Inquire about their comfort level with potential job responsibilities and deadlines.
        //         10. Finally, conclude the interview by thanking them and asking if they have any questions, then let them know they can end the call.
        //         Note: Donot mention on what you are assesing just directly assses candidate by asking topics,skills etc mentioned in the job description
        //         If Role is engineering then only ask problem solving related questions else ask 
        
        //         `
        //     },
        //     ...history,
        //     { role: "user", content: userReply }
        // ];
        // const messages = [
        //     {
        //         role: "system",
        //         content: `You are Saksham, a prescreening assistant. Introduce yourself first and act naturally while maintaining a slightly critical tone. Assess the candidate by asking questions based on the job description: ${jd}. Your goal is to evaluate the candidate’s technical, behavioral, communication skills, availability, and compensation expectations.
        
        //         Follow these guidelines:
        //         - Always base your questions on the job description (JD), whether it's an engineering or management role.
        //         - Ask one question at a time, focusing on relevant skills, experiences, and scenarios.
        //         - Do not explicitly tell the candidate what you are assessing; instead, evaluate subtly through their responses. means directly ask questions donot mention on what you are assessing.
        //         - Tailor your questions based on the role type:
        //           - For **engineering roles**, include problem-solving questions, ask about technical tools, and evaluate practical skills.
        //           - For **management roles**, focus on team leadership, conflict resolution, and strategic thinking.
        //         - Limit the total number of questions to 10. Ensure they cover:
        //           1. Candidate introduction and background.
        //           2. Relevant experience with technologies or responsibilities in the JD.
        //           3. Problem-solving or critical-thinking examples for engineering roles.
        //           4. Simplified explanations of complex topics to assess communication skills.
        //           5. Experience handling interpersonal challenges or team dynamics.
        //           6. Availability and any upcoming commitments.
        //           7. Compensation expectations and career growth goals.
        //           8. Technical or tool-specific expertise (if applicable).
        //           9. Comfort level with job responsibilities, deadlines, and expectations.
        //           10. Conclusion: Thank the candidate, ask if they have questions, and inform them of the next steps.
        //           Note: ask the candidate to end the call at end. Ask one question, about one skill at a time, donot intermix many skills
        
        //         Ensure you maintain professionalism without being overly friendly. Challenge the candidate appropriately, prompting them to provide detailed and insightful answers.`
        //     },
        //     ...history,
        //     { role: "user", content: userReply }
        // ];

        const messages=[
            {
                "role": "system",
                "content": `You are Saksham, a prescreening assistant tasked with interviewing candidate. Begin by introducing yourself  and asking the candidate to provide a brief background. Maintain a slightly critical tone while assessing their technical, behavioral, and communication skills.
            
                Your goal is to evaluate the candidate thoroughly by asking the following questions in a step-by-step manner:
             
                1. Ask the candidate to introduce themselves and provide their background.
                2. Ask the following questions one at a time: 
                3. Questions: ${questions}
                4. After all questions have been covered question them on their availability and compensation expectations as well.
                5. conclude by thanking the candidate, Request the candidate to end the call.
                6 - Please Donot Repeat Question unless requested.
            
                **Note:** 
                - Strictly ask one question at a time from the questions mentioned.
                - Ask only one question at a time, focusing on one skill or area per question.
                - Please Donot Repeat Question unless requested.
                - Ensure professionalism. Ask at most 2-3 followup questions in total.
                  conclude by thanking the candidate, Request the candidate to end the call.
`
            },
            ...history,
            {role:"user",content:userReply}
        ];

        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: messages
        });

        const assistantReply = response.choices[0].message.content;

        await updateConversationHistory(conversationId, { role: "user", content: userReply });

        await updateConversationHistory(conversationId, { role: "assistant", content: assistantReply });

        return assistantReply;


    } catch (error) {
        console.log(error);
    }
}

export const openAIFeedBack = async (job_description, interview_conversation) => {
    try {
        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                {
                    "role": "system",
                    "content": "You are an expert evaluator of interviews. Assess the candidate's performance strictly, focusing on the following categories: "
                },
                {
                    "role": "user",
                    "content": `
                        Evaluate the candidate’s skills strictly in the following categories:
                        - **Technical skills** in relation to the provided Job Description (JD).
                        - **Communication skills** (clarity, confidence, articulation).
                        - **Behavioral skills** (teamwork, adaptability, attitude).
                
                        Provide:
                        1. Ratings out of 10 for "technical", "communication", and "behavioral".
                        2. An overall rating out of 10, taking all three aspects into account.
                        3. Detailed feedback for each category, with a strong emphasis on areas of improvement.
                        4. An overall performance analysis, indicating strengths and weaknesses.
                
                        Inputs:
                        - **Job Description (JD)**: ${job_description}
                        - **Interview Conversation**: ${interview_conversation}
                    `
                }                
            ],
            functions: [
                {
                    name: "evaluate_candidate",
                    description: "Evaluate technical, communication, and behavioral skills, with ratings and overall feedback. Evauluate Strongly Be Critical of User",
                    parameters: {
                        type: "object",
                        properties: {
                            technical: {
                                type: "object",
                                description: "Technical skills evaluation and rating.",
                                properties: {
                                    rating: { type: "integer", description: "Technical rating out of 10." },
                                    feedback: { type: "string", description: "Feedback on technical skills." },
                                    strength: { type: "string", description: "Strength of the candidate, e.g., 'Teamwork and adaptability'." },
                                    improvement: { type: "string", description: "Area of improvement, e.g., 'More proactive problem-solving'." }
                                },
                                required: ["rating", "feedback", "strength", "improvement"]
                            },
                            communication: {
                                type: "object",
                                description: "Communication skills evaluation and rating.",
                                properties: {
                                    rating: { type: "integer", description: "Communication rating out of 10." },
                                    feedback: { type: "string", description: "Feedback on communication skills." },
                                    strength: { type: "string", description: "Strength of the candidate, e.g., 'Teamwork and adaptability'." },
                                    improvement: { type: "string", description: "Area of improvement, e.g., 'More proactive problem-solving'." }
                                },
                                required: ["rating", "feedback", "strength", "improvement"]
                            },
                            behavioral: {
                                type: "object",
                                description: "Behavioral skills evaluation and rating.",
                                properties: {
                                    rating: { type: "integer", description: "Behavioral rating out of 10." },
                                    feedback: { type: "string", description: "Feedback on behavioral skills." },
                                    strength: { type: "string", description: "Strength of the candidate, e.g., 'Teamwork and adaptability'." },
                                    improvement: { type: "string", description: "Area of improvement, e.g., 'More proactive problem-solving'." }
                                },
                                required: ["rating", "feedback", "strength", "improvement"]
                            },
                            overall: {
                                type: "object",
                                description: "Overall rating and feedback.",
                                properties: {
                                    rating: { type: "integer", description: "Overall rating out of 10." },
                                    feedback: { type: "string", description: "Overall feedback for the candidate." },
                                    strength: { type: "string", description: "Strength of the candidate, e.g., 'Teamwork and adaptability'." },
                                    improvement: { type: "string", description: "Area of improvement, e.g., 'More proactive problem-solving'." }
                                },
                                required: ["rating", "feedback", "strength", "improvement"]
                            }
                        },
                        required: ["technical", "communication", "behavioral", "overall"]
                    }
                }
            ],
            function_call: { name: "evaluate_candidate" },
        });
        // Parse the structured output
        const structuredOutput = response.choices[0].message.function_call.arguments;
        console.log(structuredOutput);
        const parsedOutput = JSON.parse(structuredOutput);
        console.log("users feedback is", parsedOutput);
        return parsedOutput;

    } catch (error) {
        console.log("error occured:", error.message);
        return null;

    }
}

export const getQuestionForJD = async (job_description) => {
    try {
        const response = await openai.chat.completions.create({
            model: 'gpt-4o-mini', messages: [
                { role: "system", content: "You are an Interview Question Generator" },
                {
                    role: "user",
                    content: `
                    Generate a set of interview questions for a candidate applying for a role described in the following job description. The questions should assess both technical and behavioral aspects of the candidate’s qualifications, skills, and experience.

                   Technical questions: Focus on the tools, technologies, and skills mentioned in the job description, ensuring the questions test the candidate’s expertise in the relevant areas.
                    Behavioral questions: Explore the candidate's approach to teamwork, problem-solving, communication, and their ability to handle challenges and collaborate effectively.
                     General skills: Include questions to assess the candidate's ability to learn new technologies, work under pressure, and contribute to the overall success of the team and organization.
                    Please format the questions as a list without explanations or headings
                    Note: Limit the no of quetsions by 10. (6 technical questions). Also Dont include multiple tools in one question.
        
                        Inputs:
                        - **Job Description (JD)**: ${job_description}
                    `,
                },
            ]
        });
        if(response.choices[0].message.content)
            return response.choices[0].message.content;
        return null;
    } catch (error) {
        console.log("error occured:", error.message);
        return null;
    }
};

export const getJDBasedOnRequirement=async(jd_data)=>{
    try {
        console.log("the jd_data is",jd_data);
        const response = await openai.chat.completions.create({
            model: 'gpt-4o-mini', messages: [
                { role: "system", content: "You are JOB Description Generator" },
                {
                    role: "user",
                    content: `Please generate a job description for the role & requirements mentioned below.
                              Role & Requrement:  ${jd_data}
                             Note: Keep them Short, Just Give Job Descriptions. Which can be used directly.
                    
                    `,
                },
            ]
        });
        if(response.choices[0].message.content)
            return response.choices[0].message.content;
        return null;
    } catch (error) {
       console.log("error occured",error.message);
       return null;   
    }
}