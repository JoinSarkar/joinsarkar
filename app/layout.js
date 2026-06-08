import './globals.css'

export const metadata = {
  title: 'Join Sarkar — Your AI Chief of Staff',
  description: 'Your job is to study. Everything else is handled.',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}