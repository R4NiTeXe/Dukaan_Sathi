import mongoose from 'mongoose'

const SLOW_QUERY_MS = 150
const MAX_SLOW_QUERIES = 20
const slowQueries = []

mongoose.plugin((schema) => {
  ;[
    'find',
    'findOne',
    'findOneAndUpdate',
    'findOneAndDelete',
    'countDocuments',
    'distinct',
  ].forEach((method) => {
    schema.pre(method, function (next) {
      this.__slowStartAt = Date.now()
      next()
    })
    schema.post(method, function (result) {
      const duration = Date.now() - this.__slowStartAt
      if (duration >= SLOW_QUERY_MS) {
        slowQueries.push({
          op: method,
          filter: this.getFilter?.() || null,
          durationMs: duration,
          at: new Date().toISOString(),
        })
        if (slowQueries.length > MAX_SLOW_QUERIES) slowQueries.shift()
      }
      return result
    })
  })
  schema.pre('aggregate', function (next) {
    this.__slowStartAt = Date.now()
    next()
  })
  schema.post('aggregate', function (result) {
    const duration = Date.now() - this.__slowStartAt
    if (duration >= SLOW_QUERY_MS) {
      slowQueries.push({
        op: 'aggregate',
        filter: null,
        durationMs: duration,
        at: new Date().toISOString(),
      })
      if (slowQueries.length > MAX_SLOW_QUERIES) slowQueries.shift()
    }
    return result
  })
})

export const getSlowQueries = () => slowQueries
