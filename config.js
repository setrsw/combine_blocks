const dotenv = require('dotenv');

const result=dotenv.config();  // 配置.ENV中的变量到process.env

module.exports= {
    Auth: process.env.NOTION_KEY,
    DATABASE_ID: process.env.NOTION_DATABASE_ID,
    PORT: process.env.PORT || 10000,
};