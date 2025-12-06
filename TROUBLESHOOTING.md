# 故障排除指南 - "You must be authenticated to use this endpoint"

## 🔍 错误原因

这个错误通常表示 ElevenLabs API 无法验证您的 API Key。可能的原因包括：

1. **API Key 无效或已过期**
2. **未接受服务条款**（使用 Scribe 功能必需）
3. **API Key 没有 Scribe 功能权限**
4. **环境变量未正确加载**

## ✅ 解决步骤

### 步骤 1: 检查 API Key

1. 访问 [ElevenLabs API Keys 页面](https://elevenlabs.io/app/settings/api-keys)
2. 确认您的 API Key 存在且状态为"Active"
3. 如果 Key 已过期或被删除，创建新的 API Key

### 步骤 2: 接受服务条款

**重要**: 使用 Scribe 功能必须接受服务条款！

1. 访问 [ElevenLabs Dashboard](https://elevenlabs.io/app)
2. 在设置或首次使用时，会提示您接受服务条款
3. 确保已接受所有必需的服务条款

### 步骤 3: 验证环境变量

1. 确认 `.env.local` 文件存在（不是 `.env`）
2. 确认文件内容格式正确：
   ```bash
   ELEVENLABS_API_KEY=sk_xxxxxxxxxxxxx
   ```
3. 确保没有多余的空格或引号

### 步骤 4: 重启开发服务器

**关键步骤**: 修改环境变量后必须重启服务器！

```bash
# 停止当前服务器 (Ctrl+C)
# 然后重新启动
npm run dev
```

### 步骤 5: 测试 API Key

使用以下命令测试 API Key 是否有效：

```bash
# 替换 YOUR_API_KEY 为您的实际 API Key
curl -X POST https://api.elevenlabs.io/v1/single-use-token/realtime_scribe \
  -H "xi-api-key: YOUR_API_KEY"
```

如果返回 token，说明 API Key 有效。如果返回错误，请检查上述步骤。

## 🐛 常见问题

### Q: 为什么修改了 .env.local 还是报错？

A: Next.js 只在启动时加载环境变量。修改后必须重启开发服务器。

### Q: 如何确认环境变量已加载？

A: 在 `app/api/scribe-token/route.ts` 中添加临时日志：
```typescript
console.log('API Key loaded:', apiKey ? 'Yes' : 'No')
console.log('API Key prefix:', apiKey?.substring(0, 10))
```

### Q: API Key 格式正确但还是报错？

A: 检查以下几点：
- API Key 是否在 ElevenLabs 仪表板中显示为"Active"
- 是否已接受服务条款
- 账户是否有足够的配额
- API Key 是否有使用 Scribe 功能的权限

### Q: 错误信息显示 "unaccepted_terms_error"？

A: 这表示您需要接受 ElevenLabs 的服务条款：
1. 登录 ElevenLabs Dashboard
2. 访问设置页面
3. 接受服务条款和条件

## 📞 获取帮助

如果以上步骤都无法解决问题：

1. 检查 [ElevenLabs 官方文档](https://elevenlabs.io/docs)
2. 查看服务器控制台的详细错误信息
3. 联系 ElevenLabs 支持

## 🔐 安全提示

- 永远不要将 API Key 提交到 Git 仓库
- 使用 `.env.local` 文件（已在 `.gitignore` 中）
- 定期轮换 API Key
- 不要在前端代码中暴露 API Key

