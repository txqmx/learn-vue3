## Vue3 和 Vue2的区别

- Vue3最主要的特点就是小和快
- 移除了vue2中不常用的内容 过滤器，组件，vue3可以按需打包借助了rollup可以支持函数的treeshaking能力 提供了一些新增的组件，只兼容vue2的核心api（不考虑ie的兼容性）
- 快 proxy （defineProperty 递归和重写属性，proxy天生的拦截器，不需要重写属性，不用一上来就默认递归）

- 整体的架构发生了变化（采用monorepo 可以分层，一个项目中维护多个项目，可以利用项目中的某个部分）

- vue3对编译时的内容进行了重写 template 增加了很多逻辑 -> render函数，静态标记了属性标记，patchFlag动态标记（比较哪些元素包含哪些属性 class， style，动态属性，指令） 静态提升，函数的缓存，vue3使用了最长子序列重写diff算法，使用了vue3模板内部有一个概念叫blockTree，如果你使用jsx不会得到模板的优化，可以在写jsx的时候自己标记

- vue3完全采用了ts来进行重构 对ts兼容性非常好，采用函数的方式对ts的推断是非常好的
- CompositionApi vue3的亮点（逻辑分类-最终组合） optionsApi 分数逻辑

```
"buildOptions": {
    "name": "VueShared",
    "formats": [
      "cjs", // module.exports
      "esm-bundler", // export default
      "global" // window.xxx
    ]
  }
```
