// 核心进行劫持的方法，处理get和set逻辑

import {reactive, readonly} from "./reactive";
import {extend, hasChanged, hasOwn, isArray, isInteger, isObject} from "@vue/shared";
import {track, trigger} from "./effect";

const get = createGetter()
const readonlyGet = createGetter(true)
const shallowGet = createGetter(false, true)
const shallowReadonlyGet = createGetter(true, true)

const set = createSetter()
const readonlySet = {
    set(target, key){
       console.log(`cannot set on ${key}, readonly!!`)
    }
}

function createGetter(isReadonly = false, shallow = false){
    // 取值的时候第一个是目标，第二个是属性是谁，地上那个就是代理对象
    return function get(target, key, receiver){
        // 依赖收集 proxy 和 reflect 一般情况向会联合使用
        let res = Reflect.get(target, key, receiver) // target[key]

        if(!isReadonly){ // 如果对象是一个仅读的属性，意味着这个对象不可能被更改，不用依赖收集
            // 依赖收集
            // 如果当前是在effect中取值，要做一个映射关系 obj.name -> [effect,effect]
            // let dep = new Dep() dep.depend()
            track(target, 'get', key)

        }

        if(shallow){ // 浅代理不需要递归
            return res
        }

        if(isObject(res)){ // 如果是对象就递归代理，但是不是一开始就代理，是在用到这个对象的时候才进行代理
            return isReadonly ? readonly(res) : reactive(res)
        }

        return res  // 懒代理，当取值的时候才取进行代理
    }
}

function createSetter(){
    return function set(target, key, value, receiver){
        let oldValue = target[key]

        // 如果是新增也要触发更新
        let hadKey = isArray(target) && isInteger(key) ? key < target.length : hasOwn(target, key)

        // 触发视图更新
        let res = Reflect.set(target, key, value, receiver) // target[key] = value

        if(!hadKey){ // 新增逻辑
            trigger(target, key, value, 'add')
        }else if(hasChanged(oldValue, value)){
            trigger(target, key, value, 'set') // 触发这个对象上的属性，让他更新
        }
        return res
    }
}

export const mutableHandlers = {
    get: get,
    set: set
}
export const shallowReactiveHandlers = {
    get: shallowGet,
    set: set
}
export const readonlyHandlers = extend({
    get:readonlyGet
}, readonlySet)
export const shallowReadonlyHandlers = extend({
    get:shallowReadonlyGet
}, readonlySet)
