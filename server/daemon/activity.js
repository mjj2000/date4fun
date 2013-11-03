(function () {
    var YUI = require('yui').YUI,
        db = require('./database');

    YUI().use('yql', 'io-base', 'querystring-stringify', function (Y) {
        var source_url = 'http://www.citytalk.tw';

        function parseActivity(type_id, uri, callback) {
            var url = source_url + uri,
                c_id = url.match(/\/cata\/(\d+)\//)[1],
                city = url.match(/\?city=(\d+)/)[1];

            Y.io('http://www.citytalk.tw/post/v2/cata/index', {
                method: 'POST',
                data: Y.QueryString.stringify({
                    'type': 'eventSearch_GET',
                    'data[keyword]': '',
                    'data[time]': '2013-10-24~2016-10-24',
                    'data[time_range]': '',
                    'data[time_new]': '',
                    'data[time_expired]': '',
                    'data[verify]': 't',
                    'data[c_id]': c_id,
                    'data[city]': city,
                    'data[old]': 'show',
                    'data[sort]': 'hot',
                    'data[ticket]': 'all',
                    'data[prize]': 'hide',
                    'data[free]': 'all',
                    'data[limit]': '10',
                    'data[offset]': '1',
                    'data[return]': 't',
                    'data[random]': 'f',
                    'data[randomlimit]': '10',
                    'data[v_id]': '0',
                    'data[ep_id]': '0',
                    'data[geo_lat]': '',
                    'data[geo_lng]': '',
                    'data[distance]': '1000',
                    'data[date_modify]': ''
                }),
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Referer': 'http://www.citytalk.tw/cata/0/?city=28'
                },
                on: {
                    success: function (id, e) {
                        var aryRes = JSON.parse(e.responseText).data,
                            indexRes = 0;

                        function parseRes(res) {
                            var objRes = {
                                'type_id': type_id,
                                'title': res.title,
                                'tel': res.v_tel || '',
                                'address': res.v_addr,
                                'value': res.view_count,
                                'description': res.brief,
                                'image_url': source_url + res.img, 
                                'source_url': source_url + '/event/' + res.e_id + '-' + res.title_link
                            };

                            if (res.geo_lat && res.geo_lng) {
                                objRes.latitude = res.geo_lat;
                                objRes.longitude = res.geo_lng;
                            }

                            function callbackRes(err) {
                                if (indexRes >= aryRes.length) {
                                    callback();
                                } else {
                                    parseRes(aryRes[indexRes++]);
                                }
                            }

                            db.insert('activity', objRes, callbackRes);
                        }

                        if (indexRes < aryRes.length) {
                            parseRes(aryRes[indexRes++]);
                        } else {
                            callback();
                        }
                    }
                }
            });
        }

        db.select('action', { 'category': 'A' }, function (err, results) {
            var url = source_url + '/cata/0/?city=28',
                action_id = {};

            for (var i = 0; i < results.length; i++)
                action_id[results[i].name] = results[i].id;

            Y.YQL(
                'select * from html where url=\'' + url + '\' and xpath=\'//*[@id="cata_sub_cata"]\' and compat=\'html5\'',
                function (data) {
                    var aryAction = data.query.results.ul.li,
                        action_count = 2;


                    function parseAction(action, action_callback) {
                        var action_name = action.strong.content,
                            aryType = action.ul.li,
                            type_id = {},
                            type_count = 0;

                        function parseType(type, type_callback) {
                            var type_name = type.content,
                                uri = '/cata/' + type['data-sub'] + '/?city=28';

                            if (!type_id[type_name]) {
                                db.insert(
                                    'type',
                                    { 'action_id': action_id[action_name], 'name': type_name },
                                    function (e, r) {
                                        type_id[type_name] = r.insertId;
                                        parseActivity(type_id[type_name], uri, type_callback);
                                    }
                                );
                            } else {
                                parseActivity(type_id[type_name], uri, type_callback);
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
                                db.insert('action', { 'category': 'A', 'name': action_name }, function (err, result) {
                                    action_id[action_name] = result.insertId;
                                    parseType(aryType[type_count++], type_callback);
                                });
                            } else {
                                parseType(aryType[type_count++], type_callback);
                            }
                        });
                    }

                    function action_callback() {
                        if (action_count < 8)
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
