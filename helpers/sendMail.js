import { ListIdentitiesCommand,SendEmailCommand } from "@aws-sdk/client-ses";
import ses from "../clients/sesClient.js";
import dotenv from 'dotenv';

dotenv.config();

const sendMail = async (recipient, subject, body) => {
    const default_sender=process.env.DEFAULT_MAIL;
    const params = {
        Source: default_sender,
        Destination: {
            ToAddresses: [recipient],
        },
        Message: {
            Subject: {
                Data: subject,
            },
            Body: {
                Text: {
                    Data: body,
                }
            },
        },
    };

    try {
        const data = await ses.send(new SendEmailCommand(params));
        return data.MessageId;
    } catch (error) {
        console.error('Error sending email:', error);
        return null;
    }
};

export default sendMail;