(function () {
    var YUI = require('yui').YUI,
        db = require('./database');

    YUI().use('yql', 'io-base', function (Y) {
        var source_url = 'http://cloud.culture.tw/frontsite/trans/emapOpenDataAction.do?method=exportEmapJson&typeId=E';

        function parseView(type_id) {
            Y.io(source_url, {
                method: 'GET',
                on: {
                    success: function (id, e) {
                        var aryRes = JSON.parse(e.responseText),
                            baseURL = 'http://www.boch.gov.tw',
                            indexRes = 0;

                        function parseRes(res) {
                            var objRes = {};

                            if (res.headCityName == '臺北市') {
                                objRes = {
                                    'type_id': type_id,
                                    'title': res.name,
                                    'address': res.cityName + res.address,
                                    'source_url': res.srcWebsite,
                                    'latitude': res.latitude,
                                    'longitude': res.longitude,
                                };

                                Y.YQL(
                                    'select * from html where url=\'' + objRes.source_url + '\' ' +
                                    'and xpath=\'//*[@id="bigImageTop"]\' and compat=\'html5\'',
                                    function (data) {
                                        objRes.image_url = baseURL + data.query.results.img.src;

                                    }
                                );
                            }
                        }

                        parseRes(aryRes[indexRes++]);
                    }
                }
            });
        }

        db.select('action', { 'category': 'V' }, function (err, results) {
            var action_id = {},
                action_name = '文化景觀';

            for (var i = 0; i < results.length; i++)
                action_id[results[i].name] = results[i].id;

            function parseType() {
                var type_id = {},
                    type_name = action_name;

                db.select('type', { 'action_id': action_id[action_name] }, function (err, results) {
                    for (var i = 0; i < results.length; i++)
                        type_id[results[i].name] = results[i].id;

                    if (type_id[type_name]) {
                        parseView(type_id[type_name]);
                    } else {
                        db.insert('type', { 'action_id': action_id[action_name], 'name': type_name }, function (err, result) {
                            type_id[type_name] = result.insertId;
                            parseView(type_id[type_name]);
                        });
                    }
                });
            }

            if (action_id[action_name]) {
                parseType();
            } else {
                db.insert('action', { 'category': 'V', 'name': action_name }, function (err, result) {
                    action_id[action_name] = result.insertId;
                    parseType();
                });
            }
        });
    });

})();
