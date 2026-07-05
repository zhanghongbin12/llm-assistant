const express = require('express');
const dotenv = require('dotenv');
const { ChatOpenAI } = require('@langchain/openai');
const { PromptTemplate } = require('@langchain/core/prompts');
const { LLMChain } = require('langchain/chains');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 9000;

const openRouterHeaders = {
  'HTTP-Referer': process.env.APP_URL || 'http://localhost:5000',
  'X-Title': 'LLM Chat Demo',
};

// CORS is handled by CloudBase gateway; do not set it here to avoid duplicate headers.
app.use(express.json());

const llm = new ChatOpenAI({
  openAIApiKey: process.env.OPENAI_API_KEY,
  configuration: {
    baseURL: 'https://openrouter.ai/api/v1',
    defaultHeaders: openRouterHeaders,
  },
  temperature: 0.7,
  model: 'cohere/north-mini-code:free',
  streaming: true,
  maxTokens: 1000,
});

const template = `You are a helpful AI assistant. Try to answer the user's question to the best of your ability.
Question: {question}
Answer:`;

const promptTemplate = PromptTemplate.fromTemplate(template);

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.get('/api/chat-stream', async (req, res) => {
  try {
    const message = req.query.message;

    if (!message) {
      return res.status(400).json({ error: 'Message is required as a query parameter' });
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    const heartbeat = setInterval(() => {
      res.write(': heartbeat\n\n');
    }, 30000);

    const cleanup = () => clearInterval(heartbeat);
    req.on('close', cleanup);

    res.write(`data: ${JSON.stringify({ token: '' })}\n\n`);

    const prompt = await promptTemplate.format({ question: message });

    console.log('Starting streaming response for message:', message);

    try {
      await llm.invoke(prompt, {
        callbacks: [
          {
            handleLLMNewToken(token) {
              console.log('Token:', token);
              res.write(`data: ${JSON.stringify({ token })}\n\n`);
            },
            handleLLMEnd() {
              console.log('Stream completed');
              cleanup();
              res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
              res.end();
            },
            handleLLMError(error) {
              console.error('LLM streaming error:', error);
              cleanup();
              res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
              res.end();
            },
          },
        ],
      });
    } catch (error) {
      console.error('Error during streaming:', error);
      cleanup();
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

app.post('/api/chat', async (req, res) => {
  try {
    const { message } = req.body;

    console.log('Received message:', message);

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    console.log('Sending to LLM chain...');

    const nonStreamingLLM = new ChatOpenAI({
      openAIApiKey: process.env.OPENAI_API_KEY,
      configuration: {
        baseURL: 'https://openrouter.ai/api/v1',
        defaultHeaders: openRouterHeaders,
      },
      temperature: 0.7,
      model: 'meta-llama/llama-3-8b-instruct',
      modelName: 'gpt-3.5-turbo',
      streaming: false,
      maxTokens: 1000,
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

app.listen(PORT, '0.0.0.0', () => {
  console.log(`API server running on port ${PORT}`);
});
