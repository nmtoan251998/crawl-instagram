const express = require('express');
const server = express();
const path = require('path');
const axios = require('axios');

const pupperteer = require('./pupperteer');

const PORT = 2999;

server.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
}); 

pupperteer.getData();

server.listen(PORT, () => console.log(`Server is listening on port: ${PORT}`));