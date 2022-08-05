const {createPage, getPagesItem, copyPageTitle, copyPageContent, getPaperInfo, updatePageProperty} = require('./component')
const {getCurrentTime} = require('./util')
const Koa = require('koa')
const bodyParser = require('koa-bodyparser');
const fs = require('fs')
const config = require('./config')

const app = new Koa()
app.use(bodyParser)
const Router = require('koa-router')

let update = new Router()

update.get('/update',async (ctx) => {
    const body = ctx.request.body
    await updatePageProperty(body.page_id)
    console.log(body)
})

let router = new Router()

router.use('/update',update.routes(),update.allowedMethods())

app.use(router.routes()).use(router.allowedMethods())


// const propreties = {
//     name: "Using Bandit Algorithms for Project Selection in Cross-Project Defect Prediction",
//     dates: ['2022-08-05'],
//     year: '2021',
//     type: [],
//     domain: ['CPDP']
// }

// updatePageProperty('aa915458e6d14dbcb385450275a0ad35')
// createPage(propreties)
// async function main(){
//     const newPageId = await createItem(getCurrentTime())
//     const pages =await getPagesItem()
//     for(const page of pages){
//         const oldPageId = page.id
//         await copyPageTitle(newPageId,oldPageId)
//         await copyPageContent(newPageId,oldPageId)
//     }
// }
// main()

/*
TODO：
    列表分级 api 还需要进行编码
    图片加载存在问题，导入值之后，url为空值（已放弃，等后续搭建自己的图床或者官方开放服务）
    重新转换思路，做一些别的工作
    之前工作重心在combine——pages
    如今，换成：
        + 1、功能性：新建文件或者说论文（page）时，自动查询并填充其他属性内容 (doing)
        + 2、部署：构建运行流程
* */

app.listen(config.PORT,()=>{
    console.log('Running!')
})