const express = require('express');

const app = express();
const PORT = process.env.PORT || 8080;

const bodyParser = require('body-parser');
const {Datastore} = require('@google-cloud/datastore');
const datastore = new Datastore({
    projectId: 'hw3-lannersn'
})

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

async function getBoat(boatId) {
    const boat = await datastore.get(boatId);
    
    if (boat) {
        return boat;
    } else {
        return 404;
    }
}

function createBoat(boatObject) {
    const entity = {
        key: datastore.key('Boat'),
        data: boatObject
    }

    datastore.insert(entity).then( (response) => {
        return response;
    });
}



app.post('/boats', (req, res) => {
    if (!req.body.name || !req.body.type || !req.body.length) {
        res.status(400);
        res.send({"Error": "The request object is missing at least one of the required attributes"});
    } else {
        res.status(201);
        const createdBoat = createBoat(req.body);
        res.send(createdBoat);
    }
})

app.get('/boats/:boat_id', (req, res) => {
    let boat = getBoat(req.query.boat_id)
        .then(() => {
            if (boat == 404) {
                res.status = 404;
                res.send({"Error": "No boat with this boat_id exists"});
            } else {
                res.status = 201;
                res.send(boat);
        }})
    
})



app.listen(PORT, () => {
    console.log("Server listening on port " + PORT);
})