# 使用官方 Node.js 镜像
FROM node:16

# 设置工作目录
WORKDIR /app

# 复制依赖文件并安装
COPY package*.json ./
RUN npm install

# 复制项目代码
COPY . .

# 暴露端口（需与代码中端口一致）
EXPOSE 3000

# 启动命令（需与 package.json 的 "start" 脚本一致）
CMD ["npm", "start"]