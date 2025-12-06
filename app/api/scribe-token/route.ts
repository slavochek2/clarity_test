import { NextRequest, NextResponse } from 'next/server'

/**
 * 生成 ElevenLabs 单次使用 token
 * 这个 API 路由在服务器端安全地使用 API Key 生成 token
 * 客户端使用这个 token 连接到 ElevenLabs 的实时语音转文字服务
 */
export async function GET(request: NextRequest) {
  const apiKey = process.env.ELEVENLABS_API_KEY

  if (!apiKey) {
    console.error('ELEVENLABS_API_KEY 环境变量未配置')
    return NextResponse.json(
      { 
        error: 'ELEVENLABS_API_KEY 未配置',
        message: '请在 .env.local 文件中配置 ELEVENLABS_API_KEY 环境变量'
      },
      { status: 500 }
    )
  }

  // 验证 API Key 格式（通常以 sk- 或 sk_ 开头）
  if (!apiKey.startsWith('sk-') && !apiKey.startsWith('sk_')) {
    console.warn('API Key 格式可能不正确，但继续尝试')
  }

  try {
    // 调用 ElevenLabs API 生成单次使用 token
    const response = await fetch(
      'https://api.elevenlabs.io/v1/single-use-token/realtime_scribe',
      {
        method: 'POST',
        headers: {
          'xi-api-key': apiKey,
          'Content-Type': 'application/json',
        },
      }
    )

    if (!response.ok) {
      let errorData: any = {}
      try {
        const text = await response.text()
        errorData = text ? JSON.parse(text) : {}
      } catch {
        errorData = { message: '无法解析错误响应' }
      }
      
      console.error('ElevenLabs API 错误:', {
        status: response.status,
        statusText: response.statusText,
        errorData,
        apiKeyPrefix: apiKey.substring(0, 10) + '...' // 只显示前10个字符用于调试
      })
      
      // 处理认证错误
      if (response.status === 401 || response.status === 403) {
        const errorMessage = errorData.message || errorData.error || '认证失败'
        return NextResponse.json(
          { 
            error: '认证失败',
            message: `API Key 认证失败: ${errorMessage}。请检查：\n1) API Key 是否正确（当前 Key 前缀: ${apiKey.substring(0, 10)}...）\n2) 是否已在 ElevenLabs 仪表板接受服务条款（使用 Scribe 功能必需）\n3) API Key 是否有使用 Scribe 功能的权限\n4) 如果刚创建 API Key，请重启开发服务器`,
            details: errorData,
            status: response.status 
          },
          { status: response.status }
        )
      }
      
      return NextResponse.json(
        { 
          error: '获取 token 失败', 
          message: errorData.message || '未知错误',
          details: errorData,
          status: response.status 
        },
        { status: response.status }
      )
    }

    const data = await response.json()
    
    if (!data.token) {
      console.error('响应中没有 token:', data)
      return NextResponse.json(
        { error: '响应格式错误，未找到 token' },
        { status: 500 }
      )
    }

    // Token 会在 15 分钟后自动过期
    return NextResponse.json({ token: data.token })
  } catch (error) {
    console.error('获取 token 时出错:', error)
    return NextResponse.json(
      { 
        error: '服务器错误', 
        details: error instanceof Error ? error.message : '未知错误' 
      },
      { status: 500 }
    )
  }
}

