// jifdb: index.js
// - - - - - - + + + - - - - - - - - - - - - + + + - - - - - - - - - - - - + + + - - - - - - 
// Description  : a 'JSON File Database' is a minimalist CommonJS module using a JSON.file backend and CRUD Promise-based accessors
// Homepage     : https://github.com/jdg71nl/jifdb
// Package home : https://www.npmjs.com/package/jifdb
// - - - - - - + + + - - - - - - - - - - - - + + + - - - - - - - - - - - - + + + - - - - - - 

const path = require('path');
//
const fs_sync = require('fs');
// require('fs'); // for constants ?
const fs_promises = require('fs/promises');
// const { constants } = require('fs');
// import { unlink } from 'fs/promises';   // https://nodejs.org/api/fs.html#promise-example

const default_db_path = 'jifdb_data';

function isObject(val) {
  if (val === null) { return false;}
  return ( (typeof val === 'function') || (typeof val === 'object') );
}

// > npm install root-require --save
let pjson = require('root-require')('package.json');
const package_json_app_version = pjson.version || '0.0.0';

// - - - - - - + + + - - - - - - - - - - - - + + + - - - - - - - - - - - - + + + - - - - - - 
// Usage:
//
// do in <app.js> or <index.js>:
// const jif_db = require('jifdb');
// jif_db.open_database({ db_path: path.join(__dirname, 'jifdb') });
//
// do in your model/script like <users.js>:
// const jif_db = require('jifdb');
// let users = jif_db.open_collection({collection_name: "users"});

// - - - - - - + + + - - - - - - - - - - - - + + + - - - - - - - - - - - - + + + - - - - - - 
// Jifdb public methods:
//
// Jifdb.open_database({db_path:db_path})
// Jifdb.close_database()
// Jifdb.open_collection({collection_name: "coll_name"}) => returns: a Jifcollection
// Jifdb.close_collection({collection_name: "coll_name"})
// Jifdb.delete_collection({collection_name: "coll_name"})
//
const Jifdb = class {
  constructor() {
    // private
    this._classname = 'Jifdb';
    this._app_version = package_json_app_version;
    this._is_open = false;
    this._verbose = false;
    // public
    this.collections = {};
    this.db_path = '';
  }
  // - - - + - - - 
  // Public methods:
  open_database(props) {
    const func_name = 'open_database';
    return new Promise((resolve, reject) => {
      //
      if (props.verbose && props.verbose === true) {
        this._verbose = true;
        if (this._verbose) console.log(`# Jifdb: (func:${func_name}) enabled 'verbose'. `);
      }
      //
      if (this._is_open) {
        const err_msg = "Error: can't open DB which is already open.";
        if (this._verbose) console.log(`# Jifdb: (func:${func_name}) ${err_msg} `);
        reject(new Error(err_msg));
        return;
      }
      // this._is_open = true;
      //
      // // nice way to sanitize an (argument) string, seen in this course:
      // // https://www.pirple.com/courses/take/the-nodejs-master-class/lessons/3820498-adding-a-cli
      // const myfunc = function(str) {
      //   str = typeof(str) === 'string' && str.trim().length > 0 ? str.trim() : false;
      // }
      // const db_path = props.db_path && typeof(props.db_path) === 'string' && props.db_path.trim().length > 0 ? props.db_path.trim() : null;
      // or in 2 steps:
      let db_path = props.db_path; // || undenfined
      db_path = db_path && typeof(db_path) === 'string' && db_path.trim().length > 0 ? db_path.trim() : null;
      if (db_path) {
        if (this._verbose) console.log(`# Jifdb: (func:${func_name}) db_path set to "${db_path}". `);
      } else {
        // reject(new Error('no property db_path provided.'));
        // return;
        db_path = default_db_path;
        if (this._verbose) console.log(`# Jifdb: (func:${func_name}) db_path set to (default) "${db_path}". `);
      }
      this.db_path = db_path;
      //
      // https://nodejs.org/api/fs.html
      // https://nodejs.org/docs/latest-v14.x/api/synopsis.html
      // https://nodejs.org/docs/latest-v14.x/api/fs.html
      if (!fs_sync.existsSync(db_path)) {
        if (!fs_sync.mkdirSync(db_path)) {
          if (this._verbose) console.log(`# Jifdb: (func:${func_name}) created folder path "${db_path}". `);
        } else {
          const err_msg = `Error: could not create directory = ${db_path}.`;
          if (this._verbose) console.log(`# Jifdb: (func:${func_name}) ${err_msg} `);
          reject(new Error(err_msg));
          return;
        }
      }
      //
      this._is_open = true;
      this.collections = {};
      if (this._verbose) console.log(`# Jifdb: (func:${func_name}) Jifdb module.app_version = ${this._app_version} `);
      if (this._verbose) console.log(`# Jifdb: (func:${func_name}) successfully opened DB with db_path = "${db_path}" `);
      resolve();
      //  
    });
  }
  // - - - + - - - 
  close_database() {
    const func_name = 'close_database';
    return new Promise((resolve, reject) => {
      //
      if (!this._is_open) {
        const err_msg = "Error: can't close DB which is not open.";
        if (this._verbose) console.log(`# Jifdb: (func:${func_name}) ${err_msg} `);
        reject(new Error(err_msg));
        return;
      }
      //
      try {
        for (let coll_name in Object.keys(this.collections)) {
          let coll = this.collections[coll_name];
          if (coll._dirty) {
            await coll.save();
          }
        }  
      } catch(err) {
        const err_msg = "Error: error saving/closing some collection.";
        if (this._verbose) console.log(`# Jifdb: (func:${func_name}) ${err_msg} `);
        reject(new Error(err_msg));
        return;
      }
      //
      this._is_open = false;
      this._verbose = false;
      this.db_path = '';
      this.collections = {};
      resolve();
    });
    //
  }
  // - - - + - - - 
  open_collection(props) {
    const func_name = 'open_collection';
    return new Promise((resolve, reject) => {
      //
      let coll_name = props.collection_name; // sanitize ..
      coll_name = coll_name && typeof(coll_name) === 'string' && coll_name.trim().length > 0 ? coll_name.trim() : null;
      if (!coll_name) {
        reject(new Error('Error: no property collection_name provided.'));
        return;
      }
      //
      if (!coll_name.match(ASCII)) {
        reject(new Error('Error: illigal collection_name provided (must be ASCII:[a-zA-Z0-9\.\-\_\,\ ]).'));
        return;
      }
      //
      let file_path = path.join(this.db_path, coll_name + ".json");
      let new_collection = null;
      try {
        if (Object.keys(this.collections).includes(coll_name)) {
          new_collection = this.collections[coll_name];
        } else {
          new_collection = new Jifcollection({collection_name: coll_name, file_path: file_path});
          if (fs_sync.existsSync(file_path)) {
            new_collection._read_file();
          } else {
            fs_sync.closeSync(fs_sync.openSync(file_path, 'w'));
            new_collection._empty_file();
            if (this._verbose) console.log(`# Jifdb: (func:${func_name}) created file: ${file_path} `);
          }
          this.collections[coll_name] = new_collection;
        }
      } catch (err) {
        console.error(err);
      }
  
    });
  }
  // - - - + - - - 
  close_collection(props) {
    const func_name = 'close_collection';
    return new Promise((resolve, reject) => {});
    let success = false;
    const coll_name = props.collection_name;
    if (coll_name) {
      success = true
    };
    if (Object.keys(this.collections).includes(coll_name)) {
      let coll = this.collections[coll_name];
      if (coll._dirty) {
        coll.save();
      }
      delete this.collections[coll_name];
      if (this._verbose) console.log(`# Jifdb: (func:${func_name}) removed collection ${coll_name} from collections `);
    }
    return success;
  }
  // - - - + - - - 
  delete_collection(props) {
    const func_name = 'delete_collection';
    return new Promise((resolve, reject) => {});
    let success = false;
    const coll_name = props.collection_name;
    let file_path = path.join(this.db_path, coll_name + ".json");
    if (coll_name) {
      success = true
    };
    //
    // if (Object.keys(this.collections).includes(coll_name)) {
    //   delete this.collections[coll_name];
    //   if (this._verbose) console.log(`# Jifdb: (delete_collection) removed collection ${coll_name} from collections `);
    // }
    this.close_collection(props);
    //
    if (fs_sync.existsSync(file_path)) {
      const now_secs = Math.floor( Date.now() / 1000 );
      const file_bak = `${file_path}.${now_secs}.bak`;
      try {
        //
        // fs_sync.unlinkSync(file_path);
        fs_sync.renameSync( file_path, file_bak );
        //
        if (this._verbose) console.log(`# Jifdb: (func:${func_name}) unlinked (or renamed) file: ${file_path} `);
      } catch (err) {
        console.error(err);
      }  
    }
    return success;
  }
  // - - - + - - - 
}

// - - - - - - + + + - - - - - - - - - - - - + + + - - - - - - - - - - - - + + + - - - - - - 
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
    this._auto_increment = 1; // default for new/empty collection
    // public
    this.collection_name = props.collection_name;
    this.file_path = props.file_path;
    this.data = [];
  }
  // - - - + - - - 
  // Private methods:
  _empty_file() {
    this.data = [];
    this._auto_increment = 1;
  }
  async _read_file() {
    try {
      const buffer = await fs_promises.readFile(this.file_path, 'utf8');
      if (buffer != '') {
        this.data = JSON.parse(buffer);
      }
    } catch (err) {
      console.error(err);
    }
    // const max_id = Math.max(...this.data.map(item => item.id));
    const max_id = "reduce";
    this._auto_increment = max_id + 1;
  }
  async _write_file() {
    //
  }
    // - - - + - - - 
  // Public methods:
  async save() {
    const func_name = 'save';
    return new Promise((resolve, reject) => {});
    if (this._dirty) {
      this._dirty = false;
      const JsonString = JSON.stringify(this.data, null, 2);
      try {
        const some = await fs_promises.writeFile(this.file_path, JsonString);
      } catch (err) {
        console.error(err);
      }  
    }
  }
  //
  // - - - + - - - 
  // CRUD accessors:
  create(props) {
    const func_name = 'create';
    return new Promise((resolve, reject) => {});
    const item = props.item;
    let new_item = null;
    if (item && isObject(item)) {
      new_item = item;
      new_item.id = this._auto_increment;
      this._auto_increment = this._auto_increment + 1;
      this.data.push(new_item);
      //
      // this.save();
      this._dirty = true;
      //
    } else {
      if (this._verbose) console.log(`# Jifdb: (func:${func_name}) ERROR not a valid item: ${JSON.stringify(item)} `);
    }
    return new_item;
  }
  // - - - + - - - 
  read(props) {
    const func_name = 'read';
    return new Promise((resolve, reject) => {});
    const id = props.id;
    if (id) {
      return this.data.find(item => item.id == id);
    } else {
      return this.data;
    }
  }
  // - - - + - - - 
  update(props) {
    const func_name = 'update';
    return new Promise((resolve, reject) => {});
    let this_item = null;
    const id = props.id;
    if (id) {
      this_item = this.data.find(item => item.id == id);
      // this._dirty = true;
    }
    return this_item;
  }
  // - - - + - - - 
  delete(props) {
    const func_name = 'delete';
    return new Promise((resolve, reject) => {});
    let this_item = null;
    const id = props.id;
    if (id) {
      this_item = this.data.find(item => item.id == id);
      // this._dirty = true;
    }
    return this_item;
  }
  // - - - + - - - 
  //
}

// - - - - - - + + + - - - - - - - - - - - - + + + - - - - - - - - - - - - + + + - - - - - - 
// singleton (ish)
//
var jif_db = new Jifdb();

// - - - - - - + + + - - - - - - - - - - - - + + + - - - - - - - - - - - - + + + - - - - - - 
module.exports = jif_db;

// - - - - - - + + + - - - - - - - - - - - - + + + - - - - - - - - - - - - + + + - - - - - - 
//-EOF