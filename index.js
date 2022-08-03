const {addItem, getPagesItem, appendTitle, appendPage} = require('./component')

getPaperInfo("Software Defect Prediction via Convolutional Neural Network")


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
    图片加载存在问题，导入值之后，url为空值
    重新转换思路，做一些别的工作
    之前工作重心在combine——pages
    如今，换成：
    1、新建文件或者说论文（page）时，自动查询并填充其他属性内容
* */