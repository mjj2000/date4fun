(function () {
    var YUI = require('yui').YUI,
        db = require('./database');

    YUI().use('yql', 'querystring', function (Y) {
        var source_url = 'http://www.google.com.tw/movies',
            queryparam = {
                'near': '台北市',
                'date': 0,
                'start': 0
            };

        function insertTheater(movie, callback) {
            var info,
                match,
                value = {};

            value.title = movie.div[0].h2.a.content;
            info = movie.div[0].div.p.content || '';
            match = info.match(/(.*) - (\d+) (\d+) (\d+)/);
            value.tel = '(' + match[2] + ')' + match[3] + match[4];
            value.address = match[1];

            Y.YQL(
                'select * from geo.placefinder where text="' + value.address.replace(/\(.*\)/, '') + '"',
                function (data) {
                    var geo = data.query.results.Result;
                    value.latitude = geo.latitude;
                    value.longitude = geo.longitude;
                    db.insert('theater', value, callback);
                }
            );
        }

        function YQL(url) {
            Y.YQL(
                'select * from html where url=\'' + url + '\' and xpath=\'//*[@id="movie_results"]/div/div\'',
                function (data) {
                    var aryTheater = data.query.results ? data.query.results.div : [],
                        count = 0;

                    function callback() {
                        if (count >= aryTheater.length) {
                            queryparam.start += count;
                            YQL(source_url + '?' + Y.QueryString.stringify(queryparam));
                        } else {
                            insertTheater(aryTheater[count++], callback);
                        }
                    }

                    if (aryTheater.length > 0) {
                        insertTheater(aryTheater[count++], callback);
                    } else {
                        db.end();
                    }
                }
            );
        }

        YQL(source_url + '?' + Y.QueryString.stringify(queryparam));
    });
})();
