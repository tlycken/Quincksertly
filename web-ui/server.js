var path = require('path'),
    express = require('express'),
    bodyParser = require('body-parser'),
    app = express();

app.use('/', express.static(path.join(__dirname, 'public')));

app.listen(7400, function() { console.log('node4j UI listening on http://localhost:7400'); });
