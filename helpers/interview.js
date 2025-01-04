import Campaign from "../models/Campaign.js";

export const createCampaignByUser=async(jd_data)=>{
    try {
        const newCampaign=await Campaign.create(jd_data);
        if(!newCampaign)
            return null;
        return newCampaign;
    } catch (error) {
        console.log("error occured",error.message);
        return null;
    }
}
