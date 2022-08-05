const {getCurrentTime} = require('./util')

/**
 * @description 用于生成page的parent数据
 * @param {string} database_id 数据库的id
 * @return {Object} page的parent数据
 **/
function generatorParent(database_id){
    return {
        "type": "database_id",
        "database_id": database_id
    }
}

/**
 * @description 用于生成page的Name属性
 * @param {string} content title的文本内容
 * @return {Object} page的title数据
 **/
function generatorName(content){
    return {
        "type" : "title",
        "title": [
            {
                "type": "text",
                "text": {
                    "content": `${content}`
                }
            }
        ]
    }
}

/**
 * @description 用于生成page的RichText数据
 * @param {string} content title的文本内容
 * @return {Object} page的RichText数据
 * **/
function generatorRichText(content){
    return {
        "rich_text": [
            {
                "text": {
                    "content": `${content}`,
                },
            },
        ],
        "color": "default"
    }
}

/**
 * @description 用于生成page的Seletor属性
 * @param {string} name seletor的name内容
 * @return {Object} page的Seletor数据
 **/
function generatorSelector(name){
    return {
            "select": {
            "name": `${name}`
        }
    }
}

/**
 * @description 用于生成page的Seletor属性
 * @param {Array.<string>} multi_selectors title的文本内容
 * @return {Object} page的Seletor数据
 **/
function generatorMultiSelect(multi_selectors){
    let multi_select = []
    multi_selectors.forEach((selector)=>{
        multi_select.push({name:selector})
    })
    return {multi_select}
}
/**
 * TODO：
 *      参数格式未进行校验匹配
 **/
/**
 * @description 用于生成page的Seletor属性
 * @param {Array.<string>} dates 多个date值，分别为start，end
 * @return {Object} page的Date数据
 **/
function generatorDate(dates){
    let elements = ['start' , 'end']
    let min = Math.min(elements.length,dates.length)
    let date = {}
    for(let i = 0; i< min; i++)
        date[elements[i]]=dates[i]
    if(min===0){
        date.push({
            [elements[0]]:getCurrentTime()
        })}
    return {date}
}
// let name = 'test'
// let elements = ['1']
//
// console.log(generatorMultiSelect(elements))
//
// console.log(generatorParent(name))
// console.log(generatorSelector(name))
// console.log(generatorName(name))
// console.log(generatorDate(elements))

module.exports = {
    generatorSelector,
    generatorParent,
    generatorName,
    generatorDate,
    generatorMultiSelect,
    generatorRichText
}