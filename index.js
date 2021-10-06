// jifdb: index.js
//
// Description  : a 'JSON File Database' is a minimalist CommonJS module using a JSON file backend and CRUD accessors
// Homepage     : https://github.com/jdg71nl/jifdb

const path = require('path');
const fs = require('fs');
// const fs = require('fs/promises');

function isObject(val) {
  if (val === null) { return false;}
  return ( (typeof val === 'function') || (typeof val === 'object') );
}

// > npm install root-require --save
let pjson = require('root-require')('package.json');
const app_version = 'v' + pjson.version || 'v?.?.?';

// Usage:
//
// do in <app.js> or <index.js>:
// const jif_db = require('./jifdb');
// jif_db.open_database({ db_path: path.join(__dirname, 'jifdb') });
//
// do in your model script like <users.js>:
// const jif_db = require('../jifdb');
// let users = jif_db.get_collection({collection_name: "users"});

//
const Jifdb = class {
  constructor() {
    this._my_classname = 'Jifdb';
    this._app_version = app_version;
    this.db_path = '';
    this.collections = {};
    this._show_debug = false;
  }
  open_database(props) {
    const db_path = props.db_path;
    try {
      if (!fs.existsSync(db_path)) {
          fs.mkdirSync(db_path);
          if (this._show_debug) console.log(`# JifDB: (open_database) created folder path "${db_path}" `);
      }
    } catch (err) {
        console.log(err);
    }
    this.db_path = db_path;
    if (this._show_debug) console.log(`# JifDB: (open_database) opened DB with path "${db_path}" `);
    if (Object.keys(props).includes('show_debug') && typeof props.show_debug === "boolean") {
      this._show_debug = props.show_debug;
    }
  }
  get_collection(props) {
    const col_name = props.collection_name;
    let file_path = path.join(this.db_path, col_name + ".json");
    let new_collection = null;
    try {
      if (Object.keys(this.collections).includes(col_name)) {
        new_collection = this.collections[col_name];
      } else {
        new_collection = new Jifcollection({collection_name: col_name, file_path: file_path});
        if (fs.existsSync(file_path)) {
          new_collection._read_file();
        } else {
          fs.closeSync(fs.openSync(file_path, 'w'));
          new_collection._empty_file();
          if (this._show_debug) console.log(`# JifDB: (get_collection) created file: ${file_path} `);
        }
        this.collections[col_name] = new_collection;
      }
    } catch (err) {
      console.error(err);
    }
    return new_collection;
  }
  clear_collection(props) {
    const col_name = props.collection_name;
    let file_path = path.join(this.db_path, col_name + ".json");
    //
    if (this.collections.includes(col_name)) {
      const index = this.collections.indexOf(col_name);
      if (index > -1) {
        this.collections.splice(index, 1);
      }
      if (this._show_debug) console.log(`# JifDB: (clear_collection) removed collection ${col_name} from collections `);
    }
    //
    if (fs.existsSync(file_path)) {
      try {
        fs.unlinkSync(file_path);
        if (this._show_debug) console.log(`# JifDB: (clear_collection) unlinked file: ${file_path} `);
      } catch (err) {
        console.error(err);
      }  
    }
    //
  }
}

const Jifcollection = class {
  constructor(props) {
    this._my_classname = 'Jifcollection';
    this.collection_name = props.collection_name;
    this.file_path = props.file_path;
    this.next_id = 1;
    this.data = [];
  }
  _empty_file() {
    this.data = [];
    this.next_id = 1;
  }
  _read_file() {
    try {
      const buffer = fs.readFileSync(this.file_path, 'utf8');
      if (buffer != '') {
        this.data = JSON.parse(buffer);
      }
    } catch (err) {
      console.error(err);
    }
    const max_id = Math.max(...this.data.map(item => item.id));
    this.next_id = max_id + 1;
  }
  add_item(item) {
    let new_item = null;
    if (item && isObject(item)) {
      new_item = item;
      new_item.id = this.next_id;
      this.next_id = this.next_id + 1;
      this.data.push(new_item);
      this.save();
    } else {
      if (this._show_debug) console.log(`# JifDB: (add_item) ERROR not a valid item: ${JSON.stringify(item)} `);
    }
    return new_item;
  }
  save() {
    const JsonString = JSON.stringify(this.data, null, 2);
    try {
      fs.writeFileSync(this.file_path, JsonString);
    } catch (err) {
      console.error(err);
    }
  }
}

var jif_db = new Jifdb();

module.exports = jif_db;

//-EOF