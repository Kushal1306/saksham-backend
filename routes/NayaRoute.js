// server.js

import express from 'express';
import { SpeechClient } from '@google-cloud/speech';
import { TextToSpeechClient } from '@google-cloud/text-to-speech'; // Import Text-to-Speech client
import { llmCall } from '../middlewares/OpenAICall.js';


const speechClient = new SpeechClient();
const textToSpeechClient = new TextToSpeechClient();
const activeCalls = new Map();
const maxStreamDuration = 280 * 1000;
export const handleWebSocketConnection = (ws, req) => {
    console.log('WebSocket connection established');
    console.log(req.url);
    // const interviewId = req.url.split('/').pop(); // Extract the interview ID from the URL
    const interviewId = req.url.split('/').filter(Boolean).pop();
    console.log("the interviewid is:",interviewId);

    if (!activeCalls.has(interviewId)) {
        activeCalls.set(interviewId, {
            lastSpeechTime: Date.now(),
            currentTranscription: '',
            processingResponse: false,
            recognizeStream: null,
            ws: ws,
            streamResetTime:null,
        });
    } else {
        activeCalls.get(interviewId).ws = ws;
    }

    let callData = activeCalls.get(interviewId);
    const pingInterval = setInterval(() => {
        if (ws.readyState === ws.OPEN) {
            ws.ping();
            console.log(`Sent ping to interview ${interviewId}`);
        }
    }, 30000);

    ws.on('pong', () => {
        console.log(`Received pong from interview ${interviewId}`);
    });


    // Initialize speech recognition stream if not already done
    if (!callData.recognizeStream || ((Date.now() - callData.streamResetTime) > 280000)) {
        // if(callData.recognizeStream && (Date.now() - callData.streamResetTime) > 280000){
           
        //         console.log(`Stream exceeded time limit, closing stream for interview ${interviewId}`);
                
        //         // Remove all listeners before ending the stream
        //     callData.recognizeStream.removeListener('data', callData.recognizeStream.listeners('data')[0]);
        //     callData.recognizeStream.removeListener('error', callData.recognizeStream.listeners('error')[0]);
            
        //     // End the stream
        //     callData.recognizeStream.end();
        //     callData.recognizeStream = null;
            
        //     console.log(`Successfully cleaned up stream for interview ${interviewId}`);
        // }
        if (callData.recognizeStream) {
            console.log(`Stream cleanup initiated for interview ${interviewId}`);
            
            // Remove all data listeners
            const dataListeners = callData.recognizeStream.listeners('data');
            dataListeners.forEach(listener => {
                callData.recognizeStream.removeListener('data', listener);
            });

            // Remove all error listeners
            const errorListeners = callData.recognizeStream.listeners('error');
            errorListeners.forEach(listener => {
                callData.recognizeStream.removeListener('error', listener);
            });

            // End and destroy the stream
            callData.recognizeStream.end();
            callData.recognizeStream.destroy();
            callData.recognizeStream = null;
            
            console.log(`Stream cleanup completed for interview ${interviewId}`);
        }
        callData.streamResetTime = Date.now();
        callData.recognizeStream = speechClient.streamingRecognize({
            config: {
                encoding: 'LINEAR16',
                sampleRateHertz: 44100,
                languageCode: 'en-US',
                speechContexts: [{ phrases: ["AI assistant", "help", "goodbye", "thank you"] }],
                useEnhanced: true,
                singleUtterance: false,
                silenceThreshold: 3000,
            },
            interimResults: false,
            
        })
        .on('error', (error) => {
            console.error(`Speech recognition error for interview ${interviewId}:`, error);
            if (error.code === 11) {
                console.log(`Stream timeout detected for interview ${interviewId}, triggering reset`);
                callData.streamResetTime = 0; 
            }
        })
        .on('data', async (data) => {
            if (data.results[0] && data.results[0].isFinal) {
                const transcription = data.results[0].alternatives[0].transcript.trim();
                console.log(`Final transcription for interview ${interviewId}: ${transcription}`);

                if (transcription) {
                    callData.lastSpeechTime = Date.now();
                    callData.currentTranscription += transcription; // Accumulate transcription
                    console.log("Processing transcription:", callData.currentTranscription);

                    callData.processingResponse = true;
                    try {
                        await processAndRespond(callData.ws, callData.currentTranscription, interviewId);
                    } catch (error) {
                        console.error(`Error in processAndRespond for interview ${interviewId}:`, error);
                    }
                    callData.currentTranscription = ''; // Clear after processing
                    callData.processingResponse = false;
                }
            }
        });
        callData.streamResetTime = Date.now();
    }
    ws.on('message', async (message) => {
        try {
            const msg = JSON.parse(message);
            if(msg.event==='start'){
                await processAndRespond(callData.ws,"start",interviewId);
            }
            if (msg.event === 'media') {
                const payload = Buffer.from(msg.media.payload, 'base64');
                // console.log(`Received audio chunk of length: ${payload.length}`);  // Debug log
                if((Date.now() - callData.streamResetTime) > 280000){
                    callData.streamResetTime = Date.now();
                    callData.recognizeStream = speechClient.streamingRecognize({
                   config: {
                encoding: 'LINEAR16',
                sampleRateHertz: 44100,
                languageCode: 'en-US',
                speechContexts: [{ phrases: ["AI assistant", "help", "goodbye", "thank you"] }],
                useEnhanced: true,
                singleUtterance: false,
                silenceThreshold: 2000,
            },
            interimResults: false,
            
        });
                }

                callData.recognizeStream.write(payload);  // Send to recognition stream
            }
        } catch (error) {
            console.error(`Error processing WebSocket message for interview ${interviewId}:`, error);
        }
    });

    // WebSocket message handling
    // ws.on('message', async (message) => {
    //     try {
    //         const msg = JSON.parse(message);
    //         if (msg.event === 'media') {
    //             const payload = Buffer.from(msg.media.payload, 'base64');
    //             callData.recognizeStream.write(payload); // Send the received payload to recognition stream
    //         }
    //     } catch (error) {
    //         console.error(`Error processing WebSocket message for interview ${interviewId}:`, error);
    //     }
    // });

    ws.on('close', () => {
        console.log(`WebSocket closed for interview ${interviewId}`);
        clearInterval(pingInterval);
        cleanupCall(interviewId);
    });

    ws.on('error', (error) => {
        console.error(`WebSocket error for interview ${interviewId}:`, error);
    });
};

const cleanupCall = (interviewId) => {
    const callData = activeCalls.get(interviewId);
    if (callData) {
        if (callData.recognizeStream) {
            callData.recognizeStream.destroy(); // Clean up the recognition stream
        }
        activeCalls.delete(interviewId); // Remove the call from activeCalls
    }
};

const processAndRespond = async (ws, transcription, interviewId) => {
    console.log(`Processing for interview ${interviewId}: ${transcription}`);
    const audioBase64 = await generateAIResponse(transcription, interviewId);

    if (ws.readyState === ws.OPEN) {
        ws.send(JSON.stringify({
            event: 'media',
            media: {
                payload: audioBase64
            }
        }));
    } else {
        console.error(`WebSocket is not open for interview ${interviewId}. Cannot send audio chunk.`);
    }
};

const generateAIResponse = async (transcription, interviewId) => {
    console.log(`Generating AI response for interview ${interviewId}:`, transcription);
    const llmresponse=await llmCall(transcription,interviewId);
    console.log(llmresponse);

    // Set up the TTS request
    const request = {
        // input: { text: `You said: "${transcription}". How can I assist you further?` },
        // Choose the voice and language settings
        input:{text:llmresponse},
        voice: { languageCode: 'en-US', name: 'en-US-Wavenet-D' }, // Change to desired voice
        audioConfig: { audioEncoding: 'MP3' }, // Set the desired audio format
    };

    // Perform TTS request
    const [response] = await textToSpeechClient.synthesizeSpeech(request);
    const audioBase64 = response.audioContent.toString('base64'); // Convert to base64

    return audioBase64;
};
