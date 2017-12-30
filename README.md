# VanillaConnect Library for Node.js

VanillaConnect Library contains everything you need to use the VanillaConnect plugins with a Node.js Project.

## How it works

As the provider, you will receive signed authentication requests.
If the user that issued the request is currently logged on you will be able to issue an authentication response
containing the user information (also known as "[claim](#claim)") that will log in the user on your forum.

### ClientID & Secret

The **ClientID** is used to identify the issuer of the authentication request. It will be specified inside a JSON Web Token (JWT).
This tells you from "where" the authentication request is coming from.

The **Secret** is used to sign the JWT. This ensures that both the issuer and the provider are who they claim to be.
**Never expose or give your secret to anyone.**

### Claim

The claim is the "body" of the JWT. When authenticating a request you need to provide the user's information so that we can put them
in the response JWT.

Usually the response's claim contains the following fields:
- id: **Unique** identifier of the user on your your platform. This is usually a number but can be any string.
- name: The name of the user.
- email: The email of the user.
- photo: The url of the photo of the user.
- roles: A comma separated list of Vanilla's roles name.

*Everything is optional but "id". "name" and "email" are necessary if you want users to be created automatically on Vanilla's side.*

### URLs Whitelisting

The provider needs to whitelist every URL that can receive a response.

#### Why?

This security measure makes sure that the authentication response is sent to a trusted party.
When an authentication request is made, the JWT's claim will contain the redirect URL
to which the authentication response should be sent to. That URL must have been "whitelisted" by the provider
otherwise the response's claim will be replaced by an error.

#### How?

You just create a list of every URLs `{Scheme}{UserPwd}{Host}{Path}` that are whitelisted.

If you **really need to** you can use wildcards (__*__) to specify that this part of the URL can be anything.
It is best if you can avoid using wildcards because they weaken the security of the whitelist.

- Scheme: Can be `https://`, `http://` or `//` if you want to allow both. *You cannot use wildcards here.*
- UserPwd: *(Optional)* You will probably not need this. Looks like this: `user:password@`.
- Host: Can be an IP address or a domain name. You can optionally specify a port too.
  - _Note that for domains, for security reasons, you cannot use a wildcards for the TLD or main domain._
- Path: Needs to start with `/`. Usually, it should be `/authenticate/vanilla-connect/{clientID}`

Example: `https://forum.yourdomain.com/authenticate/vanilla-connect/1234`.

Notes:
- The query string and fragment parts of the URLs are not validated and must not be present in the whitelist URL.
- The validation is case insensitive.

*For more example check the [Usage example](#usage-exampe) section.*

## Usage example (using Express framework)

```javascript

const VanillaConnect = require('vanilla-connect');

const express = require('express');
const app = express();

// Create new instance of VanillaConnect using ClientId, secret and whitelist array
const vanillaConnect = new VanillaConnect('clientId','secret',[`http://yoursite/*`]);

// Using express route
app.get('/vanilla-connect', function (req, res) {

    // Pass custom function to fill user data from any external source like database
    // This function must return Promise with an object of user data
    vanillaConnect.fillUserData = ()=>{
        return Promise.resolve({
            id:'UserId',    // Required
            name:'UserName',
            email:'UserEmail@domain.com',
            photo:'https://somephotosite.com/user.jpg'
        })
    };

    // Validate the request
    // If no user is logged in, you should redirect to your login page while preserving the JWT
    // and once the user is logged in you redirect back to this page with the JWT.
    // Example:
    // https://yourdomain.com/vanilla-connect?jwt={TOKEN} // The user is not logged so redirect.
    // https://yourdomain.com/signin?redirect=%2Fvanilla-connect%3Fjwt%3D{TOKEN} // The user logs in. Redirect back to vanilla-connect.
    // https://yourdomain.com/vanilla-connect?jwt={TOKEN} // Now you should have the user informations.
    vanillaConnect.loginRoute(req.query.jwt)
        .then(url=>{
            //Everything is OK. Redirect back to the issuer with the response.
            res.redirect(url);
        })
});

app.listen(3000, function () {
    console.log('Example app listening on port 3000!');
});
```