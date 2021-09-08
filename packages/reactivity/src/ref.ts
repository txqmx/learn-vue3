import {hasChanged, isArray, isObject} from "@vue/shared";
import {reactive} from "./reactive";
import {track, trigger} from "./effect";

export function ref(value){
    return createRef(value)
}

export function shallowRef(value){
    return createRef(value, true)
}

const convert = val => isObject(val) ? reactive(val) : val

class RefImpl {
    private _value;
    constructor(public rewValue, public isShallow) {
        this._value = isShallow ? rewValue : convert(rewValue) // this._value 就是一个私有属性
    }
    get value(){
        track(this, 'get', 'value')
        return this._value
    }
    set value(newValue){
        if(hasChanged(newValue, this.rewValue)){
            this.rewValue = newValue // 属性变化， 需要更新
            this._value = this.isShallow ? newValue : convert(newValue)
            trigger(this, 'value', newValue, 'set')
        }
    }
}

function createRef(value, isShallow = false){
    return new RefImpl(value, isShallow)
}

class ObjectRefImpl{
    constructor(public target, public key ) {

    }
    get value(){
        return this.target[this.key]
    }
    set value(newValue){
        this.target[this.key] = newValue
    }
}

export function toRefs(object){
    // 对象的浅拷贝
    const ret = isArray(object) ? new Array(object.length) : {}
    for(let key in object){
        ret[key] = toRef(object, key)
    }
    return ret
}

export function toRef(target, key){ // 取出某一个属性变成ref
    return new ObjectRefImpl(target, key)
}
