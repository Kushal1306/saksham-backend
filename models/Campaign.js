import mongoose from "mongoose";

const campaignSchema = new mongoose.Schema({
    role_name: { type: String, required: true },
    job_description: { type: String, required: true },
    questions:{ type:String}, 
    parameters:{
      Object
    },
    expiry_time: { type: Date, required: true }
  });
  
const Campaign = mongoose.model('Campaign', campaignSchema);
export default Campaign;  