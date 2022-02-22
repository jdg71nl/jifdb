# Jifdb

`Jifdb` is a Promise based JSON.file Database for Node.js applications - a minimal CommonJS module using JSON-file storage and CRUD (Create, Read, Update, Delete) accessors.

_Please note(!):_ 

`I am in the process of developing and testing this module, and adding promises. I also found some bugs. Anyone that wants to use this module probably better wait for 2.x.`

## Design

![image of local file: Jifdb-design-v1.1.svg](./doc/Jifdb-design-v1.1.svg)

## Installation

Info on: https://www.npmjs.com/package/jifdb

```
npm install jifdb --save
```

### Usage

```
// do in <app.js> or <index.js>:
const jif_db = require('jifdb');
const jif_db = await jif_db.open_database({ db_path: path.join(__dirname, 'jifdb_data') });

// do in your model/script like <users.js>:
const jif_db = require('jifdb');
let users_coll = jif_db.open_collection({collection_name: "users"});

// CRUD on collection:
const new_user  = users.create({item:{ key1:"value1", key2:"value2" }});  // wil create unique _id property
const all_users = users.read();                                           // all items in collection
const get_user  = users.read({id:new_user.id});                           // read one item

// Jifdb public methods:
Jifdb.open_database({db_path:db_path})
Jifdb.close_database()
Jifdb.open_collection({collection_name: "coll_name"}) => returns: a Jifcollection
Jifdb.close_collection({collection_name: "coll_name"})
Jifdb.delete_collection({collection_name: "coll_name"})

// Jifcollection public methods (CRUD):
Jifcollection.create({item:{ key1:"value1", key2:"value2" }})
Jifcollection.read({id: id})
Jifcollection.update({id: id})
Jifcollection.delete({id: id})
Jifcollection.save()
```
