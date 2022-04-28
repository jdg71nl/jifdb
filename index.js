// jifdb: index.js
// - - - - - - + + + - - - - - - - - - - - - + + + - - - - - - - - - - - - + + + - - - - - - 
// Description  : a 'JSON File Database' is a minimalist CommonJS module using a JSON.file backend and CRUD Promise-based accessors
// Homepage     : https://github.com/jdg71nl/jifdb
// Package home : https://www.npmjs.com/package/jifdb
// - - - - - - + + + - - - - - - - - - - - - + + + - - - - - - - - - - - - + + + - - - - - - 

const path = require('path');
//
const fs_sync = require('fs');    // https://nodejs.org/api/fs.html#synchronous-api
// require('fs'); // for constants ?
// const fs_promises = require('fs/promises');
// const { constants } = require('fs');
// import { unlink } from 'fs/promises';   // https://nodejs.org/api/fs.html#promise-example

// const regex_ascii = /^[\x00-\x7f]*$/; // reference: https://en.wikipedia.org/wiki/ASCII
// const regex_ascii = /^[\x20-\x7e]*$/; // only printable chars
const regex_ascii = /^[a-zA-Z0-9\ \.,\-_]*$/; // disallow formatting chars like []{}()<>*&^%$#@!=+\/|`?'~"

// const col_data_empty = [];
const col_data_empty = {
  next_id:  1,
  list:     []
};

const db_path_default = 'jifdb_data';

function is_object(val) {
  if (val === null) { return false;}
  return ( (typeof val === 'function') || (typeof val === 'object') );
}

// > npm install root-require --save
let pjson = require('root-require')('package.json');
const package_json_app_version = pjson.version || '0.0.0';

// - - - - - - + + + - - - - - - - - - - - - + + + - - - - - - - - - - - - + + + - - - - - - 
// Usage:
//
// # do in <app.js> or <index.js>:
// const jif_db = require('jifdb');
// jif_db.open_database({ db_path: path.join(__dirname, 'jifdb_data') });
//
// # do in your model/script like <users.js>:
// const jif_db = require('jifdb');
// let users = jif_db.open_collection({collection_name: "users"});

// - - - - - - + + + - - - - - - - - - - - - + + + - - - - - - - - - - - - + + + - - - - - - 
// Jifdb public methods:
//
// Jifdb.open_database({db_path:db_path})                  => returns <true|false>
// Jifdb.close_database()                                  => returns <true|false>
// Jifdb.open_collection({collection_name: "col_name"})    => returns <Jifcollection|false>
// Jifdb.close_collection({collection_name: "col_name"})   => returns <true|false>
// Jifdb.save_collection({collection_name: "col_name"})    => returns <true|false>
// Jifdb.delete_collection({collection_name: "col_name"})  => returns <true|false>
//
const Jifdb = class {
  constructor() {
    // private
    this._classname = 'Jifdb';
    this._app_version = package_json_app_version;
    this._verbose = false;
    // public
    this.collections = {};
    this.db_path = '';
    this.is_open = false;
  }
  // - - - + - - - 
  // Private methods:
  //
  _empty_file(props) {
    const _func_name = '_empty_file';
    //
    let col_name = props.collection_name;
    col_name = col_name && typeof(col_name) === 'string' && col_name.trim().length > 0 ? col_name.trim() : null;
    if (!col_name) {
      const err_msg = 'Error: no property collection_name provided.';
      if (this._verbose) console.log(`# Jifdb func:${_func_name} ${err_msg} `);
      return false;
    }
    if (!Object.keys(this.collections).includes(col_name)) {
      const err_msg = `Error: collection "${col_name}" does not exist or is not open.`;
      if (this._verbose) console.log(`# Jifdb func:${_func_name} ${err_msg} `);
      return false;
    }
    let col = this.collections[col_name];
    let file_path = path.join(this.db_path, col_name + ".json");
    //
    if (fs_sync.existsSync(file_path)) {
      const err_msg = `Error: file "${file_path}" already exists (not overwriting).`;
      if (this._verbose) console.log(`# Jifdb func:${_func_name} ${err_msg} `);
      return false;
    }
    //
    fs_sync.writeFileSync(file_path, col_data_empty, {encoding: 'utf8'}); // https://nodejs.org/api/fs.html#fswritefilesyncfile-data-options
    //
    const write_result = fs_sync.existsSync(file_path);
    return write_result;
    //
  } // \_empty_file(props) {}
  //
  _read_file(props) {
    const _func_name = '_read_file';
    //
    let col_name = props.collection_name;
    col_name = col_name && typeof(col_name) === 'string' && col_name.trim().length > 0 ? col_name.trim() : null;
    if (!col_name) {
      const err_msg = 'Error: no property collection_name provided.';
      if (this._verbose) console.log(`# Jifdb func:${_func_name} ${err_msg} `);
      return false;
    }
    if (!Object.keys(this.collections).includes(col_name)) {
      const err_msg = `Error: collection "${col_name}" does not exist or is not open.`;
      if (this._verbose) console.log(`# Jifdb func:${_func_name} ${err_msg} `);
      return false;
    }
    let col = this.collections[col_name];
    let file_path = path.join(this.db_path, col_name + ".json");
    //
    if (!fs_sync.existsSync(file_path)) {
      const err_msg = `Error: file "${file_path}" does not exist.`;
      if (this._verbose) console.log(`# Jifdb func:${_func_name} ${err_msg} `);
      return false;
    }
    //
    const col_data_string = fs_sync.readFileSync(file_path, {encoding: 'utf8'});   // https://nodejs.org/api/fs.html#fsreadfilesyncpath-options    
    //
    // const max_id = Math.max(...this.list.map(item => item.id));
    // this._next_id = max_id + 1;  // NO: let's track next_id explicitly
    //
    if (!col_data_string) {
      const err_msg = `Error: could not read file "${file_path}".`;
      if (this._verbose) console.log(`# Jifdb func:${_func_name} ${err_msg} `);
      return false;
    }
    //
    const col_data = JSON.parse(col_data_string);
    //
    if (!col_data) {
      const err_msg = `Error: file "${file_path}" is not valid JSON format.`;
      if (this._verbose) console.log(`# Jifdb func:${_func_name} ${err_msg} `);
      return false;
    }
    //
    if (!col_data.hasOwnProperty('next_id') || !col_data.hasOwnProperty('list')) {
      const err_msg = `Error: file "${file_path}" is corrupted.`;
      if (this._verbose) console.log(`# Jifdb func:${_func_name} ${err_msg} `);
      return false;
    }
    //
    return col_data;
    //
  } // \_read_file(props) {} 
  //
  _write_file(props) {
    const _func_name = '_write_file';
    //
    let col_name = props.collection_name;
    col_name = col_name && typeof(col_name) === 'string' && col_name.trim().length > 0 ? col_name.trim() : null;
    if (!col_name) {
      const err_msg = 'Error: no property collection_name provided.';
      if (this._verbose) console.log(`# Jifdb func:${_func_name} ${err_msg} `);
      return false;
    }
    let col_data = props.col_data;
    col_data = col_data && is_object(col_data) && col_data.hasOwnProperty('next_id') && col_data.hasOwnProperty('list') ? col_data : null;
    if (!col_data) {
      const err_msg = `Error: no valid data object provided.`;
      if (this._verbose) console.log(`# Jifdb func:${_func_name} ${err_msg} `);
      return false;
    }
    //
    if (!Object.keys(this.collections).includes(col_name)) {
      const err_msg = `Error: collection "${col_name}" does not exist or is not open.`;
      if (this._verbose) console.log(`# Jifdb func:${_func_name} ${err_msg} `);
      return false;
    }
    let col = this.collections[col_name];
    let file_path = path.join(this.db_path, col_name + ".json");
    //
    if (!fs_sync.existsSync(file_path)) {
      const err_msg = `Error: file "${file_path}" does not exist.`;
      if (this._verbose) console.log(`# Jifdb func:${_func_name} ${err_msg} `);
      return false;
    }
    //
    col_data_string = JSON.stringify(col_data, null, 2);
    fs_sync.writeFileSync(file_path, col_data_string, {encoding: 'utf8'}); // https://nodejs.org/api/fs.html#fswritefilesyncfile-data-options
    //
    return true;
    //
  } // \_write_file(props) {}
  //
  // - - - + - - - 
  // Public methods:
  open_database(props) {
    const _func_name = 'open_database';
    //
    if (props.verbose && props.verbose === true) {
      this._verbose = true;
      if (this._verbose) console.log(`# Jifdb func:${_func_name} enabled 'verbose'.`);
    }
    //
    if (this.is_open) {
      const err_msg = "Error: can't open DB which is already open.";
      if (this._verbose) console.log(`# Jifdb func:${_func_name} ${err_msg} `);
      return false;
    }
    //
    // // nice way to sanitize an (argument) string, seen in this course:
    // // https://www.pirple.com/courses/take/the-nodejs-master-class/lessons/3820498-adding-a-cli
    // const myfunc = function(str) {
    //   str = typeof(str) === 'string' && str.trim().length > 0 ? str.trim() : false;
    // }
    //
    let db_path = props.db_path;
    db_path = db_path && typeof(db_path) === 'string' && db_path.trim().length > 0 ? db_path.trim() : null;
    if (db_path) {
      if (this._verbose) console.log(`# Jifdb func:${_func_name} db_path set to "${db_path}". `);
    } else {
      db_path = db_path_default;
      if (this._verbose) console.log(`# Jifdb func:${_func_name} db_path set to (default) "${db_path}". `);
    }
    this.db_path = db_path;
    //
    // https://nodejs.org/api/fs.html
    // https://nodejs.org/docs/latest-v14.x/api/synopsis.html
    // https://nodejs.org/docs/latest-v14.x/api/fs.html
    if (!fs_sync.existsSync(db_path)) {
      if (fs_sync.mkdirSync(db_path)) {
        if (this._verbose) console.log(`# Jifdb func:${_func_name} created folder path "${db_path}". `);
      } else {
        const err_msg = `Error: could not create directory "${db_path}".`;
        if (this._verbose) console.log(`# Jifdb func:${_func_name} ${err_msg} `);
        return false;
      }
    }
    //
    this.is_open = true;
    this.collections = {};
    if (this._verbose) console.log(`# Jifdb func:${_func_name} Jifdb module.app_version = ${this._app_version} `);
    if (this._verbose) console.log(`# Jifdb func:${_func_name} successfully opened DB with db_path = "${db_path}" `);
    //
    // TODO: start auto-save-timer here that auto-saves the DB (all dirty collections)
    //
    return true;
    //
  } // \open_database(props) {}
  //
  // - - - + - - - 
  close_database() {
    const _func_name = 'close_database';
    //
    if (!this.is_open) {
      const err_msg = "Error: can't close DB which is not open.";
      if (this._verbose) console.log(`# Jifdb func:${_func_name} ${err_msg} `);
      return false;
    }
    //
    for (let col_name in Object.keys(this.collections)) {
      let col = this.collections[col_name];
      if (col._dirty) {
        //
        if ( !this.save_collection({save_collection: col_name}) ) {
          const err_msg = `Error: error saving/closing collection "${col_name}".`;
          if (this._verbose) console.log(`# Jifdb func:${_func_name} ${err_msg} `);
          return false;      
        }
        //
      }
    }  
    //
    this.is_open = false;
    this.collections = {};
    //
    // TODO: cancel auto-save-timer
    //
    return true;
    //
  } // \close_database() {}
  //
  // - - - + - - - 
  open_collection(props) {
    const _func_name = 'open_collection';
    //
    if (!this.is_open) {
      const err_msg = "Error: can't execute function on a closed DB.";
      if (this._verbose) console.log(`# Jifdb func:${_func_name} ${err_msg} `);
      return false;
    }
    //
    let col_name = props.collection_name;
    col_name = col_name && typeof(col_name) === 'string' && col_name.trim().length > 0 ? col_name.trim() : null;
    if (!col_name) {
      const err_msg = 'Error: no property collection_name provided.';
      if (this._verbose) console.log(`# Jifdb func:${_func_name} ${err_msg} `);
      return false;
    }
    if (!regex_ascii.test(col_name)) {  // not?: col_name.match(regex_ascii)
      const err_msg = 'Error: illigal collection_name provided (must be regex_ascii:[a-zA-Z0-9\.\-\_\,\ ]).';
      if (this._verbose) console.log(`# Jifdb func:${_func_name} ${err_msg} `);
      return false;
    }
    //
    let file_path = path.join(this.db_path, col_name + ".json");
    let new_collection = null;
    if (!Object.keys(this.collections).includes(col_name)) {
      //
      new_collection = new Jifcollection({collection_name: col_name, file_path: file_path});
      //
      if (fs_sync.existsSync(file_path)) {
        //
        const col_data = this._read_file({collection_name: col_name});
        //
        // if (!new_collection._read_file()) {
        if (!col_data) {
          const err_msg = `Error: collection "${col_name}" does not exist or is not open.`;
          if (this._verbose) console.log(`# Jifdb func:${_func_name} ${err_msg} `);
          return false;
        }
        new_collection._next_id = col_data.next_id;
        new_collection.list     = col_data.list;
        //
      } else {
        //
        // fs_sync.closeSync(fs_sync.openSync(file_path, 'w'));
        // if (!new_collection._empty_file()) {.}
        //
        if (!this._empty_file({collection_name: col_name})) {
          const err_msg = `Error: could not create new/empty collection "${col_name}".`;
          if (this._verbose) console.log(`# Jifdb func:${_func_name} ${err_msg} `);
          return false;
        }
        new_collection._next_id = col_data_empty.next_id;
        new_collection.list     = col_data_empty.list;
        //
        if (this._verbose) console.log(`# Jifdb func:${_func_name} created file: ${file_path} `);
      }
      this.collections[col_name] = new_collection;
    }
    return new_collection;
    //
  } // \open_collection(props) {}
  //
  // - - - + - - - 
  close_collection(props) {
    const _func_name = 'close_collection';
    //
    if (!this.is_open) {
      const err_msg = "Error: can't execute function on a closed DB.";
      if (this._verbose) console.log(`# Jifdb func:${_func_name} ${err_msg} `);
      return false;
    }
    //
    let col_name = props.collection_name;
    col_name = col_name && typeof(col_name) === 'string' && col_name.trim().length > 0 ? col_name.trim() : null;
    if (!col_name) {
      const err_msg = 'Error: no property collection_name provided.';
      if (this._verbose) console.log(`# Jifdb func:${_func_name} ${err_msg} `);
      return false;
    }
    if (!Object.keys(this.collections).includes(col_name)) {
      const err_msg = `Error: collection "${col_name}" does not exist or is not open.`;
      if (this._verbose) console.log(`# Jifdb func:${_func_name} ${err_msg} `);
      return false;
    }
    let col = this.collections[col_name];
    if (col._dirty) {
      //
      if ( !this.save_collection({save_collection: col_name}) ) {
        const err_msg = `Error: could not save collection "${col_name}".`;
        if (this._verbose) console.log(`# Jifdb func:${_func_name} ${err_msg} `);
        return false;
      }
      //
    }
    delete this.collections[col_name];
    if (this._verbose) console.log(`# Jifdb func:${_func_name} successfully closed collection ${col_name}.`);
    return true;
    //
  } // \close_collection(props) {}
  //
  // - - - + - - - 
  save_collection(props) {
    const _func_name = 'save_collection';
    //
    if (!this.is_open) {
      const err_msg = "Error: can't execute function on a closed DB.";
      if (this._verbose) console.log(`# Jifdb func:${_func_name} ${err_msg} `);
      return false;
    }
    //
    let col_name = props.collection_name;
    col_name = col_name && typeof(col_name) === 'string' && col_name.trim().length > 0 ? col_name.trim() : null;
    if (!col_name) {
      const err_msg = 'Error: no property collection_name provided.';
      if (this._verbose) console.log(`# Jifdb func:${_func_name} ${err_msg} `);
      return false;
    }
    if (!Object.keys(this.collections).includes(col_name)) {
      const err_msg = `Error: collection "${col_name}" does not exist or is not open.`;
      if (this._verbose) console.log(`# Jifdb func:${_func_name} ${err_msg} `);
      return false;
    }
    let col = this.collections[col_name];
    if (col._dirty) {
      //
      const result = this._write_file({collection_name: col_name, col_data: { next_id: col._next_id, list: col.data}});
      //
      if (result) {
        col._dirty = false;
        if (this._verbose) console.log(`# Jifdb func:${_func_name} collection ${col_name} successfully saved (did have changes).`);
      } else {
        const err_msg = `Error: error saving collection "${col_name}".`;
        if (this._verbose) console.log(`# Jifdb func:${_func_name} ${err_msg} `);
        return false;
      }
      //
    } else {
      if (this._verbose) console.log(`# Jifdb func:${_func_name} saving collection ${col_name} not needed (no changes).`);
    }
    return true;
    //
  } // \save_collection(props) {}
  //
  // - - - + - - - 
  delete_collection(props) {
    const _func_name = 'delete_collection';
    //
    if (!this.is_open) {
      const err_msg = "Error: can't execute function on a closed DB.";
      if (this._verbose) console.log(`# Jifdb func:${_func_name} ${err_msg} `);
      return false;
    }
    //
    let col_name = props.collection_name;
    col_name = col_name && typeof(col_name) === 'string' && col_name.trim().length > 0 ? col_name.trim() : null;
    if (!col_name) {
      const err_msg = 'Error: no property collection_name provided.';
      if (this._verbose) console.log(`# Jifdb func:${_func_name} ${err_msg} `);
      return false;
    }
    if (!Object.keys(this.collections).includes(col_name)) {
      const err_msg = `Error: collection "${col_name}" does not exist or is not open.`;
      if (this._verbose) console.log(`# Jifdb func:${_func_name} ${err_msg} `);
      return false;
    }
    let col = this.collections[col_name];
    if (col._dirty) {
      //
      if ( !this.save_collection({save_collection: col_name}) ) {
        const err_msg = `Error: could not save collection "${col_name}".`;
        if (this._verbose) console.log(`# Jifdb func:${_func_name} ${err_msg} `);
        return false;
      }
      //
    }
    // fs_sync.renameSync( file_path, file_bak );
    if (!fs_sync.unlinkSync(file_path)) {
      const err_msg = `Error: could not delete/unlink collection file "${file_path}".`;
      if (this._verbose) console.log(`# Jifdb func:${_func_name} ${err_msg} `);
      return false;
    }
    delete this.collections[col_name];
    if (this._verbose) console.log(`# Jifdb func:${_func_name} successfully deleted file: ${file_path} `);
    return true;
    //
  } // \delete_collection(props) {}
  //
  // - - - + - - - 
  //
} // \const Jifdb = class {}

// - - - - - - + + + - - - - - - - - - - - - + + + - - - - - - - - - - - - + + + - - - - - - 
// Jifcollection public methods:
//
// Jifcollection.create({item:{k1:"v1",k2:"v2"}})             => returns <Object|false>
// Jifcollection.read({})                                     => returns <Array|false>
// Jifcollection.read({id: id})                               => returns <Object|false>
// Jifcollection.update({id: id, update:{k1:"v1",k3:"v3"}})   => returns <Object|false>
// Jifcollection.update({id: id, replace:{k4:"v4",k5:"v5"}})  => returns <Object|false>
// Jifcollection.delete({id: id})                             => returns <true|false>
//
const Jifcollection = class {
  constructor(props) {
    // private
    this._my_classname = 'Jifcollection';
    this._next_id = 1; // default for new/empty collection
    // public
    this.collection_name = props.collection_name;
    this.file_path = props.file_path;
    this.list = [];
    this.dirty = false;
  }
  // - - - + - - - 
  // Public methods:
  //
  // CRUD accessors:
  create(props) {
    const _func_name = 'create';
    return new Promise((resolve, reject) => {});
    const item = props.item;
    let new_item = null;
    if (item && is_object(item)) {
      new_item = item;
      new_item.id = this._next_id;
      this._next_id = this._next_id + 1;
      this.list.push(new_item);
      //
      // this.save();
      this.dirty = true;
      //
    } else {
      if (this._verbose) console.log(`# Jifdb func:${_func_name} ERROR not a valid item: ${JSON.stringify(item)} `);
    }
    return new_item;
    //
  } // \create(props) {}
  //
  // - - - + - - - 
  read(props) {
    const _func_name = 'read';
    return new Promise((resolve, reject) => {});
    const id = props.id;
    if (id) {
      return this.list.find(item => item.id == id);
    } else {
      return this.list;
    }
    //
  } // \read(props) {}
  //
  // - - - + - - - 
  update(props) {
    const _func_name = 'update';
    return new Promise((resolve, reject) => {});
    let this_item = null;
    const id = props.id;
    if (id) {
      this_item = this.list.find(item => item.id == id);
      // this.dirty = true;
    }
    return this_item;
    //
  } // \update(props) {}
  //
  // - - - + - - - 
  delete(props) {
    const _func_name = 'delete';
    return new Promise((resolve, reject) => {});
    let this_item = null;
    const id = props.id;
    if (id) {
      this_item = this.list.find(item => item.id == id);
      // this.dirty = true;
    }
    return this_item;
    //
  } // \delete(props) {}
  //
  // - - - + - - - 
  //
} // \const Jifcollection = class {}


// - - - - - - + + + - - - - - - - - - - - - + + + - - - - - - - - - - - - + + + - - - - - - 
// singleton (ish)
//
var jif_db = new Jifdb();

// - - - - - - + + + - - - - - - - - - - - - + + + - - - - - - - - - - - - + + + - - - - - - 
module.exports = jif_db;

// - - - - - - + + + - - - - - - - - - - - - + + + - - - - - - - - - - - - + + + - - - - - - 
//-EOF