import mongoose from 'mongoose';
const feedbackSchema = new mongoose.Schema({
    candidate_id: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Candidate', 
      required: true, 
      index: true 
    },
    campaign_id: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Campaign', 
      required: true, 
      index: true
    },
    interview_summary: { type: String },
    strengths: [{ type: String }],  
    weaknesses: [{ type: String }],  
    parameters: {                    
      type: Object,                 
      required: true          
    }
  });
  
  const Feedback = mongoose.model('Feedback', feedbackSchema);

  export default Feedback;