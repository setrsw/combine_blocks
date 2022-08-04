const {addItem, getPagesItem, appendTitle, appendPage, getPaperInfo, updatePageproperty} = require('./component')

updatePageproperty('cbcf3bee8d20442c9fdf5e6341f9aa06')

async function main(){
    const newPageId = await addItem(getCurrentTime())
    const pages =await getPagesItem()
    for(const page of pages){
        const oldPageId = page.id
        await appendTitle(newPageId,oldPageId)
        await appendPage(newPageId,oldPageId)
    }
}
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