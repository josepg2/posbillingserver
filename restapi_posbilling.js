const path = require('path');
const knex = require('knex')({
    client: "sqlite3",
    connection: {
        //filename: path.join('C:\\Users\\George Joseph\\AppData\\Roaming\\posbilling-system\\storage', "posbillingsystem.sqlite").toString()
        filename: path.join('C:\\Users\\George_Joseph02', "posbillingsystem.sqlite").toString()
        //filename : path.join(dataPath, "testdatabase.sqlite").toString()
    },
    useNullAsDefault: true
});
const dateFormat = require('dateformat');
const express = require('express');
const app = express();

dateFormat.masks.knexdate = 'yyyy-mm-dd" "hh:MM:ss"';

var bodyParser = require('body-parser');
app.use(bodyParser.json());

app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});



app.get('/', (req, res) => res.send('Hello World!'));
app.get('/api/storeid', (req, res) => {
    knex('storeid')
        .select()
        .then(response => {
            res.status(200).json(response[0]);
        })
})
app.get('/api/inventory', getInventory)
app.post('/api/item', addToInventory)
app.post('/api/itemedit', editInventory)
app.post('/api/itemremove', removeInventory);

app.get('/api/bill', getBill)
app.get('/api/billitems', getBillItems)
app.post('/api/newbill', addToBill)

app.get('/api/tax', getTax)

app.get('/api/category', getCategory)
app.post('/api/category', addToCategory)

app.get('/api/offers', getOffers)

app.get('/api/users', getUsers)

createTables();

function getUsers(req, res, next){
    knex('users')
        .select()
        .then(response => {
            res.status(200).json(response);
        })
        .catch(error => {
            res.status(200).json({status : 'failed'});
        })
}

function getOffers(req, res, next){
    knex('offers')
      .select('offerid', 'name', 'type', 'value')
      .then(response => {
          res.status(200).json(response);
      })
      .catch(error => {
          res.status(200).json({status : 'failed'});
      })
}

function getCategory(req, res, next){
    knex('category')
      .select('id', 'name')
      .then(response => {
          res.status(200).json(response);
      })
      .catch(error => {
          res.status(200).json({status : 'failed'});
      })
}

function addToCategory(req, res, next){
    let data = req.body;
    knex('category')
        .insert([{
            name : data.name,
            count: 0
        }])
        .then(response => {
            return knex('category')
                .select()
        })
        .then(response => {
            res.status(200).json(response);
        })
        .catch(error => {
            res.status(200).json({error : error});
        })
}

function getTax(req, res, next){
    knex('taxes')
      .select('taxid', 'taxname', 'taxvalue')
      .then(response => {
          res.status(200).json(response);
      })
      .catch(error => {
          res.status(200).json({status : 'failde'});
      })
}

function getBillItems(req, res, next) {
    knex('salesitems')
        .where("billid", req.query.billid)
        .select('prodid', 'prodname', 'quantity', 'tax', 'offvalue', 'unitprice')
        .then(response => {
            res.status(200).json(response);
        })
        .catch(error => {
            req.status(200).json({status: 'error'});
        })
}

function getBill(req, res, next){
    knex('sales')
        .whereNot("created_at" , "<", req.query.dateFrom)
        .andWhereNot("created_at" , ">", req.query.dateTo)
        .select()
        .then(response => {
            for (let i = 0; i < response.length; i++) {
                response[i].created_at = response[i].created_at + ' UTC';
                response[i].items = [];
            }
            res.status(200).json(response);
        })
        .catch(error => {
            res.status(200);
        })
}

function getInventory(req, res, next) {
    knex('inventory')
        .where('isremoved', false)
        .select()
        .then(function (response) {
            for (let i = 0; i < response.length; i++) {
                response[i].isremoved = !!+response[i].isremoved;
                response[i].created_at = response[i].created_at + ' UTC';
                response[i].updated_at = response[i].updated_at + ' UTC';
            }
            res.status(200).json(response);
            next();
        });
}

function addToInventory(req, res, next) {
    let data = req.body;
    knex('inventory')
        .insert({
            "prodid": data.prodid,
            "prodname": data.prodname,
            "proddisc": data.proddisc,
            "isremoved": false,
            "stock": data.stock,
            "unitprice": data.unitprice,
            "category": data.category,
            "tax": data.tax,
            "hasoff": data.hasoff,
            "offtype": data.offtype,
            "offvalue": data.offvalue,
            "updated_by": "gj"
        }).then(function (response) {
            return knex('inventory')
                .where("prodid", data.prodid)
                .select("id")
        })
        .then(response => {
            return knex('storeid')
                .where("key", "storeidkey")
                .update("prodid", response[0].id)
        })
        .then(function (response) {
            console.log(response);
            data.status = 'ok';
            res.send(data);
        })
        .catch(function (error) {
            console.log(error);
            data.status = 'error';
            data.error = error.Error;
            res.send(data);
        })
}

function editInventory(req, res, next) {
    let data = req.body;
    knex('inventory')
        .where("prodid", data.prodid)
        .update({
            "prodname": data.prodname,
            "proddisc": data.proddisc,
            "isremoved": false,
            "stock": data.stock,
            "unitprice": data.unitprice,
            "category": data.category,
            "tax": data.tax,
            "hasoff": data.hasoff,
            "offtype": data.offtype,
            "offvalue": data.offvalue,
            "updated_by": "gj",
            "updated_at": knex.fn.now()
        })
        .then(response => {
            console.log(response);
            data.status = 'ok';
            res.send(data);
        })
        .catch(error => {
            data.error = error.Error;
            data.status = 'error';
            res.send(data);
        })
}

function removeInventory(req, res, next) {
    let data = req.body;
    knex('inventory')
        .where("prodid", data.prodid)
        .update({
            "isremoved": true,
            "updated_at": knex.fn.now()
        })
        .then(response => {
            console.log(response);
            data.status = 'ok';
            res.send(data);
        })
        .catch(error => {
            data.error = error.Error;
            data.status = 'error';
            res.send(data);
        })
}

function addToBill(req, res, next) {
    let bill = req.body;
    let arrSales = [];
    let arrInventory = [];
    knex('sales')
        .insert({
            "billid": bill.billid,
            "tax": bill.tax,
            "offvalue": bill.offvalue,
            "total": bill.total,
            "created_by": "gj"
        })
        .then(response => {
            return knex('storeid')
                .where("key", "storeidkey")
                .increment('billid', 1)
        })
        .then(response => {
            bill.items.forEach(item => {
                arrSales.push(
                    knex('salesitems')
                    .insert({
                        "billid": bill.billid,
                        "prodid": item.prodid,
                        "prodname": item.prodname,
                        "quantity": item.quantity,
                        "unitprice": item.unitprice,
                        "tax": item.tax,
                        "offvalue": item.offvalue
                    })
                )
            })
            return Promise.all(arrSales);
        })
        .then(response => {
            bill.items.forEach(item => {
                arrInventory.push(
                    knex('inventory')
                    .where("prodid", item.prodid)
                    .decrement("stock", item.quantity)
                )
            })
            return Promise.all(arrInventory);
        })
        .then(response => {
            console.log(response);
            res.status(200).json(response);
        })
}

function createTables() {

    knex.schema.hasTable('storeid')
        .then(function (exists) {
            if (!exists) {
                return knex.schema.createTable('storeid', function (table) {
                    table.increments();
                    table.string("key");
                    table.integer("prodid");
                    table.integer("billid");
                    table.integer("puchaseid");
                    table.timestamp("updated_at").defaultTo(knex.fn.now());
                });
            }
        })
        .then((response) => {
            if (response) {
                return knex('storeid')
                    .insert({
                        key: "storeidkey"
                    })
            }
        })
        .catch((error) => {
            console.log(error);
        });

    knex.schema.hasTable('inventory')
        .then(function (exists) {
            if (!exists) {
                return knex.schema.createTable('inventory', function (table) {
                    table.increments("id");
                    table.string("prodid", 5);
                    table.string("prodname");
                    table.string("proddisc");
                    table.boolean("isremoved");
                    table.integer("stock");
                    table.float("unitprice", 9, 2);
                    table.integer("category");
                    table.integer("tax");
                    table.integer("hasoff");
                    table.string("offtype");
                    table.float("offvalue", 9, 2);
                    table.string("updated_by");
                    table.timestamps(false, true);
                    table.unique("prodid");
                });
            }
        })
        .then(response => {
            if (response) {
                return knex('inventory')
                    .insert({
                        "prodid": "1"
                    })
            }
        })
        .then(response => {
            if (response) {
                return knex('inventory')
                    .where("prodid", "1")
                    .select("id")
            }
        })
        .then(response => {
            if (response) {
                return knex('storeid')
                    .where("key", "storeidkey")
                    .update("prodid", response[0].id)
            }
        })
        .then(response => {
            if (response) {
                return knex('inventory')
                    .where("prodid", "1")
                    .del()
            }
        })
        .catch(error => {
            console.log(error);
        })

    knex.schema.hasTable('users').then(function (exists) {
        if (!exists) {
            return knex.schema.createTable('users', function (table) {
                table.increments();
                table.string("username");
                table.string("password");
                table.boolean("isadmin");
                table.boolean("canedit");
                table.timestamp("created_at").defaultTo(knex.fn.now());
            });
        }
    })
    .then(response => {
        if(response) {
            return knex('users')
                .insert([{
                    username : 'admin',
                    password : 'admin',
                    isadmin  : true,
                    canedit  : true
                }])
        }
    })
    .catch(error => {
        console.log(error);
    })

    knex.schema.hasTable('sales').then(function (exists) {
        if (!exists) {
            return knex.schema.createTable('sales', function (table) {
                    table.increments('id');
                    table.string("billid");
                    table.float("tax");
                    table.float("offvalue");
                    table.float("total");
                    table.string("created_by");
                    table.timestamp("created_at").defaultTo(knex.fn.now());
                })
                .then(response => {
                    if (response) {
                        return knex('sales')
                            .insert({
                                "billid": "1"
                            })
                    }
                })
                .then(response => {
                    if (response) {
                        return knex('sales')
                            .where("billid", "1")
                            .select("id")
                    }
                })
                .then(response => {
                    if (response) {
                        return knex('storeid')
                            .where("key", "storeidkey")
                            .update("billid", response[0].id)
                    }
                })
                .then(response => {
                    if (response) {
                        return knex('sales')
                            .where("billid", "1")
                            .del()
                    }
                })
                .catch(error => {
                    console.log(error);
                })
        }
    });

    knex.schema.hasTable('salesitems')
        .then(function (exists) {
            if (!exists) {
                return knex.schema.createTable('salesitems', function (table) {
                    table.increments();
                    table.string("billid");
                    table.string("prodid");
                    table.string("prodname");
                    table.integer("quantity");
                    table.float("unitprice");
                    table.float("tax");
                    table.float("offvalue");
                })
            }
        })

    knex.schema.hasTable('taxes')
        .then(function (exists) {
            if (!exists) {
                return knex.schema.createTable('taxes', function (table) {
                    table.increments('taxid');
                    table.string("taxname");
                    table.integer("taxvalue");
                    table.timestamp("updated_at").defaultTo(knex.fn.now());
                });
            }
        });

    knex.schema.hasTable('category')
        .then(function (exists) {
            if (!exists) {
                return knex.schema.createTable('category', function (table) {
                    table.increments('id');
                    table.string("name");
                    table.integer("count");
                    table.timestamp("updated_at").defaultTo(knex.fn.now());
                });
            }
        });

    knex.schema.hasTable('offers')
        .then(function (exists) {
            if (!exists) {
                return knex.schema.createTable('offers', function (table) {
                    table.increments();
                    table.integer('offerid');
                    table.string("name");
                    table.string('type');
                    table.integer('value');
                });
            }
        })
        .then(response => {
            if(response){
                return knex('offers')
                        .insert([{
                            offerid : 0,
                            name : 'None',
                            type : 'rupee',
                            value : 0
                        },
                        {
                            offerid : 1,
                            name : 'Custom',
                            type : 'rupee',
                            value : 0
                        }
                    ])
            }
        })
        .catch(error => {
            console.log(error);
        })

}

app.listen(3000, () => console.log('Example app listening on port 3000!'))