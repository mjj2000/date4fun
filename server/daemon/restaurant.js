(function () {
    var YUI = require('yui').YUI,
        db = require('./database');

    YUI().use('yql', function (Y) {
        var source_url = 'http://www.ipeen.com.tw',
            retry = 0;

        function parseRestaurant(type_id, uri, callback) {
            var url = source_url + uri;

            Y.YQL(
                'select * from html where url=\'' + url + '\' ' +
                'and xpath=\'//*[@id="search"]/article/div[2]/section/article\' and compat=\'html5\'',
                function (data) {
                    if (!data.query.results && retry++ < 3) {
                        parseRestaurant(type_id, uri, callback);
                        return;
                    }

                    retry = 0;

                    if (!data.query.results || !data.query.results.article) {
                        callback();
                        return;
                    }

                    var aryRes = data.query.results.article,
                        indexRes = 0;

                    function parseRes(res) {
                        var m,
                            objRes = {
                                'type_id': type_id,
                                'title': res.div[0].h3.a.content,
                                'address': res.div[0].div[1].ul[0].li[1].span.content.trim(),
                                'value': res.div[0].div[1].ul[1].li[0].img.src.match(/icon_star(\d+).png/)[1],
                                'price': res.div[0].div[1].ul[1].li[2].content || '',
                                'image_url': res.div[0].div[0].div.a.img.src,
                                'source_url': source_url + res.div[0].h3.a.href
                            };

                        objRes.price = (m = objRes.price.match(/(\d+)/)) ? m[1] : -1;

                        function callbackRes() {
                            if (indexRes >= aryRes.length) {
                                callback();
                            } else {
                                parseRes(aryRes[indexRes++]);
                            }
                        }

                        Y.YQL(
                            'select * from html where url=\'' + objRes.source_url + '\' ' +
                            'and xpath=\'//*[@id="shop"]\' and compat=\'html5\'',
                            function (data) {
                                if (!data.query.results && retry++ < 3) {
                                    indexRes--;
                                    callbackRes();
                                    return;
                                }

                                retry = 0;

                                if (!data.query.results || !data.query.results.article) {
                                    callbackRes();
                                    return;
                                }

                                var m,
                                    tel_column = data.query.results.article.header.div.div.div[1].div[1].p[2],
                                    tel = tel_column.a ? tel_column.a.content : '',
                                    description = data.query.results.article.div.div[0].section[2].div[0].content;

                                objRes.tel = (m = tel.match(/(\d+)-(\d+)-(\d+)/)) ? ('(' + m[1] + ')' + m[2] + m[3]) : '';
                                objRes.description = description.replace(/[\r?\n|\r| ]/g, '');

                                Y.YQL(
                                    'select * from geo.placefinder where text="' +
                                    objRes.address.replace(/\(.*\)/, '') + '"',
                                    function (data) {
                                        var geo = data.query.results.Result;
                                        objRes.latitude = geo.latitude;
                                        objRes.longitude = geo.longitude;
                                        db.insert('restaurant', objRes, callbackRes);
                                    }
                                );
                            }
                        );

                    }

                    if (indexRes < aryRes.length) {
                        parseRes(aryRes[indexRes++]);
                    } else {
                        callback();
                    }
                }
            );
        }

        db.select('action', { 'category': 'R' }, function (err, results) {
            var url = source_url + '/taipei/channel/F',
                action_id = {};

            for (var i = 0; i < results.length; i++)
                action_id[results[i].name] = results[i].id;

            Y.YQL(
                'select * from html where url=\'' + url + '\' and xpath=\'//*[@id="cate"]/div[2]/table\'',
                function (data) {
                    var aryAction = data.query.results.table.tr,
                        action_count = 0;


                    function parseAction(action, action_callback) {
                        var action_name = action.td[0].a.content,
                            aryType = action.td[1].ul.li,
                            type_id = {},
                            type_count = 0;

                        function parseType(type, type_callback) {
                            var type_name = type.a.content,
                                uri = type.a.href;

                            if (!type_id[type_name]) {
                                db.insert(
                                    'type',
                                    { 'action_id': action_id[action_name], 'name': type_name },
                                    function (e, r) {
                                        type_id[type_name] = r.insertId;
                                        parseRestaurant(type_id[type_name], uri, type_callback);
                                    }
                                );
                            } else {
                                parseRestaurant(type_id[type_name], uri, type_callback);
                            }
                        }

                        function type_callback() {
                            if (type_count >= aryType.length || type_count >= 6) {
                                action_callback();
                            } else {
                                parseType(aryType[type_count++], type_callback);
                            }
                        }

                        db.select('type', { 'action_id': action_id[action_name] }, function (e, r) {
                            for (var j = 0; j < r.length; j++)
                                type_id[r[j].name] = r[j].id;

                            if (!action_id[action_name]) {
                                db.insert('action', { 'category': 'R', 'name': action_name }, function (err, result) {
                                    action_id[action_name] = result.insertId;
                                    parseType(aryType[type_count++], type_callback);
                                });
                            } else {
                                parseType(aryType[type_count++], type_callback);
                            }
                        });
                    }

                    function action_callback() {
                        if (action_count < 15)
                            parseAction(aryAction[action_count++], action_callback);
                        else
                            db.end();
                    }

                    parseAction(aryAction[action_count++], action_callback);
                }
            );
        });
    });

})();
