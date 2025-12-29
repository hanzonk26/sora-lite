export const metadata = {
  title: 'Sora Lite',
  description: 'Personal AI video practice'
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body style={{ margin: 0 }}>{children}</body>
    </html>
  )
}
