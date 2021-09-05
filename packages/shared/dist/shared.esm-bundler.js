const isObject = (val) => typeof val === 'object' && val !== null;
const isNumber = (val) => typeof val === 'number';
const isFunction = (val) => typeof val === 'function';
const isString = (val) => typeof val === 'string';
const isBoolean = (val) => typeof val === 'boolean';
const isArray = Array.isArray;
const extend = Object.assign;
// 判断属性是不是原型属性
const hasOwn = (target, key) => Object.prototype.hasOwnProperty.call(target, key);
const hasChange = (oldValue, value) => oldValue !== value;

export { extend, hasChange, hasOwn, isArray, isBoolean, isFunction, isNumber, isObject, isString };
