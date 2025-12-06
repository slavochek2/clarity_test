# 代码集成快速参考

本文档提供将语音转文字功能集成到现有项目的快速参考。

## 核心文件清单

### 必需文件

1. **服务器端 API 路由**
   - `app/api/scribe-token/route.ts` (Next.js App Router)
   - 或 `pages/api/scribe-token.ts` (Next.js Pages Router)
   - 或对应的 Express/其他框架的路由

2. **客户端组件**
   - `app/page.tsx` - 主组件逻辑
   - `app/page.module.css` - 组件样式（可选，可自定义）
   - `app/globals.css` - 全局样式（可选）

## 最小集成代码

### 1. 服务器端（生成 Token）

```typescript
// app/api/scribe-token/route.ts (Next.js App Router)
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const apiKey = process.env.ELEVENLABS_API_KEY

  if (!apiKey) {
    return NextResponse.json(
      { error: 'ELEVENLABS_API_KEY 未配置' },
      { status: 500 }
    )
  }

  try {
    const response = await fetch(
      'https://api.elevenlabs.io/v1/single-use-token/realtime_scribe',
      {
        method: 'POST',
        headers: {
          'xi-api-key': apiKey,
        },
      }
    )

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      return NextResponse.json(
        { error: '获取 token 失败', details: errorData },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json({ token: data.token })
  } catch (error) {
    return NextResponse.json(
      { error: '服务器错误', details: error instanceof Error ? error.message : '未知错误' },
      { status: 500 }
    )
  }
}
```

### 2. 客户端（使用 Hook）

```typescript
'use client'

import { useState, useCallback } from 'react'
import { useScribe } from '@elevenlabs/react'

export default function SpeechToText() {
  const [error, setError] = useState<string | null>(null)

  const scribe = useScribe({
    modelId: 'scribe_v2_realtime',
    onPartialTranscript: (data) => {
      console.log('Partial:', data.text)
    },
    onCommittedTranscript: (data) => {
      console.log('Committed:', data.text)
    },
  })

  const fetchToken = useCallback(async () => {
    const response = await fetch('/api/scribe-token')
    if (!response.ok) {
      throw new Error('获取 token 失败')
    }
    const { token } = await response.json()
    return token
  }, [])

  const handleStart = useCallback(async () => {
    try {
      setError(null)
      const token = await fetchToken()
      await scribe.connect({
        token,
        microphone: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : '连接失败')
    }
  }, [fetchToken, scribe])

  const handleStop = useCallback(() => {
    scribe.disconnect()
  }, [scribe])

  return (
    <div>
      {error && <div>错误: {error}</div>}
      
      {!scribe.isConnected ? (
        <button onClick={handleStart}>开始录制</button>
      ) : (
        <button onClick={handleStop}>停止录制</button>
      )}

      {/* 临时转录 */}
      {scribe.partialTranscript && (
        <p>临时: {scribe.partialTranscript}</p>
      )}

      {/* 最终转录 */}
      <div>
        {scribe.committedTranscripts.map((t) => (
          <p key={t.id}>{t.text}</p>
        ))}
      </div>
    </div>
  )
}
```

## 环境变量

创建 `.env.local` 文件：

```bash
ELEVENLABS_API_KEY=your_api_key_here
```

## 依赖安装

```bash
npm install @elevenlabs/react
```

## 集成到其他框架

### Express.js

```javascript
// routes/scribe-token.js
const express = require('express')
const router = express.Router()

router.get('/scribe-token', async (req, res) => {
  const apiKey = process.env.ELEVENLABS_API_KEY
  
  if (!apiKey) {
    return res.status(500).json({ error: 'ELEVENLABS_API_KEY 未配置' })
  }

  try {
    const response = await fetch(
      'https://api.elevenlabs.io/v1/single-use-token/realtime_scribe',
      {
        method: 'POST',
        headers: {
          'xi-api-key': apiKey,
        },
      }
    )

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      return res.status(response.status).json({
        error: '获取 token 失败',
        details: errorData,
      })
    }

    const data = await response.json()
    res.json({ token: data.token })
  } catch (error) {
    res.status(500).json({
      error: '服务器错误',
      details: error.message,
    })
  }
})

module.exports = router
```

### Vue.js (使用 Composition API)

```vue
<template>
  <div>
    <button @click="handleStart" v-if="!isConnected">开始录制</button>
    <button @click="handleStop" v-else>停止录制</button>
    
    <div v-if="partialTranscript">临时: {{ partialTranscript }}</div>
    <div v-for="t in committedTranscripts" :key="t.id">
      {{ t.text }}
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { Scribe, RealtimeEvents } from '@elevenlabs/client'

const isConnected = ref(false)
const partialTranscript = ref('')
const committedTranscripts = ref([])
let connection = null

const fetchToken = async () => {
  const response = await fetch('/api/scribe-token')
  const { token } = await response.json()
  return token
}

const handleStart = async () => {
  const token = await fetchToken()
  
  connection = Scribe.connect({
    token,
    modelId: 'scribe_v2_realtime',
    microphone: {
      echoCancellation: true,
      noiseSuppression: true,
    },
  })

  connection.on(RealtimeEvents.SESSION_STARTED, () => {
    isConnected.value = true
  })

  connection.on(RealtimeEvents.PARTIAL_TRANSCRIPT, (data) => {
    partialTranscript.value = data.text
  })

  connection.on(RealtimeEvents.COMMITTED_TRANSCRIPT, (data) => {
    committedTranscripts.value.push({
      id: Date.now().toString(),
      text: data.text,
    })
    partialTranscript.value = ''
  })
}

const handleStop = () => {
  if (connection) {
    connection.close()
    connection = null
    isConnected.value = false
  }
}

onUnmounted(() => {
  handleStop()
})
</script>
```

## 关键点

1. **Token 生成必须在服务器端** - 保护 API Key
2. **使用官方 SDK** - `@elevenlabs/react` 或 `@elevenlabs/client`
3. **处理错误** - 网络错误、权限错误等
4. **清理资源** - 组件卸载时断开连接

## 测试清单

- [ ] 环境变量已配置
- [ ] API Key 有效
- [ ] 已接受 ElevenLabs 服务条款
- [ ] 服务器端 API 路由正常工作
- [ ] 客户端可以获取 token
- [ ] 麦克风权限已授予
- [ ] 可以正常连接和断开
- [ ] 转录结果正常显示

