(function () {
    var YUI = require('yui').YUI,
        db = require('./database');

    YUI().use('yql', function (Y) {
        var source_url = 'http://www.taipeitravel.net',
            retry = 0;

        function parseView(type_id, uri, callback) {
            var url = source_url + uri;

            Y.YQL(
                'select * from html where url=\'' + url + '\' ' +
                'and xpath=\'//*[@id="changeFontId"]/div/table/tbody/tr/td[2]\' and compat=\'html5\'',
                function (data) {
                    if (!data.query.results && retry++ < 3) {
                        parseView(type_id, uri, callback);
                        return;
                    }

                    retry = 0;

                    if (!data.query.results || !data.query.results.td) {
                        callback();
                        return;
                    }

                    var aryRes = data.query.results.td.table,
                        indexRes = 1;

                    function parseRes(res) {
                        var m,
                            aryInfo = res.tbody.tr[1].td[1].table.tbody.tr.td[2].table.tbody.tr,
                            objRes = {
                                'type_id': type_id,
                                'title': aryInfo[0].td.a.content,
                                'image_url': source_url + res.tbody.tr[1].td[1].table.tbody.tr.td[0].a.img.src,
                                'source_url': source_url + aryInfo[0].td.a.href
                            };

                        for (var i = 0; i < aryInfo.length; i++) {
                            if (aryInfo[i].td.table) {
                                objRes.value = aryInfo[i].td.table.tbody.tr.td[1].content.trim();
                            }
                        }

                        function callbackRes() {
                            if (indexRes >= aryRes.length) {
                                callback();
                            } else {
                                parseRes(aryRes[indexRes++]);
                            }
                        }

                        Y.YQL(
                            'select * from html where url=\'' + objRes.source_url + '\' ' +
                            'and xpath=\'//*[@id="changeFontId"]/div/table/tbody/tr/td[2]\' and compat=\'html5\'',
                            function (data) {
                                if (!data.query.results && retry++ < 3) {
                                    indexRes--;
                                    callbackRes();
                                    return;
                                }

                                retry = 0;

                                if (!data.query.results || !data.query.results.td) {
                                    callbackRes();
                                    return;
                                }

                                var m,
                                    addr_tel = '',
                                    aryInfo = data.query.results.td.div[7].table.tbody.tr[0].td.table.tbody.tr;

                                for (var i = 0; i < aryInfo.length; i++) {
                                    if ((aryInfo[i].th.content || aryInfo[i].th).trim() == '地址或電話') {
                                        addr_tel = aryInfo[i].td.trim();
                                        m = addr_tel.match(/(\d+)-(\d+)-(\d+)/);
                                        if (m && m.length == 4) {
                                            objRes.tel = '(' + m[1] + ')' + m[2] + m[3];
                                            objRes.address = addr_tel.replace(/ (\d+)-(\d+)-(\d+)/, '').replace(/[\r?\n|\r| ]/g, '');
                                        } else {
                                            objRes.address = addr_tel.replace(/ (\d+)-(\d+)-(\d+)/, '').replace(/[\r?\n|\r| ]/g, '');
                                        }
                                    }
                                }

                                if (data.query.results.td.div[6].div.content) {
                                    objRes.description = data.query.results.td.div[6].div.content.replace(/[\r?\n|\r| ]/g, '');
                                } else if (data.query.results.td.div[6].div.p) {
                                    if (data.query.results.td.div[6].div.p.content) {
                                        objRes.description = data.query.results.td.div[6].div.p.content;
                                    } else {
                                        objRes.description = data.query.results.td.div[6].div.p[0];
                                        objRes.description += data.query.results.td.div[6].div.p[1].content;
                                    }
                                }

                                if (objRes.address) {
                                    Y.YQL(
                                        'select * from geo.placefinder where text="' +
                                        objRes.address.replace(/\(.*\)/, '') + '"',
                                        function (data) {
                                            var geo = data.query.results.Result;
                                            objRes.latitude = geo.latitude;
                                            objRes.longitude = geo.longitude;
                                            db.insert('view', objRes, callbackRes);
                                        }
                                    );
                                } else {
                                    db.insert('view', objRes, callbackRes);
                                }
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

        db.select('action', { 'category': 'V' }, function (err, results) {
            var url = source_url + '/tw/scene/',
                action_id = {};

            for (var i = 0; i < results.length; i++)
                action_id[results[i].name] = results[i].id;

            Y.YQL(
                'select * from html where url=\'' + url + '\' and xpath=\'//*[@id="tmenu_menu"]\'',
                function (data) {
                    var aryAction = data.query.results.ul.li,
                        action_count = 1;


                    function parseAction(action, action_callback) {
                        var action_name = action.a.content,
                            aryType = [ action ],
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
                                        parseView(type_id[type_name], uri, type_callback);
                                    }
                                );
                            } else {
                                parseView(type_id[type_name], uri, type_callback);
                            }
                        }

                        function type_callback() {
                            if (type_count >= aryType.length || type_count >= 11) {
                                action_callback();
                            } else {
                                parseType(aryType[type_count++], type_callback);
                            }
                        }

                        db.select('type', { 'action_id': action_id[action_name] }, function (e, r) {
                            for (var j = 0; j < r.length; j++)
                                type_id[r[j].name] = r[j].id;

                            if (!action_id[action_name]) {
                                db.insert('action', { 'category': 'V', 'name': action_name }, function (err, result) {
                                    action_id[action_name] = result.insertId;
                                    parseType(aryType[type_count++], type_callback);
                                });
                            } else {
                                parseType(aryType[type_count++], type_callback);
                            }
                        });
                    }

                    function action_callback() {
                        if (action_count < 11)
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
