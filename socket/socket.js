import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import { createConversationChain, executor } from '../conversation/conversationMiddleWare.js'; 
import { parseResponse } from '../conversation/ParseResponses.js';
import cors from 'cors';

const setupSocket=(io)=>{
      io.use((socket, next) => {
        const token = socket.handshake.auth.token;
        if (token) {
          jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
            if (err) {
              return next(new Error('Authentication error'));
            }
            socket.userId = decoded.userId;
            next();
          });
        } else {
          next(new Error('Authentication error'));
        }
      });

      io.on('connection',(socket)=>{
        const userId=socket.userId;
        console.log(`User connected: ${socket.userId}`)
        let conversationChain=createConversationChain(userId);
        socket.on('sendMessage',async(message)=>{
            try {
            console.log(message);
             const chatHistory=await conversationChain.memory.chatHistory.getMessages();
             const response = await executor.invoke({ 
                input: message,
                chat_history: chatHistory
              });
              await conversationChain.memory.chatHistory.addUserMessage(message);
              await conversationChain.memory.chatHistory.addAIChatMessage(response.output);
              console.log(response);
              console.log(parseResponse(response.output));
              socket.emit('receiveMessage', parseResponse(response.output));
            //   io.to(socket.userId).emit('receiveMessage',response.output);
    
            } catch (error) {
               console.error('Error processing message:', error);
               socket.emit('error', 'An error occurred while processing your message'); 
            }
        });
        socket.on('disconnect', () => {
            console.log(`User disconnected: ${socket.userId}`);
          });
      });
      return io;

}

export default setupSocket;
