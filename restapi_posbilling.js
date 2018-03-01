const path = require('path');
const knex = require('knex')({
    client: "sqlite3",
    connection: {
        filename: path.join('C:\\Users\\George Joseph\\AppData\\Roaming\\posbilling-system\\storage', "posbillingsystem.sqlite").toString()
        //filename: path.join('C:\\Users\\George_Joseph02', "posbillingsystem.sqlite").toString()
        //filename : path.join(dataPath, "testdatabase.sqlite").toString()
    },
    useNullAsDefault: true
});
const express = require('express');
const app = express();

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
}   
)
app.get('/api/inventory', getInventory);
app.post('/api/item', (req, res) => {
    addToInventory(req.body, res)
});
app.post('/api/itemedit', (req, res) => {
    console.log(req.body);
    editInventory(req.body, res)
});
app.post('/api/itemremove', (req, res) => {
    console.log(req.body);
    removeInventory(req.body, res)
});

createTables();

function getInventory(req, res, next) {
    knex('inventory')
        .where('isremoved', false)
        .select()
        .then(function (response) {
            for (let i = 0; i < response.length; i++) {
                response[i].isremoved = !!+response[i].isremoved;
                response[i].hasoff = !!+response[i].hasoff;
            }
            res.status(200).json(response);
            next();
        });
}

function addToInventory(data, res) {
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
        .then(function (response){
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

function editInventory(data, res) {
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

function removeInventory(data, res) {
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
 
function createTables() {

    knex.schema.hasTable('storeid').then(function (exists) {
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
        return knex('storeid')
            .insert({key : "storeidkey"})
    })
    .catch((error) => {
        console.log(error);
    });

    knex.schema.hasTable('inventory').then(function (exists) {
        if (!exists) {
            return knex.schema.createTable('inventory', function (table) {
                table.increments("id");
                table.string("prodid", 5);
                table.string("prodname");
                table.string("proddisc");
                table.boolean("isremoved");
                table.integer("stock");
                table.float("unitprice", 9, 2);
                table.string("category");
                table.integer("tax");
                table.boolean("hasoff");
                table.string("offtype");
                table.float("offvalue", 9, 2);
                table.string("updated_by");
                table.timestamps(false, true);
                table.unique("prodid");
            });
        }
    })
    .then(response => {
        return knex('inventory')
            .insert({
                "prodid": "1"})
    })
    .then(response => {
        return knex('inventory')
                .where("prodid", "1")
                .select("id")
    })
    .then(response => {
        return knex('storeid')
                .where("key", "storeidkey")
                .update("prodid", response[0].id)
    })
    .then(response => {
        console.log("ran");
        return knex('inventory')
                .where("prodid", "1")
                .del()
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
    });

    knex.schema.hasTable('sales').then(function (exists) {
        if (!exists) {
            return knex.schema.createTable('sales', function (table) {
                table.increments();
                table.string("billno");
                table.json("billdetails");
                table.string("username");
                table.timestamp("created_at").defaultTo(knex.fn.now());
            });
        }
    });

    knex.schema.hasTable('taxes').then(function (exists) {
        if (!exists) {
            return knex.schema.createTable('taxes', function (table) {
                table.increments('taxid');
                table.string("taxname");
                table.json("taxvalue");
                table.timestamp("updated_at").defaultTo(knex.fn.now());
            });
        }
    });
}

app.listen(3000, () => console.log('Example app listening on port 3000!'))