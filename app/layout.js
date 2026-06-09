import './globals.css'
import Script from 'next/script'

export const metadata = {
  title: 'Join Sarkar — Your AI Chief of Staff',
  description: 'Your job is to study. Everything else is handled.',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}
        <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
      </body>
    </html>
  )
}
