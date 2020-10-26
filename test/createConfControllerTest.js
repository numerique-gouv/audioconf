const chai = require('chai')

const app = require('../index');

describe('createConfController', function() {
  it('should refuse invalid email', function(done) {
    chai.request(app)
      .post('/create-conf')
      .type('form')
      .send({
        email: 'bad.email',
      })
      .end((err, res) => {
        res.should.redirectTo('http://127.0.0.1:8080/')
        done()
      })
  })
})
