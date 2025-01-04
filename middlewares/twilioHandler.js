import twilio from 'twilio';

dotenv.config();

const VoiceResponse = twilio.twiml.VoiceResponse;
const googleRoutes = express.Router();

const accountSid = process.env.ACCOUNTSId;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const NGROK_URL = process.env.NGROK_URL;
const client = twilio(accountSid, authToken);
console.log('Twilio client initialized:', client ? 'Success' : 'Failed');


googleRoutes.post("/call", async (req, res) => {
    const { to } = req.body;
    const callId = uuidv4();
    console.log("Call route accessed");
    try {
        const call = await client.calls.create({
            url: `${NGROK_URL}/outbound-voice/${callId}`,
            to,
            from: process.env.TWILIO_PHONE_NUMBER
        });
        console.log('Call initiated:', call.sid);
        res.json({ message: 'Call initiated', callSid: call.sid, callId: callId });
    } catch (error) {
        console.error('Error initiating call:', error);
        res.status(500).json({ error: 'Failed to initiate call' });
    }
});

googleRoutes.post('/outbound-voice/:callId', (req, res) => {
    const callId = req.params.callId;
    console.log(`Outbound voice route accessed for call ${callId}`);
    const twiml = new VoiceResponse();

    twiml.start().stream({
        url: `wss://${NGROK_URL.replace('https://', '')}/stream/${callId}`
    });

    
    console.log('TwiML response generated');
    res.type('text/xml');
    res.send(twiml.toString());
});