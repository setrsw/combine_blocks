const dotenv = require('dotenv');

result=dotenv.config();  // 配置.ENV中的变量到process.env

module.exports= {
    Auth: process.env.NOTION_KEY,
    DATABASE_ID: process.env.NOTION_DATABASE_ID,
    URL: process.env.URL,
    PORT: process.env.PORT,
};