# LangChain LLM Chat Application

基于 Node.js 和 React 的 LangChain LLM 聊天应用。

## 安装

```bash
npm install
cd client && npm install
```

## 启动应用

```bash
npm run dev
```

## Node.js 版本兼容性说明

本项目最初为较旧版本的 Node.js 开发，如果使用 Node.js 18 或更高版本，可能会遇到以下错误：

```
Error [ERR_PACKAGE_PATH_NOT_EXPORTED]: Package subpath './prompts' is not defined by "exports"
```

### 解决方案

在 Node.js 18+ 环境下，需要更新 LangChain 的导入路径：

1. 将 `require('langchain/prompts')` 修改为 `require('@langchain/core/prompts')`
2. 保持 `require('langchain/chains')` 不变

这些修改已在最新版本中实施。如果遇到其他导入错误，请检查 LangChain 最新文档中的包结构。

## 环境变量

请在根目录创建 `.env` 文件并添加以下内容：

```
OPENAI_API_KEY=your_api_key_here
```

## 许可证

ISC

## Features

- Real-time chat interface
- Integration with OpenAI's GPT models via LangChain
- Simple and intuitive UI

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- OpenAI API key

## Setup

1. Clone this repository
2. Install server dependencies:
   ```
   npm install
   ```
3. Install client dependencies:
   ```
   cd client
   npm install
   cd ..
   ```
4. Create a `.env` file in the root directory and add your OpenAI API key:
   ```
   PORT=5000
   OPENAI_API_KEY=your_openai_api_key_here
   ```

## Running the Application

### Development Mode

1. Start the backend server:
   ```
   npm run dev
   ```
2. In a separate terminal, start the React frontend:
   ```
   cd client
   npm start
   ```
3. Access the application at `http://localhost:3000`

### Production Build

1. Build the React frontend:
   ```
   cd client
   npm run build
   cd ..
   ```
2. Set the environment variable for production:
   ```
   export NODE_ENV=production
   ```
3. Start the server:
   ```
   npm start
   ```
4. Access the application at `http://localhost:5000`

## Project Structure

```
my-llm/
├── client/               # React frontend
│   ├── public/           # Static files
│   └── src/              # React source code
├── server.js             # Express server with LangChain
├── .env                  # Environment variables
├── package.json          # Node.js dependencies
└── README.md             # Project documentation
```

## Technologies Used

- **Frontend**: React, Axios
- **Backend**: Node.js, Express
- **LLM Integration**: LangChain, OpenAI
- **Other**: dotenv, cors 