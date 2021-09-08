var VueReactivity = (function (exports) {
    'use strict';

    const isObject = (val) => typeof val === 'object' && val !== null;
    const isArray = Array.isArray;
    const extend = Object.assign;
    // 判断属性是不是原型属性
    const hasOwn = (target, key) => Object.prototype.hasOwnProperty.call(target, key);
    const hasChanged = (oldValue, value) => oldValue !== value;
    const isInteger = (key) => parseInt(key) + '' === key + '';

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
            console.log('依赖收集', key);
        }
        // 制作一个依赖收集的关联列表
    }
    function trigger(target, key, value, type) {
        console.log(target, key, value, type);
        const depsMap = targetMap.get(target);
        if (!depsMap)
            return; // 没有收集过 直接跳过
        // 为了实现批处理 我们把所有的effect放到一个set中，做一下去重
        const effectsQueue = new Set();
        const add = (effectsToAdd) => {
            if (effectsToAdd)
                effectsToAdd.forEach(effect => effectsQueue.add(effect));
        };
        // 如果修改的是数组 并且改的是长度 要做一些处理
        if (isArray(target) && key === 'length') {
            // value 是数组长度 depsMap 存放key 可能是索引 如果索引大于数组长度 修改触发更新
            depsMap.forEach((dep, depKey) => {
                if (depKey === 'length' || value < depKey) {
                    add(dep);
                }
            });
        }
        else {
            if (type === 'add') { // 表示辛新增逻辑，触发更新 触发length更新
                if (isArray(target) && isInteger(key)) {
                    add(depsMap.get('length'));
                }
                else { // 对象新增逻辑
                    add(depsMap.get(key));
                }
            }
            else {
                const effects = depsMap.get(key); // 找到此属性对应的effect列表，直接执行
                add(effects);
            }
        }
        effectsQueue.forEach((effect) => {
            if (effect.options.scheduler) {
                effect.options.scheduler(effect);
            }
            else {
                effect();
            }
        });
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
            let oldValue = target[key];
            // 如果是新增也要触发更新
            let hadKey = isArray(target) && isInteger(key) ? key < target.length : hasOwn(target, key);
            // 触发视图更新
            let res = Reflect.set(target, key, value, receiver); // target[key] = value
            if (!hadKey) { // 新增逻辑
                trigger(target, key, value, 'add');
            }
            else if (hasChanged(oldValue, value)) {
                trigger(target, key, value, 'set'); // 触发这个对象上的属性，让他更新
            }
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

    function ref(value) {
        return createRef(value);
    }
    function shallowRef(value) {
        return createRef(value, true);
    }
    const convert = val => isObject(val) ? reactive(val) : val;
    class RefImpl {
        rewValue;
        isShallow;
        _value;
        constructor(rewValue, isShallow) {
            this.rewValue = rewValue;
            this.isShallow = isShallow;
            this._value = isShallow ? rewValue : convert(rewValue); // this._value 就是一个私有属性
        }
        get value() {
            track(this, 'get', 'value');
            return this._value;
        }
        set value(newValue) {
            if (hasChanged(newValue, this.rewValue)) {
                this.rewValue = newValue; // 属性变化， 需要更新
                this._value = this.isShallow ? newValue : convert(newValue);
                trigger(this, 'value', newValue, 'set');
            }
        }
    }
    function createRef(value, isShallow = false) {
        return new RefImpl(value, isShallow);
    }
    class ObjectRefImpl {
        target;
        key;
        constructor(target, key) {
            this.target = target;
            this.key = key;
        }
        get value() {
            return this.target[this.key];
        }
        set value(newValue) {
            this.target[this.key] = newValue;
        }
    }
    function toRef(target, key) {
        return new ObjectRefImpl(target, key);
    }

    exports.effect = effect;
    exports.reactive = reactive;
    exports.readonly = readonly;
    exports.ref = ref;
    exports.shallowReactive = shallowReactive;
    exports.shallowReadonly = shallowReadonly;
    exports.shallowRef = shallowRef;
    exports.toRef = toRef;

    Object.defineProperty(exports, '__esModule', { value: true });

    return exports;

}({}));
