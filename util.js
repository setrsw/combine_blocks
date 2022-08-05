/**
 * @description 获取当前时间
 * @return {string} - string：yyyy-MM-dd
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
 * @private
 */

function zeroFill(i){
    if (i >= 0 && i <= 9) {
        return "0" + i;
    } else {
        return i;
    }
}

module.exports = {getCurrentTime}