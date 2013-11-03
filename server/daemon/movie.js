(function () {
    var YUI = require('yui').YUI,
        db = require('./database');

    YUI().use('yql', 'querystring', function (Y) {
        var source_url = 'http://www.google.com.tw/movies',
            action_id,
            movie_typeid = {},
            queryparam = {
                'near': '台北市',
                'date': 0,
                'sort': 1,
                'start': 0
            };

        function insertMovie(movie, callback) {
            var info,
                type,
                match,
                value = { 'source_url': source_url };

            value.title = movie.div[0].div.h2.a.content;
            value.description = movie.div[0].div.div[1].span[0];
            value.description += movie.div[0].div.div[1].span[2].content;
            info = movie.div[0].div.div[0].p.span || '';
            value.actor = (info instanceof Array ? info : [info]).join(', ');
            info = movie.div[0].div.div[0].p.content || movie.div[0].div.div[0].p;
            match = info.match(/(\d+)小時 (\d+)分鐘/);
            value.spend_time = match[1] * 60 + match[2];
            match = info.match(/- (.*?)\u200e\u200e -/);
            type = match[1];
            value.type_id = movie_typeid[type];
            if (value.type_id) {
                db.insert('movie', value, callback);
            } else {
                db.insert('type', { 'action_id': action_id, 'name': type }, function (err, result) {
                    movie_typeid[type] = result.insertId;
                    value.type_id = movie_typeid[type];
                    db.insert('movie', value, callback);
                });
            }
        }

        function YQL(url) {
            Y.YQL(
                'select * from html where url=\'' + url + '\' and xpath=\'//*[@id="movie_results"]/div/div\'',
                function (data) {
                    var aryMovie = data.query.results ? data.query.results.div : [],
                        count = 0;

                    function callback() {
                        if (count >= aryMovie.length) {
                            queryparam.start += count;
                            YQL(source_url + '?' + Y.QueryString.stringify(queryparam));
                        } else {
                            insertMovie(aryMovie[count++], callback);
                        }
                    }

                    if (aryMovie.length > 0) {
                        insertMovie(aryMovie[count++], callback);
                    } else {
                        db.end();
                    }
                }
            );
        }

        db.select('action', { 'name': '電影' }, function (err, results) {
            if (results.length > 0) {
                action_id = results[0].id;
                db.select('type', { 'action_id': action_id }, function (err, results) {
                    for (var i = 0; i < results.length; i++)
                        movie_typeid[results[i].name] = results[i].id;
                    YQL(source_url + '?' + Y.QueryString.stringify(queryparam));
                });
            } else {
                db.insert('action', { 'category': 'A', 'name': '電影' }, function (err, result) {
                    action_id = result.insertId;
                    YQL(source_url + '?' + Y.QueryString.stringify(queryparam));
                });
            }
        });
    });
})();
