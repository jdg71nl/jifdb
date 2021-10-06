// jifdb: test/test.js
// this test is built on: https://mochajs.org/

// https://nodejs.org/api/assert.html
const assert = require('assert');

function isObject(val) {
  if (val === null) { return false;}
  return ( (typeof val === 'function') || (typeof val === 'object') );
}

describe('Array', function() {
  describe('#indexOf()', function() {
    it('should return -1 when the value is not present', function() {
      assert.equal([1, 2, 3].indexOf(4), -1);
    });
  });
});

const path = require('path');
const jif_db = require('./index');

const db_path = path.join(__dirname, 'jifdb');
jif_db.open_database({ db_path: db_path, show_debug: true });
//
describe('open_database', function() {
  it('should open and optionally create the db_path folder', function() {
    assert.equal( jif_db.db_path, db_path );
  });
});

jif_db.clear_collection({collection_name: "users"});

let users = jif_db.get_collection({collection_name: "users"});
//
describe('get_collection', function() {
  it('should open and optionally create a JSON file with the collection_name and read and return the contents of that file as an Array', function() {
    assert.equal( Array.isArray(users), true );
  });
});

let new_user1 = users.add_item({ firstname: "test firstname1", lastname: "test lastname1" });
let new_user2 = users.add_item({ firstname: "test firstname2", lastname: "test lastname2" });
let new_user3 = users.add_item({ firstname: "test firstname3", lastname: "test lastname3" });
//
if (!new_user1) new_user1 = {id:0};
if (!new_user2) new_user2 = {id:0};
if (!new_user3) new_user3 = {id:0};
const user_array = [new_user1, new_user2, new_user3];
const unique = [...new Set(user_array.map(item => item.id))];
//
describe('add_item', function() {
  describe('new_user1', function() {
    it('should add the object to the collection (array) and assign an unique .id to this object', function() {
      assert.equal( isObject(new_user1), true );
    });
  });
  describe('new_user1', function() {
    it('should add the object to the collection (array) and assign an unique .id to this object', function() {
      assert.equal( isObject(new_user2), true );
    });
  });
  describe('new_user1', function() {
    it('should add the object to the collection (array) and assign an unique .id to this object', function() {
      assert.equal( isObject(new_user3), true );
    });
  });
  describe('user_array', function() {
    it('user_array is the tested array of 3 new users and should have objects with unique .id keys', function() {
      assert.deepEqual(user_array, [1,2,3]);
    });
  });
});

let get_users = users.data;
//
describe('get_collection', function() {
  it('should open and optionally create a JSON file with the collection_name and read and return the contents of that file as an Array', function() {
    assert.equal( Array.isArray(users), true );
  });
});

//-EOF
