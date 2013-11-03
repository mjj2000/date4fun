(function () {
    var YUI = require('yui').YUI,
        db = require('./database');

    YUI().use('yql', 'querystring', function (Y) {
        var source_url = 'http://www.google.com.tw/movies',
            movie_id = {},
            theater_id = {},
            date = new Date(),
            datestr = [date.getFullYear(), date.getMonth() + 1, date.getDate()].join('-'),
            tomorrow = new Date(),
            tomorrowstr = '',
            queryparam = {
                'near': '台北市',
                'date': 0,
                'start': 0
            };

        tomorrow.setDate(date.getDate() + 1);
        tomorrowstr = [tomorrow.getFullYear(), tomorrow.getMonth() + 1, tomorrow.getDate()].join('-');

        function insertMovieTheater(movie, callback) {
            var info,
                match,
                index = 0,
                list = [],
                movie_title,
                theater_title;

            theater_title = movie.div[0].h2.a.content;
            for (var i = 0; i < movie.div[1].div.length; i++) {
                for (var j = 0; j < movie.div[1].div[i].div.length; j++) {
                    movie_title = movie.div[1].div[i].div[j].div[0].a.content;
                    for (var k = 0; k < movie.div[1].div[i].div[j].div[1].p.span.length; k++) {
                        info = movie.div[1].div[i].div[j].div[1].p.span[k].content;
                        match = info.match(/(\d+):(\d+)/);
                        list.push({
                            'movie_id': movie_id[movie_title],
                            'theater_id': theater_id[theater_title],
                            'start': (match[1][0] == '0' ? tomorrowstr : datestr) + ' ' + match[1] + ':' + match[2]
                        });
                    }
                }
            }

            function insertList() {
                if (index < list.length)
                    db.insert('movie_theater', list[index++], insertList);
                else
                    callback();
            }

            insertList();
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
                            insertMovieTheater(aryTheater[count++], callback);
                        }
                    }

                    if (aryTheater.length > 0) {
                        insertMovieTheater(aryTheater[count++], callback);
                    } else {
                        db.end();
                    }
                }
            );
        }

        db.selectAll('movie', function (err, results) {
            for (var i = 0; i < results.length; i++)
                movie_id[results[i].title] = results[i].id;

            db.selectAll('theater', function (err, results) {
                for (var i = 0; i < results.length; i++)
                    theater_id[results[i].title] = results[i].id;

                YQL(source_url + '?' + Y.QueryString.stringify(queryparam));
            });
        });
    });
})();
