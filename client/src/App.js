import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import './App.css';

function App() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const eventSourceRef = useRef(null);
  const messagesEndRef = useRef(null);
  
  // 用于实现打字机效果
  const fullResponseRef = useRef('');
  const typingIntervalRef = useRef(null);
  const currentMessageIdRef = useRef(null);

  // 自动滚动到最新消息
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // 当消息更新时滚动到底部
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 清理 EventSource 连接和打字机效果
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

  // 打字机效果逻辑
  const startTypingEffect = (messageId) => {
    // 先清除可能存在的旧定时器
    if (typingIntervalRef.current) {
      clearInterval(typingIntervalRef.current);
    }

    // 重置已显示文本长度
    let displayedLength = 0;
    
    // 启动打字效果
    typingIntervalRef.current = setInterval(() => {
      // 如果已显示文本长度小于完整响应文本长度
      if (displayedLength < fullResponseRef.current.length) {
        displayedLength += 1;
        
        // 更新消息数组中的特定消息
        setMessages(prevMessages => {
          return prevMessages.map(msg => {
            if (msg.id === messageId) {
              return {
                ...msg,
                text: fullResponseRef.current.slice(0, displayedLength),
                streaming: true
              };
            }
            return msg;
          });
        });
      } else {
        // 全部文本已显示，清除定时器
        clearInterval(typingIntervalRef.current);
        
        // 更新消息状态为非流式
        setMessages(prevMessages => {
          return prevMessages.map(msg => {
            if (msg.id === messageId) {
              return {
                ...msg,
                streaming: false
              };
            }
            return msg;
          });
        });
        
        // 重置全文引用
        fullResponseRef.current = '';
        currentMessageIdRef.current = null;
      }
    }, 20);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    // 清理之前的连接和打字效果
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }
    if (typingIntervalRef.current) {
      clearInterval(typingIntervalRef.current);
    }

    // 添加用户消息到聊天
    const userMessage = { text: input, sender: 'user' };
    setMessages(prev => [...prev, userMessage]);
    
    // 创建一个空的 AI 响应消息，用于流式更新
    const aiMessageId = Date.now().toString();
    currentMessageIdRef.current = aiMessageId;
    
    // 重置完整响应文本
    fullResponseRef.current = '';
    
    // 添加新的 AI 消息
    setMessages(prev => [...prev, { 
      id: aiMessageId,
      text: '',  // 初始为空
      sender: 'ai',
      streaming: true
    }]);
    
    setInput('');
    setIsLoading(true);

    try {
      // 创建 SSE 连接
      const encodedMessage = encodeURIComponent(input);
      const apiUrl = `/api/chat-stream?message=${encodedMessage}`;
      
      eventSourceRef.current = new EventSource(apiUrl);
      
      // 监听消息事件
      eventSourceRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.token) {
            // 将 token 添加到完整响应文本
            fullResponseRef.current += data.token;
            // 启动打字效果
      startTypingEffect(aiMessageId);
      
          }
          
          if (data.done) {
            // 关闭 SSE 连接
            if (eventSourceRef.current) {
              eventSourceRef.current.close();
              eventSourceRef.current = null;
            }
            setIsLoading(false);
          }
          
          if (data.error) {
            console.error('Stream error:', data.error);
            
            // 直接显示错误，不使用打字效果
            setMessages(prevMessages => {
              return prevMessages.map(msg => {
                if (msg.id === aiMessageId) {
                  return { 
                    ...msg,
                    text: 'Sorry, there was an error: ' + data.error,
                    streaming: false,
                    error: true
                  };
                }
                return msg;
              });
            });
            
            // 清理
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
      
      
      // 监听错误
      eventSourceRef.current.onerror = (error) => {
        console.error('EventSource error:', error);
        
        // 显示错误消息
        setMessages(prevMessages => {
          return prevMessages.map(msg => {
            if (msg.id === aiMessageId) {
              return { 
                ...msg,
                text: 'Connection error. Please try again.',
                streaming: false,
                error: true
              };
            }
            return msg;
          });
        });
        
        // 清理
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
      
      // 显示错误消息
      setMessages(prevMessages => {
        return prevMessages.map(msg => {
          if (msg.id === aiMessageId) {
            return { 
              ...msg,
              text: 'Sorry, there was an error creating the connection.',
              streaming: false,
              error: true
            };
          }
          return msg;
        });
      });
      
      // 清理
      fullResponseRef.current = '';
      if (typingIntervalRef.current) {
        clearInterval(typingIntervalRef.current);
        typingIntervalRef.current = null;
      }
      setIsLoading(false);
    }
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1 data-text="智能小助手">智能小助手</h1>
      </header>
      <div className="chat-container">
        <div className="decoration-element"></div>
        <div className="messages">
          {messages.length === 0 && (
            <div className="welcome-message">
              <h2>欢迎使用智能小助手！</h2>
              <p>问我任何问题...</p>
            </div>
          )}
          {messages.map((message, index) => (
            <div 
              key={message.id || index} 
              className={`message ${message.sender} ${message.streaming ? 'streaming' : ''} ${message.error ? 'error' : ''}`}
            >
              {message.sender === 'user' ? (
                <div className="message-content">{message.text}</div>
              ) : (
                <div className="message-content">
                  <ReactMarkdown>{message.text}</ReactMarkdown>
                  {message.streaming && (
                    <span className="cursor"></span>
                  )}
                </div>
              )}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>
      
      {/* 将输入框移到聊天容器外部 */}
      <form className="input-form" onSubmit={handleSubmit}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="请输入您的问题..."
          disabled={isLoading}
        />
        <button type="submit" disabled={isLoading || !input.trim()}>
          发送
        </button>
      </form>
    </div>
  );
}

export default App; 