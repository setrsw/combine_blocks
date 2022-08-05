const {Client} = require('@notionhq/client')

const config = require('./config')
const download = require('download')
const fs = require('fs')

const axios = require('axios')

const csv = require('csvtojson')

const notion = new Client({ auth: config.Auth })

const {generatorMultiSelect,generatorParent,generatorSelector,generatorDate,generatorName,generatorRichText} = require('./object')
const {getCurrentTime} = require('./util')
const database_id = config.DATABASE_ID
const publisher = ["IEEE", "ACM"]

/**
 * TODO:
 *     + 为函数添加相关描述
 *
 * TODO:
 *     + 整合createItem、copyPageTitle
 *     + 把parent、properties等属性进行解构、重构，转换成参数形式
 **/
/**
 * @description 创建
 * @param {Object} property - 创建的page属性
 * @param {string} property.name - page的title
 * @param {string=} property.year - page发表年份
 * @param {Array.<string>=} property.dates - page时间范围
 * @param {Array.<string>=} property.type - page所属会议/期刊种类
 * @param {Array.<string>=} property.domain - page所属领域
 * @returns {string} - 新创建的page_id
 **/
async function createPage(property) {
    const page_info = {
        "parent": generatorParent(database_id),
        "properties": {
            //标题
            "Name": generatorName(property.name),
            //会议/期刊
            "_~ZV": generatorMultiSelect(property.type) ,
            //发表年份
            "IKZu": generatorSelector(property.year),
            //领域
            "%5D_%3Dh": generatorMultiSelect(property.domain),
            //date，即工作时间范围
            "Date":generatorDate(property.dates) ,
        },
    }
    console.log(page_info)
    try {
        const response = await notion.pages.create(page_info);
        console.log("Success! Entry added.")
        return response.id
    } catch (error) {
        console.error(error.body)
    }
}

/**
 * @description 将old_page的title以heading_2的形式复制到new_page
 * @param {string} new_page_id - new_page
 * @param {string} old_page_id - old_page
 **/
async function copyPageTitle(new_page_id, old_page_id){
    const property_id = "title"
    const content = await notion.pages.properties.retrieve({
        page_id: old_page_id,
        property_id: property_id
    });

    const children = [{
        "heading_2": generatorRichText(content.results[0].title.text.content)
    }]
    await appendBlockChildren(new_page_id, children)
}

/**
 * @description 复制old_page的内容到new_page
 * @param {string} new_page_id - new_page
 * @param {string} old_page_id -old_page
 **/
async function copyPageContent(new_page_id, old_page_id){
    const blocks = await getBlockChildren(old_page_id)
    for(let i =0; i<blocks.length; i++){
        const block = blocks[i]
        // console.log(block)
        const block_id = block.id
        const block_type = block.type
        const children = []
        if(block_type === "image" || block_type === "file"){
            const url = block[block_type].file.url
            await downloadFile(url,'tmp')
            children.push({
                [block_type]: {
                    "external": {
                        "url": block[block_type].file.url
                    }
                },
            })
        }
        else{
            children.push({
                [block_type]: block[block_type]
            })
        }
        await appendBlockChildren(new_page_id, children)
        if(block.has_children)
            await copyPageContent(new_page_id,block_id)
    }
}

/**
 * TODO：
 *      + 动态设置时间参数
 * @description 获取database中指定日期的pages，目前指定日期为前一周
 * @returns {Array.<Object>} - page数组
 *
**/
//查询数据库中上一周观看的page
async function queryDatabase(){
    try{
        const response = await notion.databases.query({
            database_id: database_id,
            filter:{
                or:[{
                    property: "Date",
                    date: {
                        past_week: {}
                    }
                },
                // },{
                //     and:[{
                //         property: "Date",
                //         date: {
                //             // past_week: {}
                //             on_or_after: "2022-07-12",
                //         }
                //     },{
                //         property: "Date",
                //         date: {
                //             // past_week: {}
                //             on_or_before: "2022-07-18"
                //         }
                //     }
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

//在block中添加children，也可以适用于添加page信息
/**
 * @description 在block中添加children，也可以适用于添加page的content信息
 * @param {string} block_id - 被添加的block_id
 * @param {Array.<Object>} children - 需要添加的block块信息
 **/
async function appendBlockChildren(block_id,children){
    const response = await notion.blocks.children.append({
        block_id: block_id,
        children: children
    })
    // console.log(response)
}

/**
 * @description 获取page的title属性
 * @param {string} page_id
 * @returns {string}
 **/
async function getPaperTitle(page_id){
    return await notion.pages.properties.retrieve({
        page_id: page_id,
        property_id: "title"
    }).then((response) => {
        console.log(response.results[0].title)
        return response.results[0].title.text.content
    })
}
/**
 *
 *  @description 更新 page的特定属性值,适用于新建page时，根据title名字自动查找并更新 会议/期刊、 发表年份、 时间范围 的值
 *  @param {string} page_id
 **/
async function updatePageProperty(page_id){
    const paper_title =await getPaperTitle(page_id)
    let time = []
    time.push(getCurrentTime())
    const paper_info = await getPaperInfo(paper_title)
    // console.log(paper_info)
    const properties= {
        //会议/期刊
        "_~ZV": generatorMultiSelect(paper_info.types),
        //发表年份
        "IKZu": generatorSelector(paper_info.year),

        //date，即工作时间范围
        "Date": generatorDate(time)
    }
    console.log(properties)
    const response = await notion.pages.update({
        page_id: page_id,
        properties : properties
    })
}

/**
 * @description 获取特定block块的下一级block块信息
 * @param {string} block_id
 * @returns {Array.<Object>} - 下一级block块的信息，以数组形式返回
 **/
async function getBlockChildren(block_id){
    const response = await notion.blocks.children.list({
        block_id: block_id,
        page_size: 50,
    });
    return response.results
}


/**
 * @description 下载文件到指定文件夹中
 * @param {string} url - 文件链接
 * @param {string} dirname - 文件夹名称
 *  TODO:
 *      + 下载功能还没完成
 **/
async function downloadFile(url,dirname){
    const res = await download(url,dirname)

}

/**
 * @description 插入图片到指定page块中
 * @param {string} url - 图片链接，要求是图床链接，目前不支持notion内部图床链接
 * @param {string} page_id - 特定page的id
 **/
async function uploadImage(url, page_id){
    const children = []
    children.push({
        "image": {
            "external": {
                "url": url
            }
        },
    })
    appendBlockChildren(page_id,children)
}

/**
 * @description 生成 期刊/论文 名称缩写
 * @param {string} venue_name - 期刊/论文名称
 * @returns {string} 期刊/论文 名称缩写
 **/
function getAbbr(venue_name){
    if(venue_name===venue_name.toUpperCase())
        return venue_name
    else {
        let result = ""
        let temp = venue_name.split(' ')
        console.log(temp)
        for(let str of temp){
            if(!publisher.includes(str))
                result+=`${str.charAt(0)}`
        }
        console.log(result)
        return result.length>1 ? result : temp[1]
    }
}

/**
 * @description 生成 期刊/论文 ccf等级
 * @param {string} venue_info - 期刊/论文名称
 * @returns {string} 期刊/论文 ccf等级
 **/
async function getCcfClass(venue_info){
    let ccf_class = ""
    await csv().fromFile('./data/ccf_catalog.csv').then((venues)=>{
        for(const venue of venues){
            if(venue.abbr === venue_info ){
                ccf_class = "CCF-"+`${venue.class}`
                break
            }
        }
    })
    console.log(ccf_class)
    return ccf_class
}

/**
 * @description - 用于生成给定论文的信息
 * @param {string} paper_title - 论文名称
 * @returns {Object}
 *  {
 *     title: {string}
 *     year : {string}
 *     venue: {string}
 *     type : {string}
 *     type : {Array.<string>}
 *  }
 *  论文的相关信息
 *
 **/
async function getPaperInfo(paper_title){
    console.log('---',paper_title)
    //api并不稳定：'https://dblp.org/search/publ/api'
    const info = await axios.get('https://dblp.uni-trier.de/search/publ/api',{
        params:{
            q : paper_title,
            format : "json"
        },
        headers:{
           'User-Agent' :'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/39.0.2171.71 Safari/537.36'
        }
    }).then(async (response)=>{
        const result = response.data.result.hits
        console.log(result)
        let info = {}
        if(result.hit){
            for(let i=0;i<result.hit.length;i++){
                console.log(result.hit[i].info.title.split('.')[0],'---',paper_title)
                if(result.hit[i].info.title.split('.')[0] === paper_title){
                    const paper_info =result.hit[i].info
                    console.log(paper_info)
                    info = {
                        title: paper_info.title.split('.')[0],
                        year : paper_info.year,
                        venue: getAbbr(paper_info.venue),
                        type : paper_info.type.includes('Conference')?"会议":"期刊",
                    }
                }
            }
        }
        return info
    }).then(async (info)=>{
        info.ccf_class = await getCcfClass(info.venue)
        // console.log(info)
        return info
    }).then((info)=>{
        info.types = [info.venue,info.type,info.ccf_class]
        return info
    })
    return info
}

module.exports ={
    copyPageContent,
    copyPageTitle,
    appendBlockChildren,
    createPage,
    queryDatabase,
    getAbbr,
    getPaperInfo,
    getCcfClass,
    getBlockChildren,
    getPagesItem,
    getCurrentTime,
    uploadImage,
    updatePageProperty,
    downloadFile
}