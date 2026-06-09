import { NextResponse } from 'next/server'
import Razorpay from 'razorpay'
import crypto from 'crypto'

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
})

const PLANS = {
  objective: { amount: 29900, name: 'Objective Track', duration: 30 },
  advanced: { amount: 49900, name: 'Advanced Track', duration: 30 },
}

export async function POST(request) {
  try {
    const { action, plan, paymentId, orderId, signature, userId } = await request.json()

    if (action === 'create_order') {
      const selectedPlan = PLANS[plan]
      if (!selectedPlan) {
        return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
      }

      const order = await razorpay.orders.create({
        amount: selectedPlan.amount,
        currency: 'INR',
        receipt: `rcpt_${Date.now()}`,
        notes: { plan, userId },
      })

      return NextResponse.json({
        orderId: order.id,
        amount: selectedPlan.amount,
        currency: 'INR',
        planName: selectedPlan.name,
      })
    }

    if (action === 'verify_payment') {
      const body = orderId + '|' + paymentId
      const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(body)
        .digest('hex')

      const isValid = expectedSignature === signature

      if (!isValid) {
        return NextResponse.json({ error: 'Invalid payment signature' }, { status: 400 })
      }

      return NextResponse.json({ verified: true, paymentId, orderId })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Payment error:', error)
    return NextResponse.json(
      { error: error.message || 'Payment failed' },
      { status: 500 }
    )
  }
}
