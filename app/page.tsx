'use client'

import { useState, useCallback, useRef } from 'react'
import { useScribe } from '@elevenlabs/react'
import styles from './page.module.css'

export default function Home() {
  const [error, setError] = useState<string | null>(null)
  const [isConnecting, setIsConnecting] = useState(false)
  const [languageCode, setLanguageCode] = useState<string>('en') // 默认英文
  const connectionTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const scribe = useScribe({
    modelId: 'scribe_v2_realtime',
    onPartialTranscript: (data) => {
      console.log('Partial:', data.text)
    },
    onCommittedTranscript: (data) => {
      console.log('Committed:', data.text)
    },
    onCommittedTranscriptWithTimestamps: (data) => {
      console.log('Committed with timestamps:', data.text)
      console.log('Timestamps:', data.words)
    },
    onConnect: () => {
      console.log('Connected successfully')
      // 清理连接超时
      if (connectionTimeoutRef.current) {
        clearTimeout(connectionTimeoutRef.current)
        connectionTimeoutRef.current = null
      }
      setIsConnecting(false)
      setError(null)
    },
    onError: (error) => {
      console.error('Scribe error:', error)
      const errorMessage = error instanceof Error ? error.message : 
                          typeof error === 'string' ? error : 
                          '连接错误'
      
      // 如果是认证错误，立即断开连接
      if (errorMessage.includes('authenticated') || errorMessage.includes('认证')) {
        console.error('认证错误，断开连接')
        try {
          scribe.disconnect()
        } catch (disconnectErr) {
          // 忽略断开时的错误
          console.warn('Disconnect error:', disconnectErr)
        }
      }
      
      setError(errorMessage)
      setIsConnecting(false)
      
      // 清理超时
      if (connectionTimeoutRef.current) {
        clearTimeout(connectionTimeoutRef.current)
        connectionTimeoutRef.current = null
      }
    },
    onDisconnect: () => {
      console.log('Disconnected')
      setIsConnecting(false)
    },
  })

  const fetchToken = useCallback(async () => {
    try {
      const response = await fetch('/api/scribe-token')
      if (!response.ok) {
        const errorData = await response.json()
        // 显示详细的错误信息
        const errorMessage = errorData.message || errorData.error || '获取 token 失败'
        throw new Error(errorMessage)
      }
      const data = await response.json()
      const { token } = data
      
      // 验证 token 是否存在且有效
      if (!token || typeof token !== 'string' || token.trim() === '') {
        throw new Error('Token 无效：服务器返回的 token 为空或格式错误')
      }
      
      console.log('Token received, length:', token.length)
      return token
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '未知错误'
      setError(errorMessage)
      throw err
    }
  }, [])

  const handleStart = useCallback(async () => {
    // 防止重复连接
    if (scribe.isConnected || isConnecting) {
      console.log('Already connected or connecting')
      return
    }

    try {
      setError(null)
      setIsConnecting(true)

      const token = await fetchToken()

      // 再次验证 token
      if (!token || token.trim() === '') {
        throw new Error('Token 无效，无法连接')
      }

      // 确保在连接前没有已存在的连接
      if (scribe.isConnected) {
        try {
          await scribe.disconnect()
          // 等待断开完成
          await new Promise((resolve) => setTimeout(resolve, 200))
        } catch (disconnectErr) {
          console.warn('Disconnect error (ignoring):', disconnectErr)
        }
      }

      // 连接配置
      const connectOptions: any = {
        token,
        microphone: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      }

      // 只有在指定了语言代码时才添加
      if (languageCode && languageCode.trim() !== '') {
        connectOptions.languageCode = languageCode
      }

      await scribe.connect(connectOptions)

      // 设置连接超时（5秒）
      connectionTimeoutRef.current = setTimeout(() => {
        if (!scribe.isConnected) {
          console.warn('Connection timeout')
          setIsConnecting(false)
          setError('连接超时，请重试。如果问题持续，请刷新页面。')
          connectionTimeoutRef.current = null
        }
      }, 5000)
    } catch (err) {
      console.error('连接失败:', err)
      // 清理超时
      if (connectionTimeoutRef.current) {
        clearTimeout(connectionTimeoutRef.current)
        connectionTimeoutRef.current = null
      }
      setError(err instanceof Error ? err.message : '连接失败')
      setIsConnecting(false)
    }
  }, [fetchToken, scribe, isConnecting, languageCode])

  const handleStop = useCallback(async () => {
    try {
      setIsConnecting(false)
      if (scribe.isConnected) {
        await scribe.disconnect()
      } else {
        // 如果连接状态不一致，强制重置
        console.log('Force disconnect')
      }
    } catch (err) {
      console.error('断开连接失败:', err)
      // 即使出错也重置状态
      setIsConnecting(false)
      setError('断开连接失败')
    }
  }, [scribe])

  const clearTranscript = () => {
    setError(null)
    // 注意：SDK 管理的转录结果无法直接清空
    // 如果需要清空，需要断开连接后重新连接
  }

  const copyToClipboard = async () => {
    const committedText = scribe.committedTranscripts
      .map((t) => t.text)
      .join(' ')
    const textToCopy = scribe.partialTranscript
      ? committedText + (committedText ? ' ' : '') + scribe.partialTranscript
      : committedText

    try {
      await navigator.clipboard.writeText(textToCopy)
      alert('已复制到剪贴板！')
    } catch (err) {
      console.error('复制失败:', err)
      setError('复制失败')
    }
  }

  // 构建完整的显示文本：已确认的转录 + 临时转录
  const committedText = scribe.committedTranscripts
    .map((t) => t.text)
    .join(' ')
  const displayText = scribe.partialTranscript
    ? committedText + (committedText ? ' ' : '') + `[临时] ${scribe.partialTranscript}`
    : committedText

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.title}>🎤 语音转文字</h1>
        <p className={styles.subtitle}>
          使用 ElevenLabs Scribe v2 实时语音转文字
        </p>

        {error && (
          <div className={styles.errorBanner}>
            <p>⚠️ {error}</p>
            {error.includes('认证失败') && (
              <div className={styles.errorDetails}>
                <p><strong>解决步骤：</strong></p>
                <ol>
                  <li>访问 <a href="https://elevenlabs.io/app/settings/api-keys" target="_blank" rel="noopener noreferrer">ElevenLabs API Keys</a> 检查 API Key 是否有效</li>
                  <li>确保已在仪表板接受服务条款（使用 Scribe 功能必需）</li>
                  <li>如果刚修改了环境变量，请<strong>重启开发服务器</strong>（停止后运行 <code>npm run dev</code>）</li>
                  <li>检查 API Key 是否有使用 Scribe 功能的权限</li>
                </ol>
              </div>
            )}
          </div>
        )}

        {/* 语言选择器 */}
        {!scribe.isConnected && (
          <div className={styles.languageSelector}>
            <label htmlFor="language-select" className={styles.languageLabel}>
              转录语言：
            </label>
            <select
              id="language-select"
              value={languageCode}
              onChange={(e) => setLanguageCode(e.target.value)}
              disabled={scribe.isConnected || isConnecting}
              className={styles.languageSelect}
            >
              <option value="en">English (英文)</option>
              <option value="zh-CN">中文 (简体)</option>
              <option value="zh-TW">中文 (繁体)</option>
              <option value="ja">日本語</option>
              <option value="ko">한국어</option>
              <option value="es">Español</option>
              <option value="fr">Français</option>
              <option value="de">Deutsch</option>
              <option value="it">Italiano</option>
              <option value="pt">Português</option>
              <option value="ru">Русский</option>
              <option value="">自动检测</option>
            </select>
          </div>
        )}

        <div className={styles.controls}>
          {!scribe.isConnected && !isConnecting ? (
            <button
              onClick={handleStart}
              disabled={scribe.isConnected || isConnecting}
              className={`${styles.button} ${styles.buttonStart}`}
            >
              <span className={styles.buttonIcon}>🎙️</span>
              开始录制
            </button>
          ) : (
            <button
              onClick={handleStop}
              disabled={!scribe.isConnected && !isConnecting}
              className={`${styles.button} ${styles.buttonStop}`}
            >
              <span className={styles.buttonIcon}>⏹️</span>
              {isConnecting ? '连接中...' : '停止录制'}
            </button>
          )}

          {displayText && (
            <>
              <button
                onClick={clearTranscript}
                className={`${styles.button} ${styles.buttonSecondary}`}
              >
                清空
              </button>
              <button
                onClick={copyToClipboard}
                className={`${styles.button} ${styles.buttonSecondary}`}
              >
                复制
              </button>
            </>
          )}
        </div>

        {scribe.isConnected && (
          <div className={styles.recordingIndicator}>
            <span className={styles.pulse}></span>
            正在录制中...
          </div>
        )}

        <div className={styles.transcriptContainer}>
          <div className={styles.transcriptHeader}>
            <h2>转录结果</h2>
            {displayText && (
              <span className={styles.wordCount}>
                {displayText.replace(/\s*\[临时\]\s*/g, '').length} 字
              </span>
            )}
          </div>
          <div className={styles.transcript}>
            {displayText || (
              <span className={styles.placeholder}>
                转录结果将显示在这里...
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
