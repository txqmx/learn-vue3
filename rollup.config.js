let path = require('path')
let ts = require('rollup-plugin-typescript2')
let resolvePlugin = require('@rollup/plugin-node-resolve').default
let packagesDir = path.resolve(__dirname, 'packages')
const name = process.env.TARGET
const packageDir = path.resolve(packagesDir, name)

const currentResolve = (p) => path.resolve(packageDir, p)

// 需要拿到package.json的内容
const pkg = require(currentResolve('package.json'))

// 读取自己设定的对象
const options = pkg.buildOptions

const outputConfig = {
    'cjs':{
        file: currentResolve(`dist/${name}.cjs.js`),
        format: 'cjs'
    },
    'global':{
        file: currentResolve(`dist/${name}.global.js`),
        format: 'iife'
    },
    'esm-bundler':{
        file: currentResolve(`dist/${name}.esm-bundler.js`),
        format: 'esm'
    }
}

// rollup的配置可以返回一个数组
function createConfig(output){
    output.name = options.name
    return {
        input: currentResolve('src/index.ts'),
        output,
        plugins:[
            ts({ // 打包时调用ts的配置文件
                tsconfig: path.resolve(__dirname, 'tsconfig.json')
            }),
            resolvePlugin()
        ]
    }
}
export default options.formats.map(f => {
    return createConfig(outputConfig[f])
})
