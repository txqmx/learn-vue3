// 根据不同的参数实现不同的功能


import {mutableHandlers, shallowReactiveHandlers, readonlyHandlers, shallowReadonlyHandlers} from "./baseHandlers";
import {isObject} from "@vue/shared";

const reactiveMap = new WeakMap() // 对象的key不能是对象，WeakMap弱引用
const readonlyMap = new WeakMap()
const shallowReadonlyMap = new WeakMap()
const shallowReactiveMap = new WeakMap()

export function reactive(target:object){ // mutableHandlers
    return createReactiveObject(target, mutableHandlers, reactiveMap)
}

export function shallowReactive(target:object){
    return createReactiveObject(target, shallowReactiveHandlers, shallowReactiveMap)
}

export function readonly(target:object){
    return createReactiveObject(target, readonlyHandlers, readonlyMap)
}

export function shallowReadonly(target:object){
    return createReactiveObject(target, shallowReadonlyHandlers, shallowReadonlyMap)
}

export function createReactiveObject(target, baseHandlers, proxyMap){
    // 和vue2一样看一下目标是不是对象
    if(!isObject(target)){
        return target
    }
    // 创建代理对象 做缓存，不用重复代理
    const existsProxy = proxyMap.get(target)
    if(existsProxy){
        return existsProxy
    }
    const proxy = new Proxy(target, baseHandlers)
    proxyMap.set(target, proxy)
    return proxy
}
