function generatorParent(database_id){
    return {
        "type": "database_id",
        "database_id": database_id
    }
}

function generatorName(content){
    return {
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
function generatorSelector(name){
    return {
            "select": {
            "name": `${name}`
        }
    }
}

function generatorMultiSelect(multi_selectors){
    let multi_select = []
    multi_selectors.forEach((selector)=>{
        multi_select.push({name:selector})
    })
    return {multi_select}
}
/**
 * params：
 *      dates：Array
 * TODO：
 *      参数格式未匹配
 **/
function generatorDate(dates){
    let elements = ['start' , 'end']
    let min = Math.min(elements.length,dates.length)
    let data = {}
    for(let i = 0; i< min; i++)
        data[elements[i]]=dates[i]
    return {data}
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