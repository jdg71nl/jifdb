// jifdb: test/test.js
// this test is built on: https://mochajs.org/
// - - - - - - + + + - - - - - - - - - - - - + + + - - - - - - - - - - - - + + + - - - - - - 

// https://nodejs.org/api/assert.html
const assert = require('assert');
//
// function describe(){}
// function it(){}

// - - - - - - + + + - - - - - - - - - - - - + + + - - - - - - - - - - - - + + + - - - - - - 
// utility functions

function _isObject(val) {
  if (val === null) { return false;}
  return ( (typeof val === 'function') || (typeof val === 'object') );
}

// https://stackoverflow.com/questions/64112027/find-duplicates-in-array-of-objects-with-different-keys-in-javascript
function _commonIDs(arr) {
  const count = {};
  // arr.forEach((obj) =>
  //   Object.keys(obj).forEach(
  //     (key) => (count[key] = (count[key] ?? 0) + 1)
  //   )
  // );
  // return Object.keys(count).filter((key) => count[key] >= arr.length);
  arr.forEach((obj) => count[obj.id] = (count[obj.id] ?? 0) + 1);
  // console.log(`# count=${JSON.stringify(count)} `);
  const doubles = Object.keys(count).filter((id) => count[id] > 1);
  // console.log(`# doubles=${JSON.stringify(doubles)} `);
  return doubles;
};

function _is_empty_array(arr) {
  // return (typeof arr !== 'undefined' && arr.length === 0);
  // const typeof_arr = typeof arr;
  // console.log(`# typeof_arr=${typeof_arr} `);
  // return (typeof_arr === 'array' && arr.length === 0);
  return (arr && Array.isArray(arr) && arr.length === 0);
}

// - - - - - - + + + - - - - - - - - - - - - + + + - - - - - - - - - - - - + + + - - - - - - 
// start test

const path = require('path');
const jif_db = require('../index');

const db_path = path.join(__dirname, 'jifdb');
jif_db.open_database({ db_path: db_path, verbose: true });
//
describe('open_database', function() {
  it('should open and optionally create the db_path folder', function() {
    assert.equal( jif_db.db_path, db_path );
  });
});

const del_success = jif_db.delete_collection({collection_name: "users"});
//
describe('delete_collection', function() {
  it('should close and remove (or rename backup) any JSON file with the collection_name', function() {
    assert.equal( del_success, true );
  });
});

let users = jif_db.open_collection({collection_name: "users"});
//
describe('open_collection', function() {
  it('should open and optionally create a JSON file with the collection_name and read and return the contents of that file as an Array', function() {
    assert.equal( Array.isArray(users.data), true );
  });
});

let new_user1 = users.create({item:{ firstname: "test firstname1", lastname: "test lastname1" }});
let new_user2 = users.create({item:{ firstname: "test firstname2", lastname: "test lastname2" }});
let new_user3 = users.create({item:{ firstname: "test firstname3", lastname: "test lastname3" }});
users.save();
//
// if (!new_user1) new_user1 = {id:0};
// if (!new_user2) new_user2 = {id:0};
// if (!new_user3) new_user3 = {id:0};
// const user_array = [new_user1, new_user2, new_user3];
// const unique = [...new Set(user_array.map(item => item.id))];
const commonKeys = _commonIDs(users.data);
//
describe('create', function() {
  describe('new_user1', function() {
    it('should add the object to the collection (array) and assign an unique .id to this object', function() {
      assert.equal( _isObject(new_user1), true );
    });
  });
  describe('new_user1', function() {
    it('should add the object to the collection (array) and assign an unique .id to this object', function() {
      assert.equal( _isObject(new_user2), true );
    });
  });
  describe('new_user1', function() {
    it('should add the object to the collection (array) and assign an unique .id to this object', function() {
      assert.equal( _isObject(new_user3), true );
    });
  });
  describe('unique item.id', function() {
    it('the users collection should have objects with unique .id keys', function() {
      // assert.deepEqual(user_array, [1,2,3]);
      assert.equal( _is_empty_array(commonKeys), true );
    });
  });
});

let get_users = users.read({});
//
describe('read()', function() {
  it('should return all items in the collection', function() {
    assert.equal( get_users.length, 3 );
  });
});

// - - - - - - + + + - - - - - - - - - - - - + + + - - - - - - - - - - - - + + + - - - - - - 
//-EOF
