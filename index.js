'use strict';
const jwt = require('jsonwebtoken');
const urlWhitelist = require('url-whitelist');

const NAME = 'VanillaConnect';
const VERSION = '1.0.0';

class VanillaConnect{
    constructor(clientId,secret,whitelist=[],algorithm="HS256",timeout='20m'){
        if(!clientId) throw new Error(`ClientID cannot be empty.`);
        if(!secret) throw new Error(`Secret cannot be empty.`);
        if(!Array.isArray(whitelist)) throw new Error(`Whilelist should be an array`);

        this.clientId = clientId;
        this.secret = secret;
        this.algorithm = algorithm;
        this.timeout = timeout;

        this.whitelist = urlWhitelist();
        whitelist.forEach(url=>{this.whitelist.include(url)});
    }

    createAuthJWT(claim){
        return new Promise((res,rej)=>{
            let object = Object.assign({version:VERSION},claim);
            jwt.sign(object,this.secret,{algorithm:this.algorithm,expiresIn:this.timeout,header:{azp:this.clientId}},(err,token)=>{
                if(err) return rej(err);
                return res(token);
            })
        })
    }

    verify(token){
        return new Promise((res,rej)=>{
            return jwt.verify(token,this.secret,(err,decoded)=>{
                if(err) return rej(err);
                return res(decoded);
            })
        })
    }

    /***
     * Promise that should fill user data
     * @returns {Promise.<{id: string, name: string, email: string, photo: string}>}
     */
    fillUserData(){
        console.error(new Error(`You must override this method to fill your user data`));
        return Promise.resolve({
            id:'',
            name:'',
            email:'',
            photo:''
        })
    }

    //Берём юрл, nonce который нам дал сервер
    //Генерируем JWT и отвечаем серверу используя его данные
    loginRoute(jwt){
        return this.verify(jwt)
        .then(data=>{
            if(!data.redirect) throw new Error(`Invalid redirect`);
            if(!data.nonce) throw new Error(`Invalid nonce`);
            if(!this.whitelist.check(data.redirect)) throw new URIError(`URI Not whitelisted`);
            return this.fillUserData()
            .then(userData=>{
                if(!userData) throw new Error(`Invalid user data`);
                if(!userData.id) throw new Error(`Property 'id' is required`);
                return this.createAuthJWT(Object.assign({nonce:data.nonce},userData))
            })
            .then(jwt=>{
                return `${data.redirect}?jwt=${jwt}`
            })
        })
    }
}

module.exports = VanillaConnect;