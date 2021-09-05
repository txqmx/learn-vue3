const fs = require('fs')
const execa = require('execa') // 单独开启一个进程进行打包
// 读取文件夹的目录
const target = 'reactivity' // 在开发的时候 我们可以指定打包具体是哪一个模块，只有npm run build 时才需要对packages下的所有模块进行打包

async function build(target){
    return execa('rollup', ['-c', '--environment', 'TARGET:'+target],{stdio:'inherit'}) // 表示子进程中的输出结果会输出到父进程中
}

build(target)
