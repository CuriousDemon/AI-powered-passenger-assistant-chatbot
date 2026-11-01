import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';

// Safely normalize the API endpoint URL
const RAW_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const API_URL = RAW_BASE_URL.endsWith('/api')
  ? `${RAW_BASE_URL}/chat/message`
  : `${RAW_BASE_URL.replace(/\/+$/, '')}/api/chat/message`;

export default function App() {
  // Generates a unique session ID on every page refresh to isolate MongoDB chat history
  const [sessionId] = useState(() => `session_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`);

  const [messages, setMessages] = useState([
    {
      sender: 'bot',
      text: 'Namaste! Welcome to NSCBI Airport (Kolkata) Assistant ✈️\n\nI can help you with:\n• Live flight status & gate numbers (e.g., "Status of 6E-205")\n• Driving time & traffic to the airport (e.g., "Travel time from Howrah")\n• Check-in, arrival, and gate closure calculations'
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom of conversation
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const sendMessage = async (textToSend) => {
    const userText = textToSend || input;
    if (!userText.trim() || loading) return;

    // 1. Append user message to local state
    const newChatHistory = [...messages, { sender: 'user', text: userText }];
    setMessages(newChatHistory);
    if (!textToSend) setInput('');
    setLoading(true);

    try {
      // 2. Send both message and unique sessionId to the backend
      const response = await axios.post(API_URL, {
        message: userText,
        sessionId: sessionId
      });

      // 3. Append bot response
      setMessages([...newChatHistory, { sender: 'bot', text: response.data.reply }]);
    } catch (error) {
      console.error('Chat error:', error);
      setMessages([
        ...newChatHistory,
        {
          sender: 'bot',
          text: '⚠️ Unable to connect to the airport server. Please ensure the backend is running and reachable.'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    sendMessage();
  };

  return (
    <div className="chat-container">
      {/* Airport Header */}
      <div className="chat-header">
        <div>
          <h2>NSCBI Airport Kolkata</h2>
          <p>Flight Status, Traffic & Terminal Schedule Assistant</p>
        </div>
      </div>

      {/* Message Stream */}
      <div className="chat-messages">
        {messages.map((m, idx) => (
          <div key={idx} className={`msg ${m.sender}`}>
            {m.text}
          </div>
        ))}
        {loading && <div className="msg bot">Checking live airport data & schedules...</div>}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Option Buttons */}
      <div className="quick-actions">
        <button className="quick-btn" onClick={() => sendMessage('What is the status of flight 6E-205?')}>
          Flight 6E-205 Status
        </button>
        <button className="quick-btn" onClick={() => sendMessage('How long will it take to reach the airport from Howrah Station?')}>
          Traffic from Howrah
        </button>
        <button className="quick-btn" onClick={() => sendMessage('My domestic flight is at 18:30. When should I arrive?')}>
          Domestic 18:30
        </button>
      </div>

      {/* Input Bar */}
      <form className="chat-input-form" onSubmit={handleSubmit}>
        <input
          type="text"
          className="chat-input"
          placeholder="Ask about flights, traffic, or timing..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <button type="submit" className="send-btn" disabled={loading}>
          Send
        </button>
      </form>
    </div>
  );
}