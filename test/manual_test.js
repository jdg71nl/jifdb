// jifdb: test/manual_test.js
// - - - - - - + + + - - - - - - - - - - - - + + + - - - - - - - - - - - - + + + - - - - - - 

const path = require('path');
const db_path = path.join(__dirname, 'jifdb');
// console.log(`# manual_test.js: db_path = ${db_path} `);

const jif_db = require('../index'); // import 'jifdb' module from local dir
const verbose = true;

// [TEST] should fail if invalid db_path:
// jif_db.open_database({ db_path: 123, verbose: verbose })
//   .then(() => { console.log('# manual_test.js: Connected to JifDB ...'); })
//   .catch(err => {
//     console.error(`# manual_test.js: Error.message = ${err.message} `);
//     // // process.exitCode = 1; //  <== optional
//     // process.exit(1);  // https://nodejs.dev/learn/how-to-exit-from-a-nodejs-program
//   })
// ;

// [TEST] should open if valid db_path:
jif_db.open_database({ db_path: db_path, verbose: verbose })
  .then(() => { console.log('# manual_test.js: Connected to JifDB ...'); })
  .catch(err => {
    console.error(`# manual_test.js: Error.message = ${err.message} `);
  })
;

// console.log(`# manual_test.js: before `);
// setTimeout(() => {
//   console.log(`# manual_test.js: setTimeout-callback `);
// }, 3000);
// console.log(`# manual_test.js: after `);
//
// console.log(`# manual_test.js: waiting 3000 ms ...`);
// setTimeout(() => { console.log(`# manual_test.js: ... waiting done!`); }, 3000);

// [TEST] should fail if already open before:
// jif_db.open_database({ db_path: db_path, verbose: true })
//   .then(() => { console.log('# manual_test.js: Connected to JifDB ...'); })
//   .catch(err => {
//     console.error(`# manual_test.js: Error.message = ${err.message} `);
//     process.exit(1);
//   })
// ;

// [TEST] should close:
// jif_db.close_database()
//   .then(() => { console.log('# manual_test.js: Closed JifDB.'); })
//   .catch(err => {
//     console.error(`# manual_test.js: Error.message = ${err.message} `);
//     process.exit(1);
//   })
// ;

// [TEST] should fail if already closed before:
// jif_db.close_database()
// .then(() => { console.log('# manual_test.js: Closed JifDB.'); })
// .catch(err => {
//   console.error(`# manual_test.js: Error.message = ${err.message} `);
//   process.exit(1);
//   })
// ;


// const del_success = jif_db.delete_collection({collection_name: "users"});

// let users = jif_db.open_collection({collection_name: "users"});

// let new_user1 = users.create({item:{ firstname: "test firstname1", lastname: "test lastname1" }});
// let new_user2 = users.create({item:{ firstname: "test firstname2", lastname: "test lastname2" }});
// let new_user3 = users.create({item:{ firstname: "test firstname3", lastname: "test lastname3" }});
// users.save();

// let get_users = users.read({});

// console.log(`# manual_test.js: EOF.`);

// - - - - - - + + + - - - - - - - - - - - - + + + - - - - - - - - - - - - + + + - - - - - - 
//-EOF
