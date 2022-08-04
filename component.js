const {Client} = require('@notionhq/client')

const config = require('./config')
const download = require('download')
const fs = require('fs')

const axios = require('axios')

const csv = require('csvtojson')

const notion = new Client({ auth: config.Auth })

const {generatorMultiSelect,generatorParent,generatorSelector,generatorDate,generatorName,generatorRichText} = require('./object')

const databaseId = config.DATABASE_ID
const publisher = ["IEEE", "ACM"]
/**
 * TODO:
 *     + 为函数添加相关描述
 *
 * TODO:
 *     + 整合addItem、addTitle、appendTitle
 *     + 把parent、properties等属性进行解构、重构，转换成参数形式
 **/
async function addItem(Name,dates,type,year,domain) {
    const pageInfo = {
        "parent": generatorParent(databaseId),
        "properties": {
            //标题
            "Name": generatorName(content),
            //会议/期刊
            "_~ZV": generatorMultiSelect(type)
            },
            //发表年份
            "IKZu": generatorSelector(year),
            //领域
            "%5D_%3Dh": generatorMultiSelect(domain),
            //date，即工作时间范围
            "Date": generatorDate(dates),
    }
    try {
        const response = await notion.pages.create(pageInfo);
        console.log("Success! Entry added.")
        return response.id
    } catch (error) {
        console.error(error.body)
    }
}

//合并pages
async function combinePages(pages){
    // console.log('pages---',pages)
    for(const page of pages){
        // console.log('page---',page)
        const pageId = page.id
        // console.log(pageId)
        const propertyId = "title"
        const content = await notion.pages.properties.retrieve({
            page_id: pageId,
            property_id: propertyId
        });

        children.push({
            "object": "block",
            "heading_2": generatorRichText(content.results[0].title.text.content)
        })
    }
    return children
}

/**
 *  TODO:
 *      + 动态设定时间参数
 *      + 优化代码结构，filter部分进行组件化设置
 *
**/
//查询数据库中上一周观看的page
async function queryDatabase(){
    try{
        const response = await notion.databases.query({
            database_id: databaseId,
            filter:{
                or:[{
                    property: "Date",
                    date: {
                        past_week: {}
                    }
                },{
                    and:[{
                        property: "Date",
                        date: {
                            // past_week: {}
                            on_or_after: "2022-07-12",
                        }
                    },{
                        property: "Date",
                        date: {
                            // past_week: {}
                            on_or_before: "2022-07-18"
                        }
                    }
                    ]}
                ]}
        })
        return response.results
    }catch (response) {
        console.error(response)
        return response
    }
}

async function getPagesItem(){
    return queryDatabase()
}
/**
 * 获取当前时间 格式：yyyy-MM-dd
 */
function getCurrentTime() {
    var date = new Date();//当前时间
    var month = zeroFill(date.getMonth() + 1);//月
    var day = zeroFill(date.getDate());//日

    //当前时间
    return date.getFullYear() + "-" + month + "-" + day;
}

/**
 * 补零
 */
function zeroFill(i){
    if (i >= 0 && i <= 9) {
        return "0" + i;
    } else {
        return i;
    }
}
async function appendTitle(newPageId,oldPageId){
    const propertyId = "title"
    const content = await notion.pages.properties.retrieve({
        page_id: oldPageId,
        property_id: propertyId
    });

    const children = [{
        "heading_2": generatorRichText(content.results[0].title.text.content)
    }]
    await appendBlockChildren(newPageId, children)
}
async function appendPage(newPageId,oldPageId){
    const blocks = await getBlockChildren(oldPageId)
    for(let i =0; i<blocks.length; i++){
        const block = blocks[i]
        // console.log(block)
        const blockId = block.id
        const blockType = block.type
        const children = []
        if(blockType === "image" || blockType === "file"){
            const url = block[blockType].file.url
            await downloadFile(url,'tmp')
            children.push({
                [blockType]: {
                    "external": {
                        "url": block[blockType].file.url
                    }
                },
            })
        }
        else{
            children.push({
                [blockType]: block[blockType]
            })
        }
        await appendBlockChildren(newPageId, children)
        if(block.has_children)
            await appendPage(newPageId,blockId)
    }
}
//在block中添加children，也可以适用于添加page信息
async function appendBlockChildren(blockId,children){
    const response = await notion.blocks.children.append({
        block_id: blockId,
        children: children
    })
    // console.log(response)
}

async function updatePageproperty(pageId){
    const paperTitle = await notion.pages.properties.retrieve({
        page_id: pageId,
        property_id: "title"
    }).then((response)=>{
        console.log(response.results[0].title)
        return response.results[0].title.text.content
    });
    let time = []
    time.push(getCurrentTime())
    const paperInfo = await getPaperInfo(paperTitle)
    const response = await notion.pages.update({
        page_id: pageId,
        "properties": {
            //会议/期刊
            "_~ZV": generatorMultiSelect(paperInfo.types),
            //发表年份
            "IKZu":generatorSelector(paperInfo.year),

            //date，即工作时间范围
            "Date": generatorDate(time)
        },
    })
}

async function getBlockChildren(blockId){
    const response = await notion.blocks.children.list({
        block_id: blockId,
        page_size: 50,
    });
    return response.results
}
/**
 *  TODO：
 *      + 下载功能还没完成
 **/
async function downloadFile(url,dirname){
    const res = await download(url,dirname)

}
async function upload(url, pageId){
    const children = []
    children.push({
        "image": {
            "external": {
                "url": url
            }
        },
    })
    appendBlockChildren(pageId,children)
}
// upload('https://mailscuteducn-my.sharepoint.com/personal/se_tangrun_mail_scut_edu_cn/Documents/737385.jpg','8d043b69fdda4993ac9937ec32358248')
// console.log(downloadFile('https://pic3.zhimg.com/v2-759158f80982b4d9db1b934e3714acb2_b.jpg','tempDownload'))
//
// async function getPageRecursively(blockId,has_children){
//     const response = await notion.blocks.children.list({
//         block_id: blockId,
//         page_size: 50,
//     });
//     const results = response.results
//     for(const block in results){
//         if(has_children){
//             getPageRecursively(block.id)
//         }
//     }
// }

// addItem("Yurts in Big Sur, California")
// queryDatabase()
// combinePages(queryDatabase())

// const promise = new Promise(()=>{
//     const newPageId = addItem(getCurrentTime())
//     return newPageId
// }).then((newPageId)=>{
//     console.log(newPageId)
//     const pages = getPagesItem()
//     for(const page in pages){
//         console.log(page)
//         const oldPageId = page.id
//         new Promise(appendPage(newPageId,oldPageId))
//     }
// })
function getAbbr(venueName){
    if(venueName===venueName.toUpperCase())
        return venueName
    else {
        let result = ""
        let temp = venueName.split(' ')
        console.log(temp)
        for(let str of temp){
            if(!publisher.includes(str))
                result+=`${str.charAt(0)}`
        }
        console.log(result)
        return result.length>1 ? result : temp[1]
    }
}
async function getCcfClass(venueInfo){
    let ccf_class = ""
    await csv().fromFile('./data/ccf_catalog.csv').then((venues)=>{
        for(const venue of venues){
            if(venue.abbr === venueInfo ){
                ccf_class = "CCF-"+`${venue.class}`
                break
            }
        }
    })
    console.log(ccf_class)
    return ccf_class
}

async function getPaperInfo(paper){
    //api并不稳定：'https://dblp.org/search/publ/api'
    const info = await axios.get('https://dblp.uni-trier.de/search/publ/api',{
        params:{
            q : paper,
            format : "json"
        },
        headers:{
           'User-Agent' :'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/39.0.2171.71 Safari/537.36'
        }
    }).then(async (response)=>{
        const result = response.data.result.hits
        // console.log(result)
        let info = {}
        if(result.hit){
            for(let i=0;i<result.hit.length;i++){
                console.log(result.hit[i].info.title.split('.')[0],'---',paper)
                if(result.hit[i].info.title.split('.')[0] === paper){
                    const paperInfo =result.hit[i].info
                    // console.log(paperInfo)
                    info = {
                        title: paperInfo.title.split('.')[0],
                        year : paperInfo.year,
                        venue: getAbbr(paperInfo.venue),
                        type : paperInfo.type.includes('Conference')?"会议":"期刊",
                    }
                }
            }
        }
        return info
    }).then(async (info)=>{
        info.ccf_class = await getCcfClass(info.venue)
        console.log(info)
        return info
    }).then((info)=>{
        info.types = [info.venue,info.type,info.ccf_class]
        return info
    })
    return info
}

module.exports ={
    appendPage,
    appendTitle,
    appendBlockChildren,
    addItem,
    combinePages,
    queryDatabase,
    getAbbr,
    getPaperInfo,
    getCcfClass,
    getBlockChildren,
    getPagesItem,
    getCurrentTime,
    upload,
    updatePageproperty,
    downloadFile
}