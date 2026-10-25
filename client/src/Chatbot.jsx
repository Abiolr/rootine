import { useState, useRef, useEffect } from "react";
import { chatWithCoach } from "./api";
import "./Chatbot.css";

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Hey! I'm your Rootine coach. Need help with a workout plan, form check, or recovery?" }
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) scrollToBottom();
  }, [messages, isOpen]);

  async function handleSend(e) {
    e.preventDefault();
    if (!input.trim() || isTyping) return;

    const userMsg = { role: "user", content: input.trim() };
    const newHistory = [...messages, userMsg];
    
    setMessages(newHistory);
    setInput("");
    setIsTyping(true);

    try {
      // The backend requires the first message to be from the 'user'.
      // Find the first user message and only send the conversation from that point onward.
      const firstUserIdx = newHistory.findIndex(m => m.role === "user");
      const apiMessages = newHistory.slice(firstUserIdx);
      
      const data = await chatWithCoach(apiMessages);
      
      setMessages(prev => [...prev, { role: "assistant", content: data.reply }]);
    } catch (err) {
      setMessages(prev => [...prev, { 
        role: "error", 
        content: err.message || "Coach is disconnected. Try again later." 
      }]);
    } finally {
      setIsTyping(false);
    }
  }

  return (
    <div className="chat-widget">
      {isOpen && (
        <div className="chat-window" aria-label="Coach Chat">
          <div className="chat-header">
            <h3>Coach</h3>
            <button type="button" className="chat-close" onClick={() => setIsOpen(false)} aria-label="Close chat">
              X
            </button>
          </div>
          
          <div className="chat-messages">
            {messages.map((msg, i) => (
              <div key={i} className={`chat-msg ${msg.role}`}>
                {msg.content}
              </div>
            ))}
            {isTyping && <div className="chat-typing">Typing...</div>}
            <div ref={messagesEndRef} />
          </div>

          <form className="chat-input-area" onSubmit={handleSend}>
            <input 
              type="text" 
              placeholder="Ask about your routine..." 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isTyping}
            />
            <button type="submit" disabled={!input.trim() || isTyping}>
              Send
            </button>
          </form>
        </div>
      )}

      <button 
        type="button"
        className="chat-toggle" 
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle Coach Chat"
      >
        {isOpen ? "X" : "Chat"}
      </button>
    </div>
  );
}
