#!/bin/bash

echo "Starting restart process..."

# 切换到项目目录
cd /root/Talk

# 重新构建项目
echo "Rebuilding project..."
pnpm run build
if [ $? -ne 0 ]; then
    echo "Build failed!"
    exit 1
fi

# 查找并终止现有的 Node.js 进程
echo "Stopping existing Node.js process..."
OLD_PID=$(lsof -t -i:3000)
if [ ! -z "$OLD_PID" ]; then
    echo "Killing process $OLD_PID"
    kill -9 $OLD_PID
fi

# 等待端口释放
echo "Waiting for port to be available..."
sleep 2

# 启动新的服务器进程
echo "Starting new server..."
node server.js &

# 等待服务器启动
echo "Waiting for server to start..."
sleep 2

# 检查服务器是否成功启动
if lsof -i:3000 > /dev/null; then
    echo "Server successfully restarted!"
    echo "You can now access the application at https://y.xvliote.top"
else
    echo "Server failed to start!"
    exit 1
fi
