const showsRoute = require('./shows');

const  constuctorMethod =  (app) =>{
        app.use('/',showsRoute);
        app.use('*', (req,res)=>{
            res.status(404).render('layouts/main',{title: 'Error', errorMessage: 'The requested resource is not found.'});
        });
    }    

module.exports = constuctorMethod;