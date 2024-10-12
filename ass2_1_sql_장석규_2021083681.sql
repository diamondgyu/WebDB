drop database if exists DB_2021083681;
create database DB_2021083681;
use DB_2021083681;

CREATE TABLE User (
    ID VARCHAR(255) PRIMARY KEY,
    password VARCHAR(255) NOT NULL,
    deposit INT NOT NULL -- no decimal point required for KRW
);

CREATE TABLE Stock (
    code VARCHAR(10) PRIMARY KEY,
    stock_name VARCHAR(255) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    market_cap DECIMAL(15, 2) NOT NULL,
    volume_24h DECIMAL(15, 2) NOT NULL,
    gain_24h DECIMAL(10, 2) NOT NULL,
    PER DECIMAL(10, 2) NOT NULL,
    PBR DECIMAL(10, 2) NOT NULL,
    debt_ratio DECIMAL(10, 2) NOT NULL
);

CREATE TABLE Balance (
    user_id INT,
    stock_code VARCHAR(10),
    quantity INT NOT NULL,
    quantity_avail INT NOT NULL,
    price_bought DECIMAL(10, 2) NOT NULL,
    PRIMARY KEY (user_id, stock_code),
    FOREIGN KEY (user_id) REFERENCES User(ID),
    FOREIGN KEY (stock_code) REFERENCES Stock(code)
);

CREATE TABLE FilledTrade (
    trade_id INT PRIMARY KEY,
    user_id VARCHAR(255),
    stock_code VARCHAR(10),
    trade_side VARCHAR(10) NOT NULL,
    trade_price DECIMAL(10, 2) NOT NULL,
    trade_quantity INT NOT NULL,
    trade_unix_time TIMESTAMP NOT NULL,
    FOREIGN KEY (user_id) REFERENCES User(ID),
    FOREIGN KEY (stock_code) REFERENCES Stock(code)
);

CREATE TABLE UnfilledTrade (
    trade_id INT PRIMARY KEY,
    user_id VARCHAR(255),
    stock_code VARCHAR(10),
    trade_side VARCHAR(10) NOT NULL,
    trade_price DECIMAL(10, 2) NOT NULL,
    trade_quantity INT NOT NULL,
    trade_unix_time TIMESTAMP NOT NULL,
    trade_filled INT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES User(ID),
    FOREIGN KEY (stock_code) REFERENCES Stock(code)
);