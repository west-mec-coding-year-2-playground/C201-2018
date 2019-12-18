var fs = require('fs');

//var jsonString = '{ "name": "Mark"}';

var jsonString = { 
    name: 'Mark'
};

fs.writeFile('data2.json', JSON.stringify(jsonString), function(err) {
    if (err) {
        console.log(err);
    }
});
