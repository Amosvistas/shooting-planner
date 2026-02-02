import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '拍摄预案助手',
  description: '拍摄预案生成与分镜规划工具',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh">
      <body className="h-screen overflow-hidden text-[var(--ink)]">
        {children}
      </body>
    </html>
  );
}
