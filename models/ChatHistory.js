import mongoose from 'mongoose';

const messageSchema=new mongoose.Schema({
    role:{
      type:String,
      required:true,
      enum:['user','assistant']
    },
    content:{
      type:String,
      required:true
    },
    timestamp: {
      type: Date,
      default: Date.now
    } 
});

const conversationSchema = new mongoose.Schema({
  conversationId: {
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Candidate', 
    required: true,
    unique: true
  },
  messages: [messageSchema],
  summary:String,
  status:{
    type:String,
    default:'active',
    enum:['active','completed']
  }
},{
  timestamps: true
});

const ConversationModel = mongoose.model('Conversation', conversationSchema);

export default ConversationModel;