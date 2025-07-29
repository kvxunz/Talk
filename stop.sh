#!/bin/bash

echo "开始停止服务..."

# 停止 Node.js 进程
echo "停止 Node.js 进程..."
NODE_PID=$(ps aux | grep '[n]ode server.js' | awk '{print $2}')
if [ ! -z "$NODE_PID" ]; then
    echo "找到 Node.js 进程 (PID: $NODE_PID)，正在停止..."
    kill $NODE_PID
    sleep 2
    # 确保进程已经停止，如果没有则强制停止
    if ps -p $NODE_PID > /dev/null; then
        echo "进程未响应，强制停止..."
        kill -9 $NODE_PID
    fi
    echo "Node.js 进程已停止"
else
    echo "未找到运行中的 Node.js 进程"
fi

# 停止 Nginx
echo "停止 Nginx 服务..."
if systemctl is-active --quiet nginx; then
    sudo systemctl stop nginx
    echo "Nginx 服务已停止"
else
    echo "Nginx 服务未运行"
fi

echo "所有服务已停止！"
