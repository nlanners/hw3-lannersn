const express = require('express');

const app = express();
const PORT = process.env.PORT || 8080;

const bodyParser = require('body-parser');
const {Datastore} = require('@google-cloud/datastore');
const { response } = require('express');
const datastore = new Datastore({
    projectId: 'hw3-lanners'
});

app.use(bodyParser.json());

const BOAT = 'Boats';
const SLIP = 'Slips';


function fromDatastore(item) {
    item.id = item[Datastore.KEY].id;
    return item;
}

/* Model Functions */

function post_boat(name, type, length){
    let key = datastore.key(BOAT);
    const new_boat = {"name":name, "type":type, "length":length};
    return datastore.save({"key":key, "data":new_boat})
        .then( () => {
            new_boat.id = key.id;
            return new_boat;
        } )
        .catch( err => console.log(err) );
}

function get_all_boats() {
    const q = datastore.createQuery(BOAT);
    return datastore.runQuery(q).then( (entities) => {
        return entities[0].map(fromDatastore);
    })
}

function get_boat(id) {
    const q = datastore
        .createQuery(BOAT)
        .filter('__key__', '=', datastore.key([BOAT, parseInt(id, 10)]));
    return datastore.runQuery(q).then( (entities) => {
        return entities[0].map(fromDatastore);
    })
    .catch(err => console.log(err));
}

async function patch_boat(id, name, type, length) {
    const key = datastore.key([BOAT, parseInt(id, 10)]);
    const boat = {"name": name, "type": type, "length": length};

    const boats = await get_all_boats();
    
    for (const entry of boats) {
        if (entry.id == id) {
            return datastore.save({"key":key, "data":boat})
                .then( (response) => {
                    if (response) {return boat} })
                .catch( err => console.log(err) );
        }
    }
    return 0;
}

function delete_boat(id) {
    const key = datastore.key([BOAT, parseInt(id,10)]);
    return datastore.delete(key);
}

function post_slip(number) {
    let key = datastore.key(SLIP);
    const new_slip = {"number": number, "current_boat": null};
    return datastore.save({"key":key, "data":new_slip})
        .then( () => {
            new_slip.id = key.id;
            return new_slip;
        }).catch( err => console.log(err) );
}

function get_slip(id) {
    const q = datastore
        .createQuery(SLIP)
        .filter('__key__', '=', datastore.key([SLIP, parseInt(id, 10)]));
    return datastore.runQuery(q).then( (entities) => {
        return entities[0].map(fromDatastore);
    })
    .catch(err => console.log(err));
}

function get_all_slips() {
    const q = datastore.createQuery(SLIP);
    return datastore.runQuery(q).then( (entities) => {
        return entities[0].map(fromDatastore);
    })
}

function delete_slip(id) {
    const key = datastore.key([SLIP, parseInt(id, 10)]);
    return datastore.delete(key);
}

/* Routes */

// CREATE a boat in database
app.post('/boats', (req, res) => {
    if (req.body.name && req.body.type && req.body.length) {
        post_boat(req.body.name, req.body.type, req.body.length)
        .then( boat => {res.status(201).json( boat )} )
        .catch( err => {
            res.status(400).json(
                {"Error": "Something went wrong creating the boat. Please try again."}
                )
            } 
        );
    } else {
        res.status(400).json(
            {"Error": "The request object is missing at least one of the required attributes."}
        );
    }
    
});

// READ all boats in database
app.get('/boats', (req, res) => {
    get_all_boats()
    .then( (boats) => {
        res.status(200).json(boats);
    })
    .catch( err => console.log(err) );
});

// READ one boat from database
app.get('/boats/:boat_id', (req, res) => {
    get_boat(req.params.boat_id)
    .then( (boat) => {
        if (boat.length > 0) {
            res.status(200).json(boat[0]);
        } else {
            res.status(404).json({"Error": "No boat with this boat_id exists"});
        }
    }).catch( err => console.log(err));
})

// UPDATE a boat in database
app.patch('/boats/:boat_id', (req, res) => {
    if (req.body.name && req.body.type && req.body.length) {
        patch_boat(req.params.boat_id, req.body.name, req.body.type, req.body.length)
        .then( (boat) => {
            if (boat) {
                console.log(boat[0]);
                res.status(200).json(boat);
            } else {
                res.status(404).json({"Error": "No boat with this boat_id exists"});
            }
            
        } )
        .catch( err => console.log(err) );
    } else {
        res.status(400).json(
            {"Error": "The request object is missing at least on of the required attributes"}
        );
    }
    
        
})

// DELETE a boat from database
app.delete('/boats/:boat_id', (req, res) => {
    delete_boat(req.params.boat_id)
    .then( (stuff) => { 
        if(stuff[0].indexUpdates == 0) {
            res.status(404).json({"Error":"No boat with this boat_id exists"});
        } else {
            res.status(202).end();
        }
    }).catch( err => {
        console.log(err);
    });
});

// CREATE a slip
app.post('/slips', (req, res) => {
    if (req.body.number) {
        post_slip(req.body.number)
        .then( slip => {res.status(201).json( slip )} )
        .catch( err => {
            res.status(400).json(
                {"Error": "Something went wrong creating the slip. Please try again."}
                )
            } 
        );
    } else {
        res.status(400).json(
            {"Error": "The request object is missing the required number."}
        );
    }
})

// READ a slip
app.get('/slips/:slip_id', (req, res) => {
    get_slip(req.params.slip_id)
    .then( (slip) => {
        if (slip.length > 0) {
            res.status(200).json(slip[0]);
        } else {
            res.status(404).json({"Error": "No boat with this slip_id exists"});
        }
    }).catch( err => console.log(err));
})

// READ all slips
app.get('/slips', (req, res) => {
    get_all_slips()
    .then( (slips) => {
        res.status(200).json(slips);
    })
    .catch( err => console.log(err) );
})

// DELETE a slip
app.delete('/slips/:slip_id', (req, res) => {
    delete_slip(req.params.slip_id)
    .then( (stuff) => { 
        if(stuff[0].indexUpdates == 0) {
            res.status(404).json({"Error":"No boat with this boat_id exists"});
        } else {
            res.status(202).end();
        }
    }).catch( err => {
        console.log(err);
    });
})

// Boat arrives at a Slip
app.put('/slips/:slip_id/:boat_id', (req, res) => {
    
})

app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}...`);
});