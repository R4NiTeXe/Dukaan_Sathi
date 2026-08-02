import { Bill } from '../models/Bill.model.js'
import { generateBillNumber } from '../helpers/billNumber.helper.js'
import { refreshCustomerStats } from '../helpers/customerStats.helper.js'
import { autoAddProducts } from '../helpers/productAutoAdd.helper.js'

export const saveBill = async (userId, data) => {
  const { items, paymentMethod, paymentStatus, customerId } = data
  const totalAmount = items.reduce(
    (sum, item) =>
      sum + (item.pricePerUnit ? item.price * item.quantity : item.price),
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

  try {
    await autoAddProducts(userId, items)
  } catch (error) {
    console.error('autoAddProducts failed:', error.message)
  }

  return bill
}
