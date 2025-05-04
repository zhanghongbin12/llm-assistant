const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const { ChatOpenAI } = require('@langchain/openai');
const { PromptTemplate } = require('@langchain/core/prompts');
const { LLMChain } = require('langchain/chains');
const { StringOutputParser } = require('@langchain/core/output_parsers');

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize the LLM
const llm = new ChatOpenAI({
  openAIApiKey: process.env.OPENAI_API_KEY,
  configuration: {
    baseURL: "https://openrouter.ai/api/v1",
    defaultHeaders: {
      "HTTP-Referer": "http://localhost:5000", // 来源
      "X-Title": "LLM Chat Demo" // 应用标题
    }
  },
  temperature: 0.7,
  model: "deepseek/deepseek-r1:free", // 使用 OpenRouter 上可用的模型
  streaming: true, // 启用流式输出
  maxTokens: 1000, // 最大令牌数
});

// Create a prompt template
const template = `You are a helpful AI assistant. Try to answer the user's question to the best of your ability.
Question: {question}
Answer:`;

const promptTemplate = PromptTemplate.fromTemplate(template);
const outputParser = new StringOutputParser();

// SSE route for streaming chat
app.get('/api/chat-stream', async (req, res) => {
  try {
    const message = req.query.message;
    
    if (!message) {
      return res.status(400).json({ error: 'Message is required as a query parameter' });
    }

    // 设置 SSE 头
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*'
    });

    // 发送一个连接成功事件
    res.write(`data: ${JSON.stringify({ token: "" })}\n\n`);

    // 准备 prompt
    const prompt = await promptTemplate.format({ question: message });
    
    console.log('Starting streaming response for message:', message);
    
    try {
      // 流式处理响应
      await llm.invoke(prompt, {
        callbacks: [
          {
            handleLLMNewToken(token) {
              console.log('Token:', token);
              res.write(`data: ${JSON.stringify({ token })}\n\n`);
            },
            handleLLMEnd() {
              console.log('Stream completed');
              res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
              res.end();
            },
            handleLLMError(error) {
              console.error('LLM streaming error:', error);
              res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
              res.end();
            }
          }
        ]
      });
    } catch (error) {
      console.error('Error during streaming:', error);
      res.write(`data: ${JSON.stringify({ error: 'Streaming error: ' + error.message })}\n\n`);
      res.end();
    }
    
  } catch (error) {
    console.error('Error setting up streaming:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Error processing your message' });
    } else {
      res.write(`data: ${JSON.stringify({ error: 'Error: ' + error.message })}\n\n`);
      res.end();
    }
  }
});

// Keep the original API endpoint for compatibility
app.post('/api/chat', async (req, res) => {
  try {
    const { message } = req.body;
    
    console.log('Received message:', message);
    
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    console.log('Sending to LLM chain...');
    
    // Create a non-streaming instance for the regular API
    const nonStreamingLLM = new ChatOpenAI({
      openAIApiKey: process.env.OPENAI_API_KEY,
      configuration: {
        baseURL: "https://openrouter.ai/api/v1",
        defaultHeaders: {
          "HTTP-Referer": "http://localhost:5000", // 来源
          "X-Title": "LLM Chat Demo" // 应用标题
        }
      },
      temperature: 0.7,
      model: "meta-llama/llama-3-8b-instruct", // 使用 OpenRouter 上可用的模型
      modelName: "gpt-3.5-turbo", // 用于 token 计数的模型
      streaming: false,
      maxTokens: 1000, // 最大令牌数
    });
    
    const chain = new LLMChain({
      llm: nonStreamingLLM,
      prompt: promptTemplate,
    });
    
    const result = await chain.invoke({ question: message });
    console.log('LLM response received');
    
    return res.json({ response: result.text });
  } catch (error) {
    console.error('Error processing message:', error);
    return res.status(500).json({ error: 'Error processing your message' });
  }
});

// Serve static assets in production
if (process.env.NODE_ENV === 'production') {
  // Set static folder
  app.use(express.static('client/build'));

  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, 'client', 'build', 'index.html'));
  });
}

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 