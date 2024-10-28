const express = require('express');
const app = express();

// Set MySQL connection
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

sql_connection.query("select * from testtable", (err, result, fields) => {
    if(err) throw err;
    if(result.length > 0) {
        console.log(result);    
    }
})

// Set EJS engine
app.set("view engine", "ejs");
app.set("views", "./views"); 

// Use BodyParser
app.use(express.json());
app.use(express.urlencoded({extended:true}));

app.get("/", (req, res) => {
    res.render('app');
})

app.get("/login", (req, res) => {
    res.render('login');
})

app.post("/login", (req, res) => {
    const {userID, userPassword} = req.body;
    sql_connection.query("select * from testtable where name=? and student_number=?", [userID, userPassword], (err, result, fields) => {
        if(err) throw err;
        if(result.length > 0) {
            console.log(result);
            res.send("Login success");
        }
        else {
            res.render("login", {loginResult:"failed"});
        }
    })
})

app.get("/signup", (req, res) => {
    res.render('signup');
})
app.post("/signup", (req, res) => {
    const {userID, userPassword} = req.body;
    // console.log(userID, userPassword);
    sql_connection.query("select * from testtable where name=?", [userID], (err, result, fields) => {
        if(err) throw err;
        if(result.length > 0) {
            console.log(result);
            res.send("ID already exists");
        }
        else {
            sql_connection.query("insert into testtable(name, student_number) values(?, ?)", [userID, userPassword], (err, result, fields) => {
                if(err) throw err;
                res.send("Sign up success");
            })
        }
    })
})

app.listen(3000, () => {
    console.log('Server is online');
})