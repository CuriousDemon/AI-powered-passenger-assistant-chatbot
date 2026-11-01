
import mongoose from 'mongoose';

const MessageSchema = new mongoose.Schema({
  role: { type: String, enum: ['user', 'model'], required: true },
  text: { 
    type: String, 
    required: true,
    default: "No response text provided." 
  },
  timestamp: { type: Date, default: Date.now }
});

const ChatSessionSchema = new mongoose.Schema({
  sessionId: { type: String, required: true, unique: true },
  messages: [MessageSchema],
  updatedAt: { type: Date, default: Date.now, expires: 1800 } 
});


ChatSessionSchema.pre('save', function () {
  this.updatedAt = new Date();
});

export default mongoose.model('ChatSession', ChatSessionSchema);