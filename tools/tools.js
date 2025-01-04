import { DynamicTool,DynamicStructuredTool } from '@langchain/core/tools';

const checkCalenderEvents=new DynamicStructuredTool({
     name:'checkCalenderEvents',
     description:'check upcoming events in the users\'s calender asked by the customer for today tommorrow or today',
     schema:z.object({
        time:z.string().description("The time mentioned")

     }),
     func:async(time)=>{

     }
});

const scheduleEvent=new DynamicStructuredTool({
    name:'scheduleEvent',
    description:'this tool is to schedule a events at time slot specified by the customer',
    schema:z.object({
        startTime:z.string().describe('Its the start time specified by the user from life of availbe times given.'),
        endTime:z.string().describe('Its the end time of the slot')
    }),
    func:async(startTime,endTime)=>{

    }
})

const updateEvent=new DynamicStructuredTool({
    name:'updatEvent',
    description:'this tool is to update the event like reschedule the bookings of the customer. first it check time at which the meeting was scheduled in the conversation and then based on taht toime it retruves the events',
    schema:z.object({
        time:z.string().describe('Begining time at which the booking/event was scheduled')
    }),
    func:async(time)=>{ 
        // retrive only one appointement/booking and cancel that

    }
})