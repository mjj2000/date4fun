(function () {
    var YUI = require('yui').YUI,
        db = require('./database'),
        GooglePlaces = require('google-places'),
        places = new GooglePlaces('AIzaSyC0Bwq5pJ99K2rbB35ujmjJ86ArZiURKcI');
    
    YUI().use('yql', function (Y) {

        var aryNightview = [
                { name: '象山', input: '象山親山步道', value: 5 },
                { name: '樹林大同山', input: '大同山登山步道', value: 3 },
                { name: '汐止大尖山', input: '汐止大尖山', value: 5 },
                { name: '陽明山', input: '陽明山國家公園', value: 4 },
                { name: '101', input: '台北101購物中心', value: 3 },
                { name: '內湖五指山', input: '內雙溪森林自然公園', value: 5 },
                { name: '貓空', input: '台北市文山區貓空纜車貓空站', value: 4 },
                //{ name: '文化大學後山', input: '文化大學後山', value: 4 },
                { name: '中和烘爐地', input: '中和烘爐地', value: 3 },
                { name: '木柵仙跡岩', input: '仙跡岩', value: 2 },
                { name: '內湖碧山巖', input: '內湖碧山巖', value: 3 },
                { name: '五股觀音山', input: '觀音山遊客中心', value: 2 },
                { name: '汐止拉瓦那咖啡', input: '汐止拉瓦那咖啡', value: 3 },
                { name: '士林區劍南山', input: '台北市士林區劍南山', value: 3 },
                { name: '北投軍艦岩', input: '北投軍艦岩', value: 3 }
            ],
            indexNightView = 0;


        function parseContent(type_id, nightview) {
            places.autocomplete({ input: nightview.input }, function(err, response) {
                places.details({ reference: response.predictions[0].reference, language: 'zh-TW' }, function (err, response) {

                    var res = response.result,
                        objRes = {
                            'type_id': type_id,
                            'title': nightview.name,
                            'address': res.formatted_address,
                            'value': Math.round(res.rating) || nightview.value,
                            'source_url': res.url,
                            'latitude': res.geometry.location.lat,
                            'longitude': res.geometry.location.lng,
                            'description': res.reviews && res.reviews[0].text || ''
                        };

                    function callbackRes() {
                        if (indexNightView >= aryNightview.length) {
                            db.end();
                        } else {
                            parseContent(type_id, aryNightview[indexNightView++]);
                        }
                    }

                    Y.YQL(
                        'select * from html where url=\'' + objRes.source_url + '\' ' +
                        'and xpath=\'//*[@id="contentPane"]/div/div[2]/div/div/div[1]/div/div[2]/div/div[1]/div/div/div/img\' and compat=\'html5\'',
                        function (data) {
                            if (data.query.results && data.query.results.img)
                                objRes.image_url = data.query.results.img.src;

                            db.insert('view', objRes, callbackRes);
                        }
                    );
                });
            });
        }

        db.select('action', { 'category': 'V' }, function (err, results) {
            var action_id = {},
                action_name = '夜景';

            for (var i = 0; i < results.length; i++)
                action_id[results[i].name] = results[i].id;

            function parseType() {
                var type_id = {},
                    type_name = action_name;

                db.select('type', { 'action_id': action_id[action_name] }, function (err, results) {
                    for (var i = 0; i < results.length; i++)
                        type_id[results[i].name] = results[i].id;

                    if (type_id[type_name]) {
                        parseContent(type_id[type_name], aryNightview[indexNightView++]);
                    } else {
                        db.insert('type', { 'action_id': action_id[action_name], 'name': type_name }, function (err, result) {
                            type_id[type_name] = result.insertId;
                            parseContent(type_id[type_name], aryNightview[indexNightView++]);
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
        })

    });
})();


