"use strict";
const should = require('should');
const JWT = require('jsonwebtoken');
const VanillaConnect = require('../index.js');

const clientId = 'testVC';
const secret = `This is secret key don't tell it anybody!`;

let vc;

describe('VanillaConnect',function(){

    it(`should be able to create new VanillaConnect instance`,function(done){
        vc = new VanillaConnect(clientId,secret,['http://www.testsite.com/*']);
        vc.should.be.instanceof(VanillaConnect);
        done();
    });

    it(`should be able to pass own filling function`,function(done){
       vc.fillUserData = ()=>{
           return Promise.resolve({
               id:1,
               name:'name',
               email:'email',
               photo:'photo'
           })
       };

       vc.fillUserData()
       .then(userData=>{
           userData.id.should.be.equal(1);
           userData.name.should.be.equal("name");
           userData.email.should.be.equal("email");
           userData.photo.should.be.equal("photo");
           done();
       })
    });

    it(`should be able to create response JWT depending on request JWT and user data`,function(done){
        let jwt = JWT.sign({
            "nonce": "VanillaConnect_5a46c49d2827d",
            "version": "1.0.0",
            "redirect": `http://www.testsite.com/authenticate/VanillaConnect/${clientId}`
        },secret,{header:{"azp": clientId},expiresIn:'20m'});
        vc.loginRoute(jwt)
        .then(responseUrl=>{
            responseUrl.should.containEql(`?jwt=`);
            done()
        })
    });

    it(`should be able to filter request JWT expired`,function(done){
        let jwt = JWT.sign({
            "nonce": "VanillaConnect_5a46c49d2827d",
            "version": "1.0.0",
            "redirect": `http://www.testsite.com/authenticate/VanillaConnect/${clientId}`
        },secret,{header:{"azp": clientId},expiresIn:'0m'});
        vc.loginRoute(jwt)
        .catch(err=>{
            err.should.be.instanceof(JWT.TokenExpiredError);
            done();
        })
    });

    it(`should be able to filter request JWT with invalid redirect url`,function(done){
        let jwt = JWT.sign({
            "nonce": "VanillaConnect_5a46c49d2827d",
            "version": "1.0.0",
            "redirect": `http://www.evilsite.com/authenticate/VanillaConnect/${clientId}`
        },secret,{header:{"azp": clientId},expiresIn:'20m'});
        vc.loginRoute(jwt)
        .catch(err=>{
            err.should.be.instanceof(URIError);
            done();
        })
    });
});