const { EventSource } = require('eventsource');
const readline = require('readline');

function testSSE(message) {
  console.log(`发送消息: "${message}"`);
  console.log('开始接收流式响应...');
  
  // 创建 SSE 连接
  const endpoint =  'chat-stream';
  const url = `http://localhost:5000/api/${endpoint}?message=${encodeURIComponent(message)}`;
  
  console.log(`连接到端点: ${endpoint}`);
  
  try {
    const eventSource = new EventSource(url);
    
    // 完整响应
    let fullResponse = '';
    
    // 处理消息
    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      if (data.token) {
        process.stdout.write(data.token);
        fullResponse += data.token;
      }
      
      if (data.done) {
        console.log('\n\n流式响应完成');
        eventSource.close();
        
        // 设置延迟后退出程序
        setTimeout(() => {
          process.exit(0);
        }, 500);
      }
      
      if (data.error) {
        console.error('\n错误:', data.error);
        eventSource.close();
        process.exit(1);
      }
    };
    
    // 处理错误
    eventSource.onerror = (error) => {
      console.error('连接错误:', error);
      eventSource.close();
      process.exit(1);
    };
  } catch (error) {
    console.error('创建 SSE 连接失败:', error);
    process.exit(1);
  }
}

// 如果提供了命令行参数，使用它作为消息
// 否则，请求用户输入
if (process.argv.length > 2) {
  const message = process.argv[2];
  testSSE(message);
} else {
  // 创建命令行交互界面
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  rl.question('请输入消息: ', (message) => {
    rl.close();
    testSSE(message);
  });
}

// 使用方式: node test-sse.js "你的测试消息"
// 或者不带参数运行，然后按提示输入消息 