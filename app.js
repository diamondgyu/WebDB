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

// sql_connection.query("delete from User where ID = 'undefined' or ID = ''", (err, result, fields) => {});

// sql_connection.query("select * from Stock", (err, result, fields) => {
//     if(err) throw err;
//     if(result.length > 0) {
//         console.log(result);
//     }
// })

// Express session
app.use(session({
    secret: 'your secret key',
    resave: false,
    saveUninitialized: false
  }));

// Set EJS engine
app.set("view engine", "ejs");
app.set("views", "./views"); 

// Use BodyParser
app.use(express.json());
app.use(express.urlencoded({extended:true}));

var filled_trade_id = 0;
var unfilled_trade_id = 0;

async function getTradeID() {
    filled_trade_id = await sql_connection.promise().query("select max(trade_id) from FilledTrade;");
    filled_trade_id[0][0]['max(trade_id)'] === null ? filled_trade_id = 0 : filled_trade_id = filled_trade_id[0][0]['max(trade_id)']+1;
    unfilled_trade_id = await sql_connection.promise().query("select max(trade_id) from UnfilledTrade;");
    unfilled_trade_id[0][0]['max(trade_id)'] === null ? unfilled_trade_id = 0 : unfilled_trade_id = unfilled_trade_id[0][0]['max(trade_id)']+1;
    console.log('trade IDs: ',filled_trade_id , unfilled_trade_id);
}

getTradeID();

// console.log("trade_id: ", filled_trade_id, unfilled_trade_id);

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
    res.render('list');
})

app.get("/myPage", (req, res) => {
    res.render('mypage');
})

app.get("/trade", (req, res) => {
    res.render('trade');
})

app.get("/test", (req, res) => {
    res.render('test');
})

async function getOrderbook(stockCode, slice) {
    return sql_connection.promise().query(`select * from UnfilledTrade where stock_code = '${stockCode}'`)
    .then((result) => {
        // console.log(result[0]);
        // Initialize buy and sell orders objects
        const buyOrders = {};
        const sellOrders = {};

        // Aggregate quantities for buy and sell orders
        result[0].forEach(order => {
            const price = parseFloat(order.trade_price);
            const quantity = order.trade_quantity;
            if (order.trade_side === "buy") {
                buyOrders[price] = (buyOrders[price] || 0) + quantity;
            } else if (order.trade_side === "sell") {
                sellOrders[price] = (sellOrders[price] || 0) + quantity;
            }
        });

        console.log(buyOrders);
        console.log(sellOrders);

        // Convert objects to arrays, sort, and truncate
        const buyOrdersArray = Object.entries(buyOrders)
            .sort((a, b) => b[0] - a[0])  // Sort in descending order
        
        if (slice) {
            buyOrdersArray = buyOrdersArray.slice(0, 5);
        }

        const sellOrdersArray = Object.entries(sellOrders)
            .sort((a, b) => a[0] - b[0])  // Sort in ascending order
            .slice(0, 5);  // Truncate to 5 entries
        
        if (slice) {
            sellOrdersArray = sellOrdersArray.slice(0, 5);
        }

        var allOrders = {buyOrders: buyOrdersArray, sellOrders: sellOrdersArray};
        // console.log(allOrders)
    
        return allOrders;
    });
}

app.get("/api/getStocks", (req, res) => {
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

// POST functions for orders
app.post("/api/makeOrder", async (req, res) => {
    console.log(unfilled_trade_id, filled_trade_id);
    const ID        = req.body.ID;
    const stockCode = req.body.stockCode;
    const price     = req.body.price;
    const quantity  = req.body.quantity;
    const type      = req.body.type;
    const side      = req.body.side;

    console.log('\n', type, " order: ", ID, stockCode, price, quantity, type, side);

    // var ord = getOrderbook(stockCode);
    if (type === "limit") 
    {
        // orderbook = await getOrderbook(stockCode, false);
        // console.log(orderbook);
        // console.log("waiting");

        // buying the stock
        if (side === "buy")
        {
            // get the full list of orders, order by
            // 1. price 2. time
            orders = await sql_connection.promise().query(`select * from UnfilledTrade where stock_code = '${stockCode}' and trade_side = 'sell' order by trade_price asc, trade_unix_time asc;`)
            // console.log('\nBuy order received');
            console.log('Existing Sells: ', orders[0].length);
            quantity_order = quantity;

            orders[0].some(order => {
                if (order['trade_price'] <= price)  // price matches with a buy order
                {
                    if (order['trade_quantity']-order['trade_filled'] <= quantity_order) 
                    {
                        console.log(order);
                        console.log(order['trade_quantity']-order['trade_filled'], quantity_order);
                        sql_connection.query(`delete from UnfilledTrade where trade_id = ${order['trade_id']}`);
                        // as a buyer
                        sql_connection.query(`insert into FilledTrade (trade_id, user_id, stock_code, trade_side, trade_price, trade_quantity, trade_unix_time) values (${filled_trade_id}, '${ID}', '${stockCode}', 'buy', ${price}, ${order['trade_quantity']-order['trade_filled']}, '${Date.now()}')`)
                        filled_trade_id += 1
                        // as a seller
                        sql_connection.query(`insert into FilledTrade (trade_id, user_id, stock_code, trade_side, trade_price, trade_quantity, trade_unix_time) values (${filled_trade_id}, '${order['user_id']}', '${stockCode}', 'sell', ${price}, ${order['trade_quantity']-order['trade_filled']}, '${Date.now()}')`)
                        filled_trade_id += 1
                        quantity_order = quantity_order - (order['trade_quantity']-order['trade_filled']);
                    }
                    else if (order['trade_quantity']-order['trade_filled'] > quantity_order)
                    {
                        console.log(order);
                        console.log(order['trade_quantity']-order['trade_filled'], quantity_order);
                        sql_connection.query(`update UnfilledTrade set trade_filled=${order['trade_filled']+quantity_order} where trade_id = ${order['trade_id']}`);
                        // as a buyer: me
                        sql_connection.query(`insert into FilledTrade (trade_id, user_id, stock_code, trade_side, trade_price, trade_quantity, trade_unix_time) values (${filled_trade_id}, '${ID}', '${stockCode}', 'buy', ${price}, ${quantity_order}, '${Date.now()}')`)
                        filled_trade_id += 1
                        // as a seller: limit orderer
                        sql_connection.query(`insert into FilledTrade (trade_id, user_id, stock_code, trade_side, trade_price, trade_quantity, trade_unix_time) values (${filled_trade_id}, '${order['user_id']}', '${stockCode}', 'sell', ${price}, ${quantity_order}, '${Date.now()}')`)
                        filled_trade_id += 1
                        return true;
                    }
                    else if (quantity_order === 0)
                    {
                        return true;
                    }
                }
                else {return true;}
            });

            if (quantity_order > 0 && orders.length > 1)
            {
                // place limit order
                sql_connection.query(`insert into UnfilledTrade (trade_id, user_id, stock_code, trade_side, trade_price, trade_quantity, trade_unix_time, trade_filled) values (${unfilled_trade_id}, '${ID}', '${stockCode}', 'buy', ${price}, ${quantity_order}, '${Date.now()}', 0)`);
                unfilled_trade_id += 1
            }            
        }
        else if (side === "sell")
        {
            // get the full list of orders, order by
            // 1. price 2. time
            orders = await sql_connection.promise().query(`select * from UnfilledTrade where stock_code = '${stockCode}' and trade_side = 'buy' order by trade_price desc, trade_unix_time asc;`)
            // console.log('\nSell order received');
            console.log('Existing Buys: ', orders[0].length);
            quantity_order = quantity;
            unfilled_trade_id += 1;

            // console.log(orders)

            orders[0].some(order => {
                var trade_price = parseFloat(order['trade_price']);
                console.lo
                if (trade_price >= price)  // price matches with a buy order
                {
                    console.log('Price match with existing orders');
                    // if the remaining quantity in the order book is less than the quantity of the order
                    if (order['trade_quantity']-order['trade_filled'] <= quantity_order) 
                    {
                        console.log('scratching the order book: ongoing');
                        console.log(order['trade_quantity']-order['trade_filled'], quantity_order);
                        sql_connection.query(`delete from UnfilledTrade where trade_id = ${order['trade_id']}`);
                        // as a seller (me)
                        sql_connection.query(`insert into FilledTrade (trade_id, user_id, stock_code, trade_side, trade_price, trade_quantity, trade_unix_time) values (${filled_trade_id}, '${ID}', '${stockCode}', 'sell', ${price}, ${order['trade_quantity']-order['trade_filled']}, '${Date.now()}')`)
                        filled_trade_id += 1
                        // as a buyer
                        sql_connection.query(`insert into FilledTrade (trade_id, user_id, stock_code, trade_side, trade_price, trade_quantity, trade_unix_time) values (${filled_trade_id}, '${order['user_id']}', '${stockCode}', 'buy', ${price}, ${order['trade_quantity']-order['trade_filled']}, '${Date.now()}')`)
                        filled_trade_id += 1
                        quantity_order = quantity_order - (order['trade_quantity']-order['trade_filled']);
                    }
                    // if the remaining quantity in the order book is larger than the quantity of the order
                    else if (order['trade_quantity']-order['trade_filled'] > quantity_order)
                    {
                        console.log('scratching the order book: last one');
                        console.log(order['trade_quantity']-order['trade_filled'], quantity_order);
                        sql_connection.query(`update UnfilledTrade set trade_filled=${order['trade_filled']+quantity_order} where trade_id = ${order['trade_id']}`);
                        // as a seller: me
                        sql_connection.query(`insert into FilledTrade (trade_id, user_id, stock_code, trade_side, trade_price, trade_quantity, trade_unix_time) values (${filled_trade_id}, '${ID}', '${stockCode}', 'sell', ${price}, ${quantity_order}, '${Date.now()}')`)
                        filled_trade_id += 1
                        // as a buyer: limit orderer
                        sql_connection.query(`insert into FilledTrade (trade_id, user_id, stock_code, trade_side, trade_price, trade_quantity, trade_unix_time) values (${filled_trade_id}, '${order['user_id']}', '${stockCode}', 'buy', ${price}, ${quantity_order}, '${Date.now()}')`)
                        filled_trade_id += 1
                        quantity_order = 0;
                        return true;
                    }
                    else if (quantity_order === 0)
                    {
                        return true;
                    }
                }
                else {return true;}
            });

            if (quantity_order > 0 && orders.length > 1)
            {
                // place limit order
                sql_connection.query(`insert into UnfilledTrade (trade_id, user_id, stock_code, trade_side, trade_price, trade_quantity, trade_unix_time, trade_filled) values (${unfilled_trade_id}, '${ID}', '${stockCode}', 'sell', ${price}, ${quantity_order}, '${Date.now()}', 0)`);
                unfilled_trade_id += 1
            }    
        }
        else
        {
            res.send("Invalid order side");
        }
        // 2. place the remaining order in UnfilledTrade
    } 
    // else if (type === "market") 
    // {

    // } else {
    //     res.send("Invalid order type");
    // }
});

app.post("/api/cancelOrder", (req, res) => {
    const ID = req.body.ID;
});

app.post("/api/getOrderbook", (req, res) => {    
    const stockCode = req.body.stockCode;
    sql_connection.query(`select * from UnfilledTrade where stock_code = '${stockCode}'`, (err, result, fields) => {
        if(err) throw err;
        res.send(result);
    })
});

app.post("")

app.listen(3000, () => {
    console.log('Server is online');
})