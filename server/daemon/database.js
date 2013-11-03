(function () {
    var mysql = require('mysql'),
        connection = mysql.createConnection({
            'host': 'localhost',
            'user': 'date4fun',
            'password': 'date4fun@mysql',
            'database': 'date4fun'
        });

    connection.connect(function (error) {
        if (error) {
            return console.log('CONNECTION error: ' + error);
        }
    });

    exports.select = function (table, value, callback) {
        connection.query('select id, name from ?? where ?', [table, value], callback);
    };

    exports.selectAll = function (table, callback) {
        connection.query('select id, title from ??', [table], callback);
    };

    exports.insert = function (table, value, callback) {
        connection.query('insert into ?? set ?', [table, value], callback);
    };

    exports.end = function () {
        connection.end();
    };
})();
