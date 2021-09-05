'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

const isObject = (val) => typeof val === 'object' && val !== null;
const extend = Object.assign;

function effect(fn, options = {}) {
    let effect = createReactiveEffect(fn, options);
    if (!options.lazy) {
        effect();
    }
    return effect;
}
let uid = 0;
let activeEffect;
function createReactiveEffect(fn, options) {
    const effect = function () {
        // 需要将effect暴露到外层
        activeEffect = effect; // Dep.target = watcher
        fn(); // 当我执行用户传入的函数时，会执行get
        activeEffect = null;
    };
    effect.id = uid++; // 每个effect都有一个唯一标识 可以理解为watcher
    effect._isEffect = true; // 用于标识这个函数是一个effect函数
    effect.raw = fn; // 把用户传入的函数保存到当前的effect上
    effect.deps = []; // 后续用用来存放此effect对于哪些属性
    effect.options = options;
    return effect;
}
/*
wealMap = {
    object:Map({
        name: new Set(effect, effect)
    })
}
* */
const targetMap = new WeakMap(); // WeakMap的key只能是对象
function track(target, type, key) {
    if (!activeEffect) { // 说明取值操作是在effect之外的，跳过依赖收集
        return;
    }
    let depsMap = targetMap.get(target); // 先尝试看一下这个对象中是否存过属性
    if (!depsMap) {
        targetMap.set(target, (depsMap = new Map)); // {obj: map({key: set(effect))}
    }
    let dep = depsMap.get(key);
    if (!dep) {
        depsMap.set(key, (dep = new Set));
    }
    if (!dep.has(activeEffect)) { // 同一个属性，不会添加重复的effect
        dep.add(activeEffect);
    }
    // 制作一个依赖收集的关联列表
}
function trigger(target, key, value) {
    const depsMap = targetMap.get(target);
    if (!depsMap)
        return; // 没有收集过 直接跳过
    const effects = depsMap.get(key); // 找到此属性对应的effect列表，直接执行
    effects.forEach(effect => effect());
}

// 核心进行劫持的方法，处理get和set逻辑
const get = createGetter();
const readonlyGet = createGetter(true);
const shallowGet = createGetter(false, true);
const shallowReadonlyGet = createGetter(true, true);
const set = createSetter();
const readonlySet = {
    set(target, key) {
        console.log(`cannot set on ${key}, readonly!!`);
    }
};
function createGetter(isReadonly = false, shallow = false) {
    // 取值的时候第一个是目标，第二个是属性是谁，地上那个就是代理对象
    return function get(target, key, receiver) {
        // 依赖收集 proxy 和 reflect 一般情况向会联合使用
        let res = Reflect.get(target, key, receiver); // target[key]
        if (!isReadonly) { // 如果对象是一个仅读的属性，意味着这个对象不可能被更改，不用依赖收集
            // 依赖收集
            console.log('依赖收集');
            // 如果当前是在effect中取值，要做一个映射关系 obj.name -> [effect,effect]
            // let dep = new Dep() dep.depend()
            track(target, 'get', key);
        }
        if (shallow) { // 浅代理不需要递归
            return res;
        }
        if (isObject(res)) { // 如果是对象就递归代理，但是不是一开始就代理，是在用到这个对象的时候才进行代理
            return isReadonly ? readonly(res) : reactive(res);
        }
        return res; // 懒代理，当取值的时候才取进行代理
    };
}
function createSetter() {
    return function set(target, key, value, receiver) {
        let res = Reflect.set(target, key, value, receiver); // target[key] = value
        // 触发视图更新
        trigger(target, key); // 触发这个对象上的属性，让他更新
        console.log('视图更新');
        return res;
    };
}
const mutableHandlers = {
    get: get,
    set: set
};
const shallowReactiveHandlers = {
    get: shallowGet,
    set: set
};
const readonlyHandlers = extend({
    get: readonlyGet
}, readonlySet);
const shallowReadonlyHandlers = extend({
    get: shallowReadonlyGet
}, readonlySet);

// 根据不同的参数实现不同的功能
const reactiveMap = new WeakMap(); // 对象的key不能是对象，WeakMap弱引用
const readonlyMap = new WeakMap();
const shallowReadonlyMap = new WeakMap();
const shallowReactiveMap = new WeakMap();
function reactive(target) {
    return createReactiveObject(target, mutableHandlers, reactiveMap);
}
function shallowReactive(target) {
    return createReactiveObject(target, shallowReactiveHandlers, shallowReactiveMap);
}
function readonly(target) {
    return createReactiveObject(target, readonlyHandlers, readonlyMap);
}
function shallowReadonly(target) {
    return createReactiveObject(target, shallowReadonlyHandlers, shallowReadonlyMap);
}
function createReactiveObject(target, baseHandlers, proxyMap) {
    // 和vue2一样看一下目标是不是对象
    if (!isObject(target)) {
        return target;
    }
    // 创建代理对象 做缓存，不用重复代理
    const existsProxy = proxyMap.get(target);
    if (existsProxy) {
        return existsProxy;
    }
    const proxy = new Proxy(target, baseHandlers);
    proxyMap.set(target, proxy);
    return proxy;
}

exports.effect = effect;
exports.reactive = reactive;
exports.readonly = readonly;
exports.shallowReactive = shallowReactive;
exports.shallowReadonly = shallowReadonly;
