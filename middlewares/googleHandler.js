import { SpeechClient } from '@google-cloud/speech';
import { TextToSpeechClient } from '@google-cloud/text-to-speech';

export function initializeGoogleClients() {
  return {
    speechClient: new SpeechClient(),
    ttsClient: new TextToSpeechClient(),
  };
}

export function handleWebSocketConnection(ws, req, speechClient, ttsClient) {
  console.log('WebSocket connection established');
  let streamSid = null;

  const recognizeStream = speechClient.streamingRecognize({
    config: {
      encoding: 'MULAW',
      sampleRateHertz: 8000,
      languageCode: 'en-US',
    },
    interimResults: false,
  });

  recognizeStream.on('data', data => {
    if (data.results[0] && data.results[0].alternatives[0]) {
      const transcription = data.results[0].alternatives[0].transcript;
      console.log(`Transcription: ${transcription}`);
      handleTranscription(transcription, ttsClient, ws, streamSid);
    }
  });

  recognizeStream.on('error', error => {
    console.error('Error in speech recognition:', error);
  });

  ws.on('message', message => {
    const msg = JSON.parse(message);
    if (msg.event === 'start') {
      streamSid = msg.start.streamSid;
      console.log(`Stream started with SID: ${streamSid}`);
    } else if (msg.event === 'media') {
      const payload = Buffer.from(msg.media.payload, 'base64');
      recognizeStream.write(payload);
    } else if (msg.event === 'stop') {
      console.log(`Stream stopped: ${msg.streamSid}`);
    }
  });

  ws.on('close', () => {
    console.log('WebSocket connection closed');
    recognizeStream.destroy();
  });
}

async function handleTranscription(transcription, ttsClient, ws, streamSid) {
  const response = await generateAIResponse(transcription);
  const [ttsResponse] = await ttsClient.synthesizeSpeech({
    input: { text: response },
    voice: { languageCode: 'en-US', ssmlGender: 'NEUTRAL' },
    audioConfig: { audioEncoding: 'MULAW', sampleRateHertz: 8000 },
  });

  const audioBase64 = ttsResponse.audioContent.toString('base64');
  ws.send(JSON.stringify({
    event: 'media',
    streamSid: streamSid,
    media: { payload: audioBase64 }
  }));
}

async function generateAIResponse(transcription) {
  // Implement your AI logic here
  return `I heard: ${transcription}. How can I assist you further?`;
}