// jifdb: index.js
// - - - - - - + + + - - - - - - - - - - - - + + + - - - - - - - - - - - - + + + - - - - - - 
// Description  : a 'JSON File Database' is a minimalist CommonJS module using a JSON file backend and CRUD accessors
// Homepage     : https://github.com/jdg71nl/jifdb
// Package home : https://www.npmjs.com/package/jifdb
// - - - - - - + + + - - - - - - - - - - - - + + + - - - - - - - - - - - - + + + - - - - - - 

const path = require('path');
const fs = require('fs');
// require('fs'); // for constants ?
// const fs = require('fs/promises');
// const { constants } = require('fs');

function isObject(val) {
  if (val === null) { return false;}
  return ( (typeof val === 'function') || (typeof val === 'object') );
}

// > npm install root-require --save
let pjson = require('root-require')('package.json');
const app_version = 'v' + pjson.version || 'v?.?.?';

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
        this._verbose = props.verbose;
        if (this._verbose) console.log(`# Jifdb: (${func_name}) enabled 'verbose'. `);
      }
      //
      if (this._is_opened) {
        const err_msg = "Error: can't open DB which is already open.";
        if (this._verbose) console.log(`# Jifdb: (${func_name}) ${err_msg} `);
        reject(new Error(err_msg));
        return;
      }
      this._is_opened = true;
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
      if (!db_path) {
        reject(new Error('no property db_path provided.'));
        return;
      }
      this.db_path = db_path;
      //
      // https://nodejs.org/api/fs.html
      // https://nodejs.org/docs/latest-v14.x/api/synopsis.html
      // https://nodejs.org/docs/latest-v14.x/api/fs.html
      if (!fs.existsSync(db_path)) {
        if (!fs.mkdirSync(db_path)) {
          if (this._verbose) console.log(`# Jifdb: (${func_name}) created folder path "${db_path}". `);
        } else {
          const err_msg = `Error: could not create directory = ${db_path}.`;
          if (this._verbose) console.log(`# Jifdb: (${func_name}) ${err_msg} `);
          reject(new Error(err_msg));
          return;
        }
      }
      //
      this.collections = {};
      if (this._verbose) console.log(`# Jifdb: (${func_name}) Jifdb module.app_version = ${this._app_version} `);
      if (this._verbose) console.log(`# Jifdb: (${func_name}) opened DB with db_path = "${db_path}" `);
      resolve();
      //  
    });
  }
  // - - - + - - - 
  close_database() {
    const func_name = 'close_database';
    return new Promise((resolve, reject) => {
      //
      if (!this._is_opened) {
        const err_msg = "Error: can't close DB which is already closed.";
        if (this._verbose) console.log(`# Jifdb: (${func_name}) ${err_msg} `);
        reject(new Error(err_msg));
        return;
      }
      //
      for (let col_name in Object.keys(this.collections)) {
        let col = this.collections[col_name];
        if (col._dirty) {
          col.save();
        }
      }
      //
      this._is_opened = false;
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
      let col_name = props.collection_name; // sanitize ..
      col_name = col_name && typeof(col_name) === 'string' && col_name.trim().length > 0 ? col_name.trim() : null;
      if (!col_name) {
        reject(new Error('no property collection_name provided.'));
        return;
      }
      //
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
            if (this._verbose) console.log(`# Jifdb: (${func_name}) created file: ${file_path} `);
          }
          this.collections[col_name] = new_collection;
        }
      } catch (err) {
        console.error(err);
      }
  
    });
  }
  // - - - + - - - 
  close_collection(props) {
    const func_name = 'close_collection';
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
      if (this._verbose) console.log(`# Jifdb: (${func_name}) removed collection ${col_name} from collections `);
    }
    return success;
  }
  // - - - + - - - 
  delete_collection(props) {
    const func_name = 'delete_collection';
    let success = false;
    const col_name = props.collection_name;
    let file_path = path.join(this.db_path, col_name + ".json");
    if (col_name) {
      success = true
    };
    //
    // if (Object.keys(this.collections).includes(col_name)) {
    //   delete this.collections[col_name];
    //   if (this._verbose) console.log(`# Jifdb: (delete_collection) removed collection ${col_name} from collections `);
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
        if (this._verbose) console.log(`# Jifdb: (${func_name}) unlinked (or renamed) file: ${file_path} `);
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
    this._next_id = 1; // default for new/empty collection
    // public
    this.collection_name = props.collection_name;
    this.file_path = props.file_path;
    this.data = [];
  }
  // - - - + - - - 
  // Private methods:
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
  // - - - + - - - 
  // Public methods:
  save() {
    const func_name = 'save';
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
  // - - - + - - - 
  // CRUD accessors:
  create(props) {
    const func_name = 'create';
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
      if (this._verbose) console.log(`# Jifdb: (${func_name}) ERROR not a valid item: ${JSON.stringify(item)} `);
    }
    return new_item;
  }
  // - - - + - - - 
  read(props) {
    const func_name = 'read';
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