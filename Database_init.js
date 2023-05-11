const mysql = require('mysql2')
const express = require('express')
const app = express()

const client = mysql.createConnection({
    host: '127.0.0.1',
    user: 'root',
    database: 'CampusCart',
    password: ''
},(error,vv)=>{
    console.log(vv);
})


app.get('/about',(req, res)=>{
    

})
app.get('/submit',(req, res)=>{


})
app.listen(3000)

