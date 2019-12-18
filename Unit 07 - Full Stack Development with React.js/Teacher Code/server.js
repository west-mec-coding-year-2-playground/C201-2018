import config from './config';
import apiRouter from './api'; 
const express = require('express');
const server = express();

server.set('view engine', 'ejs');

server.get('/', (req, res) => {
    res.render('index', {
        content: "Hello Express and <em>EJS</em>!"
    });
});

server.use('/api', apiRouter);
server.use(express.static('public'));

server.listen(config.port, () => {
    console.info('Server listening on port: %s', config.port);
});
