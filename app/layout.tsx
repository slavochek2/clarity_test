import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Speech to Text - 语音转文字',
  description: '实时语音转文字应用',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  )
}

