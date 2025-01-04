import { SESClient } from "@aws-sdk/client-ses";
import dotenv from 'dotenv';

dotenv.config();
const region=process.env.AWS_REGION;
console.log(region);

const ses=new SESClient({
    region:region,
    credentials:{
        accessKeyId:process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey:process.env.AWS_SECRET_ACCESS_KEY
    }
});

export default ses;