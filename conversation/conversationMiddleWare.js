import { ChatOpenAI } from '@langchain/openai';
import { ConversationChain } from 'langchain/chains';
import { MongoDBChatMessageHistory } from '@langchain/mongodb';
import { BufferMemory } from 'langchain/memory';
import { DynamicTool,DynamicStructuredTool } from '@langchain/core/tools';
import { ChatPromptTemplate, MessagesPlaceholder, HumanMessagePromptTemplate, SystemMessagePromptTemplate } from '@langchain/core/prompts';
import { convertToOpenAIFunction } from "@langchain/core/utils/function_calling";
import { RunnableSequence } from "@langchain/core/runnables";
import { AgentExecutor } from "langchain/agents";
import { formatToOpenAIFunctionMessages } from "langchain/agents/format_scratchpad";
import { OpenAIFunctionsAgentOutputParser } from "langchain/agents/openai/output_parser";
import ConversationModel from '../models/ChatHistory.js';
import Complaints from '../models/Complaints.js';
import {OpenAIEmbeddings} from '@langchain/openai';
import {MemoryVectorStore} from 'langchain/vectorstores/memory';
import { Document } from 'langchain/document';
import zod from 'zod';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;




// Tools
// const tools = [
//     new DynamicTool({
//         name: 'get Schema',
//         description: "Use this to get a video recommendation based on the user's query about Rentok features or usage. Returns null if no relevant video is found.",
//         func: async (input) => {
//           const recommendation = await getVideoRecommendation(input);
//           return JSON.stringify(recommendation);
//         },
//     }),
//     new DynamicTool({
//         name: 'GreetingAndThanking',
//         description: "Use this function ONLY for greetings, farewells, or thanks. Input: either greet the user or thank them based on input",
//         func: async (input) => {
//           return `Answer them based on ${input}`;
//         }
//     }),

// ];



// const tools=[
//  new DynamicStructuredTool({
//     name:'checkCalenderEvents',
//     description:'check upcoming events in the users\'s calender asked by the customer for today tommorrow or today',
//     schema:zod.object({
//        time:zod.string().describe("The time mentioned by the customer")

//     }),
//     func:async(time)=>{
//        return  `yes he is available at ${time}`
//     }
// }),

// new DynamicStructuredTool({
//    name:'scheduleEvent',
//    description:'this tool is to schedule a events at time slot specified by the customer',
//    schema:zod.object({
//        startTime:zod.string().describe('Its the start time specified by the user from life of availbe times given.'),
//        endTime:zod.string().describe('Its the end time of the slot')
//    }),
//    func:async(startTime,endTime)=>{
//      return  `appointment scheduled succefully`
//    }
// })
// ,
// new DynamicStructuredTool({
//    name:'updatEvent',
//    description:'this tool is to update the event like reschedule the bookings of the customer. first it check time at which the meeting was scheduled in the conversation and then based on taht toime it retruves the events',
//    schema:zod.object({
//        time:zod.string().describe('Begining time at which the booking/event was scheduled')
//    }),
//    func:async(time)=>{ 
//        // retrive only one appointement/booking and cancel that

//    }
// }),
// new DynamicStructuredTool({
//   name:'GeneratePaymentLink',
//   description:'this tool generate payment link to before booking appointment',
//   schema:zod.object({
//       name:zod.string().describe('Name of the person'),
//       number:zod.string().describe('NUmber of the person')
//   }),
//   func:async(name,number)=>{ 
//       // retrive only one appointement/booking and cancel that
//       const link="https://www.quizai.tech";
//       return [`Hello ${name}. Please do payment using ${link}`]

//   }
// })
// ];
const tools = [
  new DynamicStructuredTool({
    name: 'checkCalenderEvents',
    description: 'Check upcoming events in the user\'s calendar for today, tomorrow, or any specified day.',
    schema: zod.object({
      time: zod.string().describe("The time mentioned by the customer")
    }),
    func: async ({ time }) => {
      console.log("the time is:",time);
      return `Yes, he is available at ${time}`;
    }
  }),
  new DynamicStructuredTool({
    name: 'scheduleEvent',
    description: 'This tool is to schedule an event at the time slot specified by the customer.',
    schema: zod.object({
      startTime: zod.string().describe('The start time specified by the user from the list of available times given.'),
      endTime: zod.string().describe('The end time of the slot.')
    }),
    func: async ({ startTime, endTime }) => {
      console.log(startTime,endTime);
      return 'Appointment scheduled successfully';
    }
  }),
  new DynamicStructuredTool({
    name: 'updateEvent',
    description: 'This tool updates an event like rescheduling the bookings of the customer.',
    schema: zod.object({
      time: zod.string().describe('Beginning time at which the booking/event was scheduled.')
    }),
    func: async ({ time }) => {
      // Retrieve and update the booking/event here
      return 'Event updated successfully';
    }
  }),
  new DynamicStructuredTool({
    name: 'GeneratePaymentLink',
    description: 'This tool generates a payment link before booking an appointment.',
    schema: zod.object({
      customer_Name: zod.string().describe('Name of the customer mentioned in the conversation'),
      customer_Number: zod.string().describe('Number of the person mentioned in the conversation')
    }),
    func: async ({ customer_Name, customer_Number}) => {
      const link = "https://www.quizai.tech";
      return `Hello ${customer_Name}. Please make a payment using ${link}`
    }
  })
];

// const tools = [
//   new DynamicTool({
//       name: 'getSchema',
//       description: "Use this to get a video recommendation based on the user's query about Rentok features or usage. Returns null if no relevant video is found.",
//       func: async (input) => {
//         const recommendation = await getVideoRecommendation(input);
//         return JSON.stringify(recommendation);
//       },
//   }),
//   new DynamicTool({
//       name: 'greetingAndThanking',
//       description: "Use this function ONLY for greetings, farewells, or thanks. Input: either greet the user or thank them based on input",
//       func: async (input) => {
//         return `Answer them based on ${input}`;
//       }
//   }),
// ];


// Model
const model = new ChatOpenAI({
  openAIApiKey: OPENAI_API_KEY,
  model:'gpt-3.5-turbo',
  temperature: 0.2
});

//Promopt Template
const prompt = ChatPromptTemplate.fromMessages([
  SystemMessagePromptTemplate.fromTemplate(
        `Role: Saksham - Dr. Kushal Jain's Appointment Assistant
You are Saksham, the personal assistant responsible for managing Dr. Kushal Jain's appointments. Your primary functions are to schedule, manage, and reschedule appointments as needed.
Dr. Kushal Jain's Availability
Weekdays only
Morning: 10:00 AM to 1:00 PM
Afternoon: 2:30 PM to 6:30 PM
Appointment Details
Each appointment is 15 minutes long
Slots start on the hour and quarter-hour (e.g., 10:00, 10:15, 10:30, 10:45)
Your Responsibilities
Check Dr. Jain's availability using the provided tools
Collect customer information before booking
Generate payment links for appointments
Book appointments at specified times
Reschedule appointments when requested
Important Notes
Always use the provided tools to check the doctor's availability; never assume a time slot is free
Before confirming any appointment, collect the customer's name and phone number
Generate a payment link before finalizing the booking
Only confirm the booking after the payment link has been generated

Available Tools
checkCalendarEvents
Description: Check upcoming events in Dr. Jain's calendar for today, tomorrow, or any specified day
scheduleEvent
Description: Schedule an event at the time slot specified by the customer
updateEvent
Description: Update or reschedule existing appointments
generatePaymentLink
Description: Generate a payment link for the appointment
Interaction Guidelines

Greet the customer politely and introduce yourself as Dr. Jain's appointment assistant
Ask for the customer's preferred date and time for the appointment
Use the checkCalendarEvents tool to verify availability
If the requested slot is available, ask for the customer's name and phone number
Use the generatePaymentLink tool to create a payment link
Provide the payment link to the customer
After confirming that the payment link has been generated, use the scheduleEvent tool to book the appointment
Confirm the appointment details with the customer
If rescheduling is requested, use the updateEvent tool after confirming the new time slot's availability and generating a new payment link if necessary

Always maintain a professional and helpful demeanor throughout the interaction. Remember, the booking is only confirmed after the payment link has been generated and provided to the customer.
*/
         
        `
      ),
      new MessagesPlaceholder("chat_history"),
      HumanMessagePromptTemplate.fromTemplate("{input}"),
      new MessagesPlaceholder("agent_scratchpad"),
]);

// Model with functions
const modelWithFunctions = model.bind({
  functions: tools.map((tool) => convertToOpenAIFunction(tool)),
});

// Runnable agent
const runnableAgent = RunnableSequence.from([
  {
    input: (i) => i.input,
    chat_history: (i) => i.chat_history,
    agent_scratchpad: (i) => formatToOpenAIFunctionMessages(i.steps),
  },
  prompt,
  modelWithFunctions,
  new OpenAIFunctionsAgentOutputParser(),
]);

// Agent executor
export const executor = AgentExecutor.fromAgentAndTools({
  agent: runnableAgent,
  tools,
  verbose: true,
});

// Function to create a conversation chain for a user
export const createConversationChain = (userId) => {
  const messageHistory = new MongoDBChatMessageHistory({
    collection: ConversationModel,
    sessionId: userId,
  });

  const memory = new BufferMemory({
    chatHistory: messageHistory,
    returnMessages: true,
    memoryKey: 'chat_history',
    inputKey: 'input',
    outputKey: 'output',
    memorySize: 3,
  });

  return new ConversationChain({
    llm: model,
    memory: memory,
    prompt: prompt,
  });
};


/*

   Note: You should use the below tools which you have access to fullfill the customers need
          Tools include:
          i) name:checkCalenderEvents
          description:check upcoming events in the users\'s calender asked by the customer for today tommorrow or any specifed day.
          ii)name:scheduleEvent
            description:this tool is to schedule a events at time slot specified by the customer
          iii) name:updatEvent
          description:this tool is to update the event like reschedule the bookings of the customer. first it check time at which the meeting was scheduled in the conversation and then based on that toime it retruves the events
*/