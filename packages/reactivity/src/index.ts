// 如果使用相对路径进行打包，那么当前模块在打包的时候回将这个shared打包到自己模块里
// import {VueShare} from "../../shared/src/index";
// monorepo 能组织两个模块之间的关系，可以互相依赖

// import {VueShare} from "@vue/shared" // 如果直接引用其他模块，会出现找不到

export {
    reactive,
    shallowReactive,
    readonly,
    shallowReadonly
} from './reactive'

export {
    effect
} from './effect'

export {
    ref,
    toRef,
    toRefs,
    shallowRef
} from './ref'
