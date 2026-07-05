import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { getApiUrl } from './config';
import RobotAvatar from './components/RobotAvatar';
import WelcomePanel from './components/WelcomePanel';
import './App.css';

function App() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const eventSourceRef = useRef(null);
  const messagesEndRef = useRef(null);

  const fullResponseRef = useRef('');
  const typingIntervalRef = useRef(null);
  const currentMessageIdRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
      if (typingIntervalRef.current) {
        clearInterval(typingIntervalRef.current);
      }
    };
  }, []);

  const startTypingEffect = (messageId) => {
    if (typingIntervalRef.current) {
      clearInterval(typingIntervalRef.current);
    }

    let displayedLength = 0;

    typingIntervalRef.current = setInterval(() => {
      if (displayedLength < fullResponseRef.current.length) {
        displayedLength += 1;

        setMessages(prevMessages =>
          prevMessages.map(msg =>
            msg.id === messageId
              ? {
                  ...msg,
                  text: fullResponseRef.current.slice(0, displayedLength),
                  streaming: true,
                }
              : msg
          )
        );
      } else {
        clearInterval(typingIntervalRef.current);

        setMessages(prevMessages =>
          prevMessages.map(msg =>
            msg.id === messageId ? { ...msg, streaming: false } : msg
          )
        );

        fullResponseRef.current = '';
        currentMessageIdRef.current = null;
      }
    }, 20);
  };

  const sendMessage = async (messageText) => {
    const text = messageText.trim();
    if (!text || isLoading) return;

    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }
    if (typingIntervalRef.current) {
      clearInterval(typingIntervalRef.current);
    }

    setMessages(prev => [...prev, { text, sender: 'user' }]);

    const aiMessageId = Date.now().toString();
    currentMessageIdRef.current = aiMessageId;
    fullResponseRef.current = '';

    setMessages(prev => [
      ...prev,
      {
        id: aiMessageId,
        text: '',
        sender: 'ai',
        streaming: true,
      },
    ]);

    setInput('');
    setIsLoading(true);

    try {
      const encodedMessage = encodeURIComponent(text);
      const apiUrl = getApiUrl(`/api/chat-stream?message=${encodedMessage}`);

      eventSourceRef.current = new EventSource(apiUrl);

      eventSourceRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.token) {
            fullResponseRef.current += data.token;
            startTypingEffect(aiMessageId);
          }

          if (data.done) {
            if (eventSourceRef.current) {
              eventSourceRef.current.close();
              eventSourceRef.current = null;
            }
            setIsLoading(false);
          }

          if (data.error) {
            console.error('Stream error:', data.error);

            setMessages(prevMessages =>
              prevMessages.map(msg =>
                msg.id === aiMessageId
                  ? {
                      ...msg,
                      text: 'Sorry, there was an error: ' + data.error,
                      streaming: false,
                      error: true,
                    }
                  : msg
              )
            );

            fullResponseRef.current = '';
            if (eventSourceRef.current) {
              eventSourceRef.current.close();
              eventSourceRef.current = null;
            }
            if (typingIntervalRef.current) {
              clearInterval(typingIntervalRef.current);
              typingIntervalRef.current = null;
            }
            setIsLoading(false);
          }
        } catch (err) {
          console.error('Error parsing SSE data:', err, event.data);
        }
      };

      eventSourceRef.current.onerror = (error) => {
        console.error('EventSource error:', error);

        setMessages(prevMessages =>
          prevMessages.map(msg =>
            msg.id === aiMessageId
              ? {
                  ...msg,
                  text: 'Connection error. Please try again.',
                  streaming: false,
                  error: true,
                }
              : msg
          )
        );

        fullResponseRef.current = '';
        if (eventSourceRef.current) {
          eventSourceRef.current.close();
          eventSourceRef.current = null;
        }
        if (typingIntervalRef.current) {
          clearInterval(typingIntervalRef.current);
          typingIntervalRef.current = null;
        }
        setIsLoading(false);
      };
    } catch (error) {
      console.error('Error creating EventSource:', error);

      setMessages(prevMessages =>
        prevMessages.map(msg =>
          msg.id === aiMessageId
            ? {
                ...msg,
                text: 'Sorry, there was an error creating the connection.',
                streaming: false,
                error: true,
              }
            : msg
        )
      );

      fullResponseRef.current = '';
      if (typingIntervalRef.current) {
        clearInterval(typingIntervalRef.current);
        typingIntervalRef.current = null;
      }
      setIsLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    sendMessage(input);
  };

  return (
    <div className="app">
      <header className="app-header">
        <div className="app-header__brand">
          <RobotAvatar size="small" />
          <h1>智能小助手</h1>
        </div>
      </header>

      <div className="chat-container">
        <div className="messages">
          {messages.length === 0 && (
            <WelcomePanel
              onQuickQuestion={sendMessage}
              disabled={isLoading}
            />
          )}

          {messages.map((message, index) => (
            <div
              key={message.id || index}
              className={`message-row ${message.sender} message-enter`}
            >
              {message.sender === 'ai' && (
                <RobotAvatar size="small" pulsing={message.streaming} />
              )}

              <div
                className={`message ${message.sender} ${
                  message.streaming ? 'streaming' : ''
                } ${message.error ? 'error' : ''}`}
              >
                {message.sender === 'user' ? (
                  <div className="message-content">{message.text}</div>
                ) : (
                  <div className="message-content">
                    {message.text ? (
                      <ReactMarkdown>{message.text}</ReactMarkdown>
                    ) : message.streaming ? (
                      <span className="typing-indicator">
                        <span></span>
                        <span></span>
                        <span></span>
                      </span>
                    ) : null}
                    {message.text && message.streaming && (
                      <span className="cursor"></span>
                    )}
                  </div>
                )}
              </div>

              {message.sender === 'user' && (
                <div className="user-avatar" aria-hidden="true">
                  我
                </div>
              )}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        <form className="input-form" onSubmit={handleSubmit}>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={isLoading ? '助手正在回复…' : '请输入您的问题...'}
            disabled={isLoading}
          />
          <button
            type="submit"
            className={input.trim() ? 'btn-active' : ''}
            disabled={isLoading || !input.trim()}
          >
            {isLoading ? '思考中…' : '发送'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default App;
