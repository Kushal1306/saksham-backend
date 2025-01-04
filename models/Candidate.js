import mongoose from 'mongoose';

const candidateSchema = new mongoose.Schema({
    campaign_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Campaign', required: true, index: true }, // Reference to the Campaign model
    name: { type: String, required: true },
    email: { type: String, required: true },
    status: {
      invitation_status: { type: String, enum:['Not Invited','Invited'],default: 'Not Invited' },
      interview_status: { type: String, enum: ['yet to begin', 'ongoing', 'completed'], default: 'yet to begin' },
      feedback_status: { type: String, enum: ['generated', 'n/a'], default: 'n/a' }
    }
  });

  const Candidate = mongoose.model('Candidate', candidateSchema);

  export default Candidate;