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
    let orderbook = [];
    await sql_connection.promise().query(`select * from UnfilledTrade where stock_code = '${stockCode}'`)
    .then((result) => {
        // console.log(result[0]);
        // Initialize buy and sell orders objects
        const buyOrders = {};
        const sellOrders = {};

        const buyOrdersDict = {};
        const sellOrdersDict = {};

        // Aggregate quantities for buy and sell orders
        result[0].forEach(order => {
            const price = parseFloat(order.trade_price);
            const quantity = parseInt(order.trade_quantity);
            const filled = parseInt(order.trade_filled);
            if (order.trade_side === "buy") {
                buyOrders[price] = (buyOrders[price] || 0) + quantity-filled;
            } else if (order.trade_side === "sell") {
                sellOrders[price] = (sellOrders[price] || 0) + quantity-filled;
            }
        });

        // console.log(buyOrders);
        // console.log(sellOrders);

        // Convert objects to arrays, sort, and truncate
        const buyOrdersArray = Object.entries(buyOrders)
            .sort((a, b) => b[0] - a[0])  // Sort in descending order
        
        if (slice) {
            var buyOrdersArr = buyOrdersArray.slice(0, 5);
        }

        console.log(slice)

        buyOrdersArr.forEach(([key, value]) => {
            buyOrdersDict[key] = value;
        });

        const sellOrdersArray = Object.entries(sellOrders)
            .sort((a, b) => a[0] - b[0])  // Sort in ascending order
            .slice(0, 5);  // Truncate to 5 entries
        
        if (slice) {
            var sellOrdersArr = sellOrdersArray.slice(0, 5);
        }

        sellOrdersArr.forEach(([key, value]) => {
            sellOrdersDict[key] = value;
        });

        orderbook = {buyOrders: buyOrdersDict, sellOrders: sellOrdersDict};
        // console.log(orderbook);
    
    });

    return orderbook;
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

app.post("/api/deposit", (req, res) => {
    const ID = req.body.ID;
    console.log(ID, req.body.amount);
    sql_connection.query(`select * from User where ID = '${ID}'`, (err, result, fields) => {
        if(err) throw err;
        sql_connection.query(`update User set deposit = ${result[0]['deposit']+req.body.amount} where ID = '${ID}'`, (err, result, fields) => {
            if(err) throw err;
            res.send({result:true, data:result});
        })
    })
})

// return balance, false if balance is empty
app.post("/api/getBalance", (req, res) => {
    const ID = req.body.ID;

    sql_connection.query(`select * from Balance where user_id = '${ID}'`, (err, result, fields) => {
        if(err) throw err;
        if(result.length > 0) {
            res.send({result:true, data:result});
        } else {
            res.send({result:false, data:{}});
        }
    })
})

app.post("/api/getUnfilledOrders", (req, res) => {
    const ID = req.body.ID;

    sql_connection.query(`select * from UnfilledTrade where user_id = '${ID}'`, (err, result, fields) => {
        if(err) throw err;
        if(result.length > 0) {
            res.send({result:true, data:result});
        } else {
            res.send({result:false, data:{}});
        }
    })
})

app.post("/api/getFilledOrders", (req, res) => {
    const ID = req.body.ID;

    sql_connection.query(`select * from FilledTrade where user_id = '${ID}'`, (err, result, fields) => {
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

async function updateBalance(ID, order, stockCode, side, quantity, price) 
{
    console.log('updateBalance: ', ID, order, stockCode, side, quantity, price);
    // const [row, fields] = await sql_connection.promise().query(`select user_id from UnfilledTrade where trade_id = ${order['trade_id']}`)
    // console.log(row);
    const IDOpponent = order['user_id'];
    const [row2, fields2] = await sql_connection.promise().query(`select * from User where ID = '${ID}'`)
    const account_me = row2[0];
    const [row3, fields3] = await sql_connection.promise().query(`select * from User where ID = '${IDOpponent}'`)
    const account_opponent = row3[0];
    const [row4, fields4] = await sql_connection.promise().query(`select * from Balance where user_id='${ID}' and stock_code='${stockCode}'`)//[0][0]
    const balance_me = row4[0];
    const [row5, fields5] = await sql_connection.promise().query(`select * from Balance where user_id='${IDOpponent}' and stock_code='${stockCode}'`)//[0][0]
    const balance_opponent = row5[0];
    if (IDOpponent === ID) return;
    if (side === "buy")
    {
        console.log(IDOpponent);
        console.log(account_me);
        console.log(account_opponent);
        console.log(balance_me);
        console.log(balance_opponent);

        if (!(balance_me === undefined)) // I have the stock: update
        {
            // get updated average price for me
            price_avg = (balance_me['quantity']*balance_me['price_bought'] + quantity*price)/(balance_me['quantity']+quantity)
            // change balance for me
            await sql_connection.promise().query(`update Balance set quantity = ${balance_me['quantity']+quantity}, quantity_avail = ${balance_me['quantity']+quantity}, price_bought = ${price_avg} where user_id = '${ID}' and stock_code = '${stockCode}'`);
            // change balance for the opponent
            if (balance_opponent['quantity']-quantity === 0) // should delete the balance: no balance
            {
                await sql_connection.promise().query(`delete from Balance where user_id = ${IDOpponent} and stock_code = ${stockCode}`);
            }
            else // not now
            {

                await sql_connection.promise().query(`update Balance set quantity = ${balance_opponent['quantity']-quantity}, quantity_avail = ${balance_opponent['quantity']-quantity} where user_id = '${IDOpponent}' and stock_code = '${stockCode}'`);
            }
            // update deposit for two
            await sql_connection.promise().query(`update User set deposit = ${account_me['deposit']-price*quantity} where ID = '${ID}'`)
            await sql_connection.promise().query(`update User set deposit = ${account_opponent['deposit']+price*quantity} where ID = '${IDOpponent}'`)
        }   
        else // I didn't have the stock before: insert
        {
            // add balance for me
            await sql_connection.promise().query(`insert into Balance (user_id, stock_code, quantity, quantity_avail, price_bought) values ('${ID}', '${stockCode}', ${quantity}, ${quantity}, ${price} )`);
            // change balance for the opponent
            if (balance_opponent['quantity']-quantity === 0) // should delete the balance: no balance
            {
                await sql_connection.promise().sql_connection.query(`delete from Balance where user_id = ${IDOpponent} and stock_code = ${stockCode}`);
            }
            else // not now
            {
                // console.log(balance_opponent['quantity'], IDOpponent);
                await sql_connection.promise().query(`update Balance set quantity = ${balance_opponent['quantity']-quantity}, quantity_avail = ${balance_opponent['quantity']-quantity} where user_id = '${IDOpponent}' and stock_code = '${stockCode}'`);
            }
            // update deposit for two
            await sql_connection.promise().query(`update User set deposit = ${account_me['deposit']-price*quantity} where ID = '${ID}'`)
            await sql_connection.promise().query(`update User set deposit = ${account_opponent['deposit']+price*quantity} where ID = '${IDOpponent}'`)
        }
    }
    else // when I sell
    {
        console.log(IDOpponent);
        console.log(account_me);
        console.log(account_opponent);
        console.log(balance_me);
        console.log(balance_opponent);
        if (!(balance_opponent === undefined)) // Opponent has the stock: update
        {
            // get updated average price for the opponent
            price_avg = (balance_opponent['quantity']*balance_opponent['price_bought'] + quantity*price)/(balance_opponent['quantity']+quantity)
            // change balance for opponent
            await sql_connection.promise().query(`update Balance set quantity = ${balance_opponent['quantity']+quantity}, quantity_avail = ${balance_opponent['quantity']+quantity}, price_bought = ${price_avg} where user_id = '${IDOpponent}' and stock_code = '${stockCode}'`);
            // change balance for the opponent
            if (balance_me['quantity']-quantity === 0) // should delete the balance: no balance
            {
                await sql_connection.promise().query(`delete from Balance where user_id = '${ID}' and stock_code = '${stockCode}'`);
            }
            else // not now
            {
                await sql_connection.promise().query(`update Balance set quantity = ${balance_me['quantity']-quantity}, quantity_avail = ${balance_me['quantity']-quantity} where user_id = '${ID}' and stock_code = '${stockCode}'`);
            }
            // update deposit for two
            await sql_connection.promise().query(`update User set deposit = ${account_opponent['deposit']-price*quantity} where ID = '${IDOpponent}'`)
            await sql_connection.promise().query(`update User set deposit = ${account_me['deposit']+price*quantity} where ID = '${ID}'`)
        }   
        else // Opponent doesn't have the stock before: insert
        {
            // change balance for opponent
            await sql_connection.promise().query(`insert into Balance (user_id, stock_code, quantity, quantity_avail, price_bought) values ('${IDOpponent}', '${stockCode}', ${quantity}, ${quantity}, ${price} )`);
            // change balance for the opponent
            if (balance_me['quantity']-quantity === 0) // should delete the balance: no balance
            {
                await sql_connection.promise().query(`delete from Balance where user_id = '${ID}' and stock_code = ${stockCode}`);
            }
            else // not now
            {
                await sql_connection.promise().query(`update Balance set quantity = ${balance_me['quantity']-quantity}, quantity_avail = ${balance_me['quantity']-quantity} where user_id = '${ID}' and stock_code = '${stockCode}'`);
            }
            // update deposit for two
            await sql_connection.promise().query(`update User set deposit = ${account_opponent['deposit']-price*quantity} where ID = '${IDOpponent}'`)
            await sql_connection.promise().query(`update User set deposit = ${account_me['deposit']+price*quantity} where ID = '${ID}'`)
        }
    }
    
}

// POST functions for orders
app.post("/api/makeOrder", async (req, res) => {
    console.log(unfilled_trade_id, filled_trade_id);
    const ID        = req.body.ID;
    const stockCode = req.body.stockCode;
    price     = parseFloat(req.body.price);
    const quantity  = parseInt(req.body.quantity);
    const type      = req.body.type;
    const side      = req.body.side;

    console.log('\n', type, " order: ", ID, stockCode, price, quantity, type, side);

    // get account info
    account_me = await sql_connection.promise().query(`select * from User where ID = '${ID}'`);
    account_me = account_me[0][0];
    balance_me = await sql_connection.promise().query(`select * from Balance where user_id = '${ID}' and stock_code = '${stockCode}'`);
    balance_me = balance_me[0][0];

    // refuse order when balance is too low
    if (side === "buy" && quantity*price > account_me['deposit'])
    {
        console.log("Not enough deposit");
        res.send({success: false, log: "Not enough deposit"});
        return;
    }
    else if (side === "sell" && quantity > balance_me['quantity'])
    {
        console.log("Not enough stock");
        res.send({success: false, log: "Not enough stock"});
        return;
    }

    // var ord = getOrderbook(stockCode);
    if (type === "limit") 
    {
        // buying the stock
        if (side === "buy")
        {
            // get the full list of orders, order by
            // 1. price 2. time
            orders = await sql_connection.promise().query(`select * from UnfilledTrade where stock_code = '${stockCode}' and trade_side = 'sell' order by trade_price asc, trade_unix_time asc;`);
            // console.log('\nBuy order received');
            console.log('Existing Sells: ', orders[0].length);
            quantity_order = quantity;
            
            // change some to normal for loop
            // for const order of orders[0]
            async function process_order(order) {
                order_q = parseInt(order['trade_quantity']);
                order_filled = parseInt(order['trade_filled']);
                if (order['trade_price'] <= price)  // price matches with a buy order
                {
                    if (order_q-order_filled <= quantity_order) 
                    {
                        console.log(order);
                        console.log(order_q-order_filled, quantity_order);
                        sql_connection.query(`delete from UnfilledTrade where trade_id = ${order['trade_id']}`);
                        // as a buyer
                        sql_connection.query(`insert into FilledTrade (trade_id, user_id, stock_code, trade_side, trade_price, trade_quantity, trade_unix_time) values (${filled_trade_id}, '${ID}', '${stockCode}', 'buy', ${price}, ${order_q-order_filled}, '${Date.now()}')`)
                        filled_trade_id += 1
                        // as a seller
                        sql_connection.query(`insert into FilledTrade (trade_id, user_id, stock_code, trade_side, trade_price, trade_quantity, trade_unix_time) values (${filled_trade_id}, '${order['user_id']}', '${stockCode}', 'sell', ${price}, ${order_q-order_filled}, '${Date.now()}')`)
                        filled_trade_id += 1
                        quantity_order = quantity_order - (order_q-order_filled);

                        await updateBalance(ID, order, stockCode, 'buy', order_q-order_filled, order['trade_price']);

                        
                    }
                    // if the remaining quantity in the order book is larger than the quantity of the order
                    else if (order_q-order_filled > quantity_order)
                    {
                        console.log(order);
                        console.log(order_q-order_filled, quantity_order);
                        sql_connection.query(`update UnfilledTrade set trade_filled=${order_filled+quantity_order} where trade_id = ${order['trade_id']}`);
                        // as a buyer: me
                        sql_connection.query(`insert into FilledTrade (trade_id, user_id, stock_code, trade_side, trade_price, trade_quantity, trade_unix_time) values (${filled_trade_id}, '${ID}', '${stockCode}', 'buy', ${price}, ${quantity_order}, '${Date.now()}')`)
                        filled_trade_id += 1
                        // as a seller: limit orderer
                        sql_connection.query(`insert into FilledTrade (trade_id, user_id, stock_code, trade_side, trade_price, trade_quantity, trade_unix_time) values (${filled_trade_id}, '${order['user_id']}', '${stockCode}', 'sell', ${price}, ${quantity_order}, '${Date.now()}')`)
                        filled_trade_id += 1
                        await updateBalance(ID, order, stockCode, 'buy', quantity_order, order['trade_price']);
                        quantity_order = 0;
                        return true;
                    }
                    else if (quantity_order === 0)
                    {
                        return true;
                    }
                }
                else {return true;}
            }

            for (order of orders[0])
            {
                console.log('processing order');
                result = await process_order(order);
                if (result) {break;}
            }

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

            async function process_order(order) 
            {
                var trade_price = parseFloat(order['trade_price']);
                order_q = parseInt(order['trade_quantity']);
                order_filled = parseInt(order['trade_filled']);
                if (trade_price >= price)  // price matches with a buy order
                {
                    console.log('Price match with existing orders');
                    // if the remaining quantity in the order book is less than the quantity of the order
                    if (order_q-order_filled <= quantity_order) 
                    {
                        console.log('scratching the order book: ongoing');
                        console.log(order_q-order_filled, quantity_order);
                        sql_connection.query(`delete from UnfilledTrade where trade_id = ${order['trade_id']}`);
                        // as a seller (me)
                        sql_connection.query(`insert into FilledTrade (trade_id, user_id, stock_code, trade_side, trade_price, trade_quantity, trade_unix_time) values (${filled_trade_id}, '${ID}', '${stockCode}', 'sell', ${price}, ${order_q-order_filled}, '${Date.now()}')`)
                        filled_trade_id += 1
                        // as a buyer
                        sql_connection.query(`insert into FilledTrade (trade_id, user_id, stock_code, trade_side, trade_price, trade_quantity, trade_unix_time) values (${filled_trade_id}, '${order['user_id']}', '${stockCode}', 'buy', ${price}, ${order_q-order_filled}, '${Date.now()}')`)
                        filled_trade_id += 1
                        quantity_order = quantity_order - (order_q-order_filled);
                        await updateBalance(ID, order, stockCode, 'sell', order_q-order_filled, order['trade_price']);
                    }
                    // if the remaining quantity in the order book is larger than the quantity of the order
                    else if (order_q-order_filled > quantity_order)
                    {
                        console.log('scratching the order book: last one');
                        console.log(order_q-order_filled, quantity_order);

                        
                        sql_connection.query(`update UnfilledTrade set trade_filled=${order_filled+quantity_order} where trade_id = ${order['trade_id']}`);
                        // as a seller: me
                        sql_connection.query(`insert into FilledTrade (trade_id, user_id, stock_code, trade_side, trade_price, trade_quantity, trade_unix_time) values (${filled_trade_id}, '${ID}', '${stockCode}', 'sell', ${price}, ${quantity_order}, '${Date.now()}')`)
                        filled_trade_id += 1
                        // as a buyer: limit orderer
                        sql_connection.query(`insert into FilledTrade (trade_id, user_id, stock_code, trade_side, trade_price, trade_quantity, trade_unix_time) values (${filled_trade_id}, '${order['user_id']}', '${stockCode}', 'buy', ${price}, ${quantity_order}, '${Date.now()}')`)
                        filled_trade_id += 1
                        await updateBalance(ID, order, stockCode, 'sell', quantity_order, order['trade_price']);
                        
                        quantity_order = 0;
                        return true;
                    }
                    else if (quantity_order === 0)
                    {
                        return true;
                    }
                }
                else {return true;}
            }

            for (order of orders[0])
            {
                console.log('processing order');
                result = await process_order(order)
                if (result) {break;}
            }

            if (quantity_order > 0 && orders.length > 1)
            {
                // place limit order
                sql_connection.query(`insert into UnfilledTrade (trade_id, user_id, stock_code, trade_side, trade_price, trade_quantity, trade_unix_time, trade_filled) values (${unfilled_trade_id}, '${ID}', '${stockCode}', 'sell', ${price}, ${quantity_order}, '${Date.now()}', 0)`);
                unfilled_trade_id += 1
            }    
        }
        else
        {
            res.send({success: false, log: "Invalid order side"}); // res.send("Invalid order side");
        }
        // res.send("Order placed");
        
    } 
    else if (type === "market") 
    {
        
        // buying the stock
        if (side === "buy")
        {
            price = 1000000;
            // get the full list of orders, order by
            // 1. price 2. time
            orders = await sql_connection.promise().query(`select * from UnfilledTrade where stock_code = '${stockCode}' and trade_side = 'sell' order by trade_price asc, trade_unix_time asc;`)
            balance = await sql_connection.promise().query(`select * from Balance where user_id='${ID}' and stock_code='${stockCode}'`)
            total_quotes = await sql_connection.promise().query(`select sum(trade_quantity) from UnfilledTrade where stock_code = '${stockCode}' and trade_side = 'sell'`)
            if (total_quotes[0][0]['sum(trade_quantity)'] < quantity) 
            {
                res.send({success: false, log: "Not enough quotes to buy"});
                return false;
            }
            // console.log('\nBuy order received');
            console.log('Existing Sells: ', orders[0].length);
            quantity_order = quantity;

            async function process_order(order) 
            {
                var trade_price = parseFloat(order['trade_price']);
                order_q = parseInt(order['trade_quantity']);
                order_filled = parseInt(order['trade_filled']);
                order_price = parseFloat(order['trade_price']);
                if (order['trade_price'] <= price)  // price matches with a buy order
                {
                    if (order_q-order_filled <= quantity_order) 
                    {
                        // opponent = await sql_connection.promise().query(`select * from User where ID=${order['user_id']}`);
                        console.log(order);
                        console.log(order_q-order_filled, quantity_order);
                        sql_connection.query(`delete from UnfilledTrade where trade_id = ${order['trade_id']}`);
                        // as a buyer
                        sql_connection.query(`insert into FilledTrade (trade_id, user_id, stock_code, trade_side, trade_price, trade_quantity, trade_unix_time) values (${filled_trade_id}, '${ID}', '${stockCode}', 'buy', ${order['trade_price']}, ${order_q-order_filled}, '${Date.now()}')`)
                        filled_trade_id += 1
                        // as a seller
                        sql_connection.query(`insert into FilledTrade (trade_id, user_id, stock_code, trade_side, trade_price, trade_quantity, trade_unix_time) values (${filled_trade_id}, '${order['user_id']}', '${stockCode}', 'sell', ${order['trade_price']}, ${order_q-order_filled}, '${Date.now()}')`)
                        filled_trade_id += 1
                        quantity_order = quantity_order - (order_q-order_filled);

                        await updateBalance(ID, order, stockCode, 'buy', order_q-order_filled, order['trade_price']);
                    }
                    // if the remaining quantity in the order book is larger than the quantity of the order
                    else if (order_q-order_filled > quantity_order)
                    {
                        console.log(order);
                        console.log(order_q-order_filled, quantity_order);
                        
                        // update trade
                        sql_connection.query(`update UnfilledTrade set trade_filled=${order_filled+quantity_order} where trade_id = ${order['trade_id']}`);
                        // as a buyer: me
                        sql_connection.query(`insert into FilledTrade (trade_id, user_id, stock_code, trade_side, trade_price, trade_quantity, trade_unix_time) values (${filled_trade_id}, '${ID}', '${stockCode}', 'buy', ${order['trade_price']}, ${quantity_order}, '${Date.now()}')`)
                        filled_trade_id += 1
                        // as a seller: limit orderer
                        sql_connection.query(`insert into FilledTrade (trade_id, user_id, stock_code, trade_side, trade_price, trade_quantity, trade_unix_time) values (${filled_trade_id}, '${order['user_id']}', '${stockCode}', 'sell', ${order['trade_price']}, ${quantity_order}, '${Date.now()}')`)
                        filled_trade_id += 1

                        console.log(quantity_order)

                        await updateBalance(ID, order, stockCode, 'buy', quantity_order, order['trade_price']);
                        
                        quantity_order = 0;
                        return true;
                    }
                    else if (quantity_order === 0)
                    {
                        return true;
                    }
                }
                else {return true;}
            }

            for (order of orders[0])
            {
                console.log('processing order');
                result = await process_order(order)
                if (result) {break;}
            }

            if (quantity_order > 0 && orders.length > 1)
            {
                // place limit order
                sql_connection.query(`insert into UnfilledTrade (trade_id, user_id, stock_code, trade_side, trade_price, trade_quantity, trade_unix_time, trade_filled) values (${unfilled_trade_id}, '${ID}', '${stockCode}', 'buy', ${price}, ${quantity_order}, '${Date.now()}', 0)`);
                unfilled_trade_id += 1
            }            
        }
        else if (side === "sell")
        {
            price = 0;
            // get the full list of orders, order by
            // 1. price 2. time
            orders = await sql_connection.promise().query(`select * from UnfilledTrade where stock_code = '${stockCode}' and trade_side = 'buy' order by trade_price desc, trade_unix_time asc;`)
            balance = await sql_connection.promise().query(`select * from Balance where user_id='${ID}' and stock_code='${stockCode}'`)
            total_quotes = await sql_connection.promise().query(`select sum(trade_quantity) from UnfilledTrade where stock_code = '${stockCode}' and trade_side = 'buy'`)
            if (total_quotes[0][0]['sum(trade_quantity)'] < quantity) 
            {
                res.send({success: false, log: "Not enough quotes to sell"});
                return false;
            }
            // console.log('\nSell order received');
            console.log('Existing Buys: ', orders[0].length);
            quantity_order = quantity;
            unfilled_trade_id += 1;

            // console.log(orders)

            async function process_order(order) 
            {
                var trade_price = parseFloat(order['trade_price']);
                var order_q = parseInt(order['trade_quantity']);
                var order_filled = parseInt(order['trade_filled']);
                if (quantity_order === 0) return true;
                if (trade_price >= price)  // price matches with a buy order
                {
                    console.log('Price match with existing orders');
                    // if the remaining quantity in the order book is less than the quantity of the order
                    if (order_q-order_filled <= quantity_order) 
                    {
                        console.log('scratching the order book: ongoing');
                        console.log(order_q-order_filled, quantity_order);
                        
                        

                        sql_connection.query(`delete from UnfilledTrade where trade_id = ${order['trade_id']}`);
                        // as a seller (me)
                        sql_connection.query(`insert into FilledTrade (trade_id, user_id, stock_code, trade_side, trade_price, trade_quantity, trade_unix_time) values (${filled_trade_id}, '${ID}', '${stockCode}', 'sell', ${order['trade_price']}, ${order_q-order_filled}, '${Date.now()}')`)
                        filled_trade_id += 1
                        // as a buyer
                        sql_connection.query(`insert into FilledTrade (trade_id, user_id, stock_code, trade_side, trade_price, trade_quantity, trade_unix_time) values (${filled_trade_id}, '${order['user_id']}', '${stockCode}', 'buy', ${order['trade_price']}, ${order_q-order_filled}, '${Date.now()}')`)
                        filled_trade_id += 1
                        quantity_order = quantity_order - (order_q-order_filled);
                        await updateBalance(ID, order, stockCode, 'sell', order_q-order_filled, order['trade_price']);
                        
                    }
                    // if the remaining quantity in the order book is larger than the quantity of the order
                    else if (order_q-order_filled > quantity_order)
                    {
                        console.log('scratching the order book: last one');
                        console.log(order_q-order_filled, quantity_order);
                        sql_connection.query(`update UnfilledTrade set trade_filled=${order_filled+quantity_order} where trade_id = ${order['trade_id']}`);
                        // as a seller: me
                        sql_connection.query(`insert into FilledTrade (trade_id, user_id, stock_code, trade_side, trade_price, trade_quantity, trade_unix_time) values (${filled_trade_id}, '${ID}', '${stockCode}', 'sell', ${order['trade_price']}, ${quantity_order}, '${Date.now()}')`)
                        filled_trade_id += 1
                        // as a buyer: limit orderer
                        sql_connection.query(`insert into FilledTrade (trade_id, user_id, stock_code, trade_side, trade_price, trade_quantity, trade_unix_time) values (${filled_trade_id}, '${order['user_id']}', '${stockCode}', 'buy', ${order['trade_price']}, ${quantity_order}, '${Date.now()}')`)
                        filled_trade_id += 1
                        await updateBalance(ID, order, stockCode, 'sell', quantity_order, order['trade_price']);
                        quantity_order = 0;
                        return true;
                    }
                    else if (quantity_order === 0)
                    {
                        return true;
                    }
                }
                else {return true;}
            }

            for(order of orders[0]) 
            {
                result = await process_order(order);
                if (result) break;
            }

            if (quantity_order > 0 && orders.length > 1)
            {
                // place limit order
                sql_connection.query(`insert into UnfilledTrade (trade_id, user_id, stock_code, trade_side, trade_price, trade_quantity, trade_unix_time, trade_filled) values (${unfilled_trade_id}, '${ID}', '${stockCode}', 'sell', ${price}, ${quantity_order}, '${Date.now()}', 0)`);
                unfilled_trade_id += 1
            }    
        }
        else
        {
            res.send({success: false, log: "Invalid order side"});
        }
    } else {
        res.send({success: false, log: "Invalid order type"});
    }

    res.send({success: true, log:"Order placed"});
});

app.post("/api/cancelOrder", (req, res) => {
    const ID = req.body.ID;
    const trade_id = req.body.trade_id;
    sql_connection.query(`delete from UnfilledTrade where trade_id = ${trade_id} and user_id = '${ID}'`, (err, result, fields) => {
        if (err) 
        {
            console.log(err);
            res.send({success: false, log: err});
        }
        else
        {
            res.send({success: true, log:"Order cancelled"});
        }
    });
    
});

app.post("/api/getOrderbook", async (req, res) => {  
    orderbook = await getOrderbook(req.body.stockCode, true);  
    console.log(orderbook);
    res.send(orderbook);
});

app.post("")

app.listen(3000, () => {
    console.log('Server is online');
})