export const isObject = (val) => typeof val === 'object' && val !== null
export const isNumber = (val) => typeof val === 'number'
export const isFunction = (val) => typeof val === 'function'
export const isString = (val) => typeof val === 'string'
export const isBoolean = (val) => typeof val === 'boolean'
export const isArray =  Array.isArray
export const extend = Object.assign

// 判断属性是不是原型属性
export const hasOwn = (target, key) => Object.prototype.hasOwnProperty.call(target, key)

export const hasChange = (oldValue, value) => oldValue !== value
