const VanillaConnect = require('./index');

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