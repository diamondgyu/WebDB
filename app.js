const express = require('express');
const app = express();
const router =  express.Router();
const mysql = require('mysql2');
const db_info = {
    host: 'localhost',
    port: '3306',
    user: 'root',
    password: '1234',
    database: 'db_test'
};

const sql_connection = mysql.createConnection(db_info);
sql_connection.connect();

sql_connection.query("select * from testtable WHERE student_number=21", (err, result, fields) => {
    if(err) throw err;
    if(result.length > 0) {
        console.log(result);    
    }
})

app.use("/", router);

router.route("/").get((req, res) => {
    res.render("app");
})

app.set("view engine", "ejs");
app.set("views", "./views");  

app.get("/", (req, res) => {
    res.render("app");
})

app.get("/login", (req, res) => {
    res.render("login");
})

app.post("/login", (req, res) => {
    res.send("Login Attempt made");
})

app.get("/signup", (req, res) => {
    res.send("Sign-up Page");
})

app.post("/signup", (req, res) => {
    res.send("Signup Attempt made");
})

app.listen(3000, () => {
    console.log('Server is online');
})