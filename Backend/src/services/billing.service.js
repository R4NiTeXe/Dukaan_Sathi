import { Bill } from '../models/Bill.model.js'
import { generateBillNumber } from '../helpers/billNumber.helper.js'
import { refreshCustomerStats } from '../helpers/customerStats.helper.js'

export const saveBill = async (userId, data) => {
  const { items, paymentMethod, paymentStatus, customerId } = data
  const totalAmount = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  )
  const billNumber = await generateBillNumber()

  const bill = await Bill.create({
    userId,
    billNumber,
    items,
    totalAmount,
    paymentMethod,
    paymentStatus: paymentStatus || 'paid',
    customerId: customerId || null,
  })

  if (bill.customerId) {
    await refreshCustomerStats(bill.customerId)
  }

  return bill
}
