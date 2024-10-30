const express = require('express');
const session = require('express-session');
const flash = require('connect-flash');
const app = express();

// Set MySQL connection
const mysql = require('mysql2');
const db_info = {
    host: 'localhost',
    port: '3306',
    user: 'root',
    password: '1234',
    database: 'db_2021083681'
};

const sql_connection = mysql.createConnection(db_info);
sql_connection.connect();

sql_connection.query("delete from User where ID = 'undefined' or ID = ''", (err, result, fields) => {});

sql_connection.query("select * from User", (err, result, fields) => {
    if(err) throw err;
    if(result.length > 0) {
        console.log(result);
    }
})

// Express session
app.use(session({
    secret: 'your secret key',
    resave: false,
    saveUninitialized: false
  }));

// Flash
app.use(flash());

// set messages
app.use((req, res, next) => {
    res.locals.messages = req.flash();
    next();
  });

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

app.get("/signup", (req, res) => {
    res.render('signup');
})

app.get("/list", (req, res) => {
    res.render('list', {stockData:[]});
})

app.get("/getStocks", (req, res) => {
    sql_connection.query("select * from Stock", (err, result, fields) => {
        if(err) throw err;
        res.send(result);
    })
})

app.post("/api/user", (req, res) => {
    const ID = req.body.ID;
    const password = req.body.password;

    sql_connection.query(`select * from User where ID = '${ID}' and password = '${password}'`, (err, result, fields) => {
        if(err) throw err;
        if(result.length > 0) {
            res.send({result:true, data:result});
        } else {
            res.send({result:false, data:{}});
        }
    })
})

app.post("/api/checkIDExists", (req, res) => {
    const ID = req.body.ID;

    sql_connection.query(`select * from User where ID = '${ID}'`, (err, result, fields) => {
        if(err) throw err;
        console.log(result);
        console.log(result.length)
        if(result.length > 0) {
            console.log(result.length)
            res.send({result:true, verbose:"ID already exists."});
        } else {
            res.send({result:false, verbose:"ID does not exist."});
        }
    })
})

app.post("/api/signup", (req, res) => {
    const ID = req.body.ID;
    const password = req.body.password;

    sql_connection.query(`insert into User (ID, password, deposit) values ('${ID}', '${password}', 0)`, (err, result, fields) => {
        if(err) throw err;
        if(result.affectedRows > 0) {
            res.send({result:true, verbose:"Sign-up succeeded."});
        } else {
            res.send({result:false, verbose:"Failed to sign-up."});
        }
    })
})

app.post("/api/list", (req, res) => {
    res.send({result:true, data:[]});
})

app.post("/api/stock", (req, res) => {
    res.send({result:true, data:[]});
})


app.listen(3000, () => {
    console.log('Server is online');
})