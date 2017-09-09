/**
 * Created by Elias Elgarten on 9/7/2017.
 */
var express = require('express');
var app = express();

app.use(express.static(__dirname + "/public"));

// get drones from the external API
app.get('/getDrones', function (req, res) {
    var request = require('request');
    
    request('https://codetest.kube.getswift.co/drones', function (err, result, body) {
        if (!err) {
            return res.json(body);
        }
        else return res.send(err);
    })
});

// get packages from the external API
app.get('/getPackages', function (req, res) {
    var request = require('request');

    request('https://codetest.kube.getswift.co/packages', function (err, result, body) {
        if (!err) {
            return res.json(body);
        }
        else return res.send(err);
    })
});


app.listen(3000);
console.log("server running on port 3000");