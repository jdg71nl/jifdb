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
// do in your model/script like <users.js>:
// const jif_db = require('../jifdb');
// let users = jif_db.open_collection({collection_name: "users"});

// Jifdb public methods:
//
// Jifdb.open_database({db_path:db_path})
// Jifdb.close_database()
// Jifdb.open_collection({collection_name: "col_name"}) => returns: a Jifcollection
// Jifdb.close_collection({collection_name: "col_name"})
// Jifdb.delete_collection({collection_name: "col_name"})
//
const Jifdb = class {
  constructor() {
    // private
    this._my_classname = 'Jifdb';
    this._app_version = app_version;
    this._is_opened = false;
    this._show_debug = false;
    // public
    this.collections = {};
    this.db_path = '';
  }
  open_database(props) {
    let success = false;
    const db_path = props.db_path;
    // if (Object.keys(props).includes('show_debug') && typeof props.show_debug === "boolean") {
    if (Object.keys(props).includes('show_debug')) {
      this._show_debug = props.show_debug;
      if (this._show_debug) console.log(`# JifDB: (open_database) enabled show_debug `);
    }
    if (this._is_opened) {
      success = false;
    } else {
      this._is_opened = true;
      this.db_path = db_path;
      //
      try {
        if (!fs.existsSync(db_path)) {
            fs.mkdirSync(db_path);
            if (this._show_debug) console.log(`# JifDB: (open_database) created folder path "${db_path}" `);
        }
      } catch (err) {
          console.log(err);
      }
      //
      if (this._show_debug) console.log(`# JifDB: (open_database) opened DB with path "${db_path}" `);
      //  
    }
    return success;
  }
  close_database() {
    let success = false;
    if (!this._is_opened) {
      if (this._show_debug) console.log(`# JifDB: (close_database) DB not open with path "${db_path}" `);
    } else {
      for (let col_name in Object.keys(this.collections)) {
        let col = this.collections[col_name];
        if (col._dirty) {
          col.save();
        }
      }
      this._is_opened = false;
      this._show_debug = false;
      this.db_path = '';
      this.collections = {};
      //
      success = true;
    }
    return success;
  }
  open_collection(props) {
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
          if (this._show_debug) console.log(`# JifDB: (open_collection) created file: ${file_path} `);
        }
        this.collections[col_name] = new_collection;
      }
    } catch (err) {
      console.error(err);
    }
    return new_collection;
  }
  close_collection(props) {
    let success = false;
    const col_name = props.collection_name;
    if (col_name) {
      success = true
    };
    if (Object.keys(this.collections).includes(col_name)) {
      let col = this.collections[col_name];
      if (col._dirty) {
        col.save();
      }
      delete this.collections[col_name];
      if (this._show_debug) console.log(`# JifDB: (close_collection) removed collection ${col_name} from collections `);
    }
    return success;
  }
  delete_collection(props) {
    let success = false;
    const col_name = props.collection_name;
    let file_path = path.join(this.db_path, col_name + ".json");
    if (col_name) {
      success = true
    };
    //
    // if (Object.keys(this.collections).includes(col_name)) {
    //   delete this.collections[col_name];
    //   if (this._show_debug) console.log(`# JifDB: (delete_collection) removed collection ${col_name} from collections `);
    // }
    this.close_collection(props);
    //
    if (fs.existsSync(file_path)) {
      const now_secs = Math.floor( Date.now() / 1000 );
      const file_bak = `${file_path}.${now_secs}.bak`;
      try {
        //
        // fs.unlinkSync(file_path);
        fs.renameSync( file_path, file_bak );
        //
        if (this._show_debug) console.log(`# JifDB: (delete_collection) unlinked (or renamed) file: ${file_path} `);
      } catch (err) {
        console.error(err);
        success = false;
      }  
    }
    return success;
  }
}

// Jifcollection public methods:
//
// Jifcollection.create({item:{ key1:"value1", key2:"value2" }})
// Jifcollection.read({})
// Jifcollection.read({id: id})
// Jifcollection.update({id: id})
// Jifcollection.delete({id: id})
// Jifcollection.save()
//
const Jifcollection = class {
  constructor(props) {
    // private
    this._my_classname = 'Jifcollection';
    this._dirty = false;
    this._next_id = 1;
    // public
    this.collection_name = props.collection_name;
    this.file_path = props.file_path;
    this.data = [];
  }
  _empty_file() {
    this.data = [];
    this._next_id = 1;
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
    this._next_id = max_id + 1;
  }
  save() {
    if (this._dirty) {
      this._dirty = false;
      const JsonString = JSON.stringify(this.data, null, 2);
      try {
        fs.writeFileSync(this.file_path, JsonString);
      } catch (err) {
        console.error(err);
      }  
    }
  }
  //
  // CRUD accessors:
  create(props) {
    const item = props.item;
    let new_item = null;
    if (item && isObject(item)) {
      new_item = item;
      new_item.id = this._next_id;
      this._next_id = this._next_id + 1;
      this.data.push(new_item);
      //
      // this.save();
      this._dirty = true;
      //
    } else {
      if (this._show_debug) console.log(`# JifDB: (create_item) ERROR not a valid item: ${JSON.stringify(item)} `);
    }
    return new_item;
  }
  read(props) {
    const id = props.id;
    if (id) {
      return this.data.find(item => item.id == id);
    } else {
      return this.data;
    }
  }
  update(props) {
    let this_item = null;
    const id = props.id;
    if (id) {
      this_item = this.data.find(item => item.id == id);
    }
    return this_item;
  }
  delete(props) {
    let this_item = null;
    const id = props.id;
    if (id) {
      this_item = this.data.find(item => item.id == id);
    }
    return this_item;
  }
  //
}

var jif_db = new Jifdb();

module.exports = jif_db;

//-EOF