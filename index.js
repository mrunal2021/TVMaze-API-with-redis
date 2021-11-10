const express = require('express');
const exphbs = require('express-handlebars');
const configureRoutes = require('./routes');
const static = express.static(__dirname + '/public');

const app = express();

app.use('/public', static);
app.use(express.json());
app.use(express.urlencoded({extended:true, encoded:true}));

app.engine('handlebars', exphbs({defaultLayout: 'main'}));
app.set('view engine', 'handlebars');

configureRoutes(app);

app.listen(3000, ()=>{
    console.log('We have now got a server!');
    console.log('Routes will be running on http://localhost:3000');
});