delete from balance;
delete from unfilledtrade;
delete from filledtrade;
delete from stock;
delete from user;

insert into Stock (code, stock_name, price, stocks_total, volume_24h, gain_24h, PER, PBR, debt_ratio) values ("AAPL", "Apple", 214, 3000, 0, 0, 40000, 600000, 130);
insert into Stock (code, stock_name, price, stocks_total, volume_24h, gain_24h, PER, PBR, debt_ratio) values ("MSFT", "Microsoft", 424, 2500, 0, 0, 55000, 600000, 120);
insert into Stock (code, stock_name, price, stocks_total, volume_24h, gain_24h, PER, PBR, debt_ratio) values ("NVDA", "Nvidia", 123, 4000, 0, 0, 65000, 600000, 250);
insert into Stock (code, stock_name, price, stocks_total, volume_24h, gain_24h, PER, PBR, debt_ratio) values ("GOOG", "Google", 164, 2800, 0, 0, 70000, 600000, 130);
insert into Stock (code, stock_name, price, stocks_total, volume_24h, gain_24h, PER, PBR, debt_ratio) values ("AMZN", "Amazon", 196, 2300, 0, 0, 60000, 600000, 130);

insert into user (ID, password, deposit) values ('market', '123', 1000000);

insert into balance (user_id, stock_code, quantity, quantity_avail, price_bought) values ('market', 'AAPL', 1000, 1000, 0);
insert into balance (user_id, stock_code, quantity, quantity_avail, price_bought) values ('market', 'MSFT', 1000, 1000, 0);
insert into balance (user_id, stock_code, quantity, quantity_avail, price_bought) values ('market', 'AMZN', 1000, 1000, 0);
insert into balance (user_id, stock_code, quantity, quantity_avail, price_bought) values ('market', 'NVDA', 1000, 1000, 0);
insert into balance (user_id, stock_code, quantity, quantity_avail, price_bought) values ('market', 'GOOG', 1000, 1000, 0);

insert into filledtrade (trade_id, user_id, stock_code, trade_side, trade_price, trade_quantity, trade_unix_time) values(1, 'market', 'AAPL', 'buy', 214, 1, 1730785169000);
insert into filledtrade (trade_id, user_id, stock_code, trade_side, trade_price, trade_quantity, trade_unix_time) values(2, 'market', 'MSFT', 'buy', 424, 1, 1730785169000);
insert into filledtrade (trade_id, user_id, stock_code, trade_side, trade_price, trade_quantity, trade_unix_time) values(3, 'market', 'NVDA', 'buy', 123, 1, 1730785169000);
insert into filledtrade (trade_id, user_id, stock_code, trade_side, trade_price, trade_quantity, trade_unix_time) values(4, 'market', 'GOOG', 'buy', 164, 1, 1730785169000);
insert into filledtrade (trade_id, user_id, stock_code, trade_side, trade_price, trade_quantity, trade_unix_time) values(5, 'market', 'AMZN', 'buy', 196, 1, 1730785169000);