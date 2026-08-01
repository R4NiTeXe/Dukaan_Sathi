import mongoose from 'mongoose'

const pad = (n) => String(n).padStart(3, '0')
const dateString = () => {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}${m}${day}`
}

const getLastBillNumber = async (prefix) => {
  const { Bill } = await import('../models/Bill.model.js')
  const escaped = prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const last = await Bill.findOne({ billNumber: new RegExp(`^${escaped}`) })
    .sort({ billNumber: -1 })
    .select('billNumber')
    .lean()
  const lastSeq = last ? parseInt(last.billNumber.split('-').pop(), 10) : 0
  return `${prefix}${pad(lastSeq + 1)}`
}

export const generateBillNumber = async () => {
  const prefix = `BILL-${dateString()}-`
  try {
    const db = mongoose.connection.db
    const counters = db.collection('counters')
    const result = await counters.findOneAndUpdate(
      { _id: prefix },
      { $inc: { seq: 1 } },
      { upsert: true, returnDocument: 'after' }
    )
    const seq = result?.seq ?? 1
    return `${prefix}${pad(seq)}`
  } catch {
    return getLastBillNumber(prefix)
  }
}
