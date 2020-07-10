const { assert } = require('chai');

const { getUserByEmail } = require('../helper.js');

const testUsers = {
  "userRandomID": {
    id: "userRandomID", 
    email: "user@example.com", 
    password: "purple-monkey-dinosaur"
  },
  "user2RandomID": {
    id: "user2RandomID", 
    email: "user2@example.com", 
    password: "dishwasher-funk"
  }
};

describe('getUserByEmail', function() {
  it('should return a user with valid email', function() {
    const user = getUserByEmail("user@example.com", testUsers)
    const expectedOutput = "userRandomID";
    // Write your assert statement here
    assert.strictEqual(user.id, expectedOutput); 
  });
  it('should return a undefined with non-existent email', function() {
    const user = getUserByEmail("abc@example.com", testUsers)
    const expectedOutput = undefined;
    // Write your assert statement here
    assert.strictEqual(user.id, expectedOutput); 
  });
});

