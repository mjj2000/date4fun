define([
  'backbone',
  'require',
  'text!../../template/editAction.html',
  'text!../../template/editTraffic.html',
  'iscroll'
], function (
  Backbone,
  require,
  htmlEditAction,
  htmlEditTraffic
) {

  var baseUrl = require.toUrl('');

  return Backbone.View.extend({
    transition: 'slide',
    el: '#pageEdit',
    events: {
      'click #btnBack': function (e) {
        this.$el.find('#actions').empty();
        $.mobile.changePage('#pageCard', { transition: this.AppView.transition, reverse: true });
      },
      'click #btnOk': function (e) {
        this.goNext();
      }
    },
    scrollers: [],
    tscrollers: [],
    curActions: [],
    curOptions: [],
    getSelectedOptionOfAction: function (actionId) {
      return this.scrollers[actionId].currPageX;
    },
    getSelectedOptionOfTraffic: function (tId) {
      return this.tscrollers[tId].currPageX;
    },
    initialize: function (options) {

      var that = this,
          ACTIONS = $.jStorage.get('actions'),
          tplEditAction = _.template(htmlEditAction),
          tplEditTraffic = _.template(htmlEditTraffic);

      this.AppView = options.AppView;
      this.$el.on('pageshow', function (e) {
        $.mobile.loading('show');

        // reset 
        $.each(that.scrollers, function (a, scroller) { scroller.destroy(); });
        $.each(that.tscrollers, function (t, scroller) { scroller.destroy(); });
        that.scrollers = [];
        that.tscrollers = [];
        that.curActions = [];
        that.curOptions = [];

        var userSearch = $.jStorage.get('user-search'),
            userActions = $.jStorage.get('user-actions');
        // query schedule by user search and actions
        var params = {
          relationship: userSearch.relationship,
          ambiance: userSearch.ambiance,
          slot: userSearch.slot,
          action: userActions.join(',')
        };

        that.$el.find('#actions').empty(); // clean current
        $.post(
          'http://date4fun-api.yslin.tw/schedule',
          params,
          function (d) {

            that.curActions = d.data;

            $.each(d.data, function (a, action) {
              var options = [],
                  aIndex = a;
              $.each(action.options, function (o, option) {
                options.push({
                  icon: option.image_url,
                  timeFrom: action.start_time,
                  timeTo: action.start_time + action.duration,
                  name: option.title,
                  description: option.description
                });
              });
              // render options of each action
              var $action = $(tplEditAction({
                    name: ACTIONS[action.action].name,
                    actionId: action.action,
                    options: options
                  })),
                  $scroller = $action.find('.scroller'),
                  actionWidth = $(window).width();
              $action
              .find('li').width(actionWidth).end()
              .find('img').load(function () {
                $(this).animate({ opacity: 1 }, 200);
              }).end();
              $scroller.width($scroller.width() + actionWidth * options.length);
              that.$el.find('#actions').append($action);

              that.scrollers[that.scrollers.length] = new iScroll('wrapper-' + action.action, {
                snap: true,
                momentum: false,
                hScrollbar: false,
                vScrollbar: false,
                vScroll: false,
                lockDirection: true,
                onScrollEnd: function () {
                  var lastOption = that.curOptions[aIndex] || 0,
                      curOption = that.getSelectedOptionOfAction(aIndex),
                      traffic2update = [];
                  if (lastOption != curOption) {
                    that.curOptions[aIndex] = curOption;
                    if (aIndex !== 0) {
                      traffic2update.push(aIndex - 1); // update traffic by previous
                    }
                    if (aIndex !== that.curActions.length - 1) {
                      traffic2update.push(aIndex); // update traffic by next
                    }
                    that.updateTraffic(traffic2update);
                  }
                }
              });

              if (a < that.curActions.length - 1) {
                // render traffic before next action
                var options,
                    $traffic;

                $traffic = $(tplEditTraffic({
                  actionId: action.action,
                  time: {
                    walk: '...',
                    mass: '...'
                  }
                }));
                $scroller = $traffic.find('.scroller')
                trafficWidth = $(window).width() - 80;
                $traffic.find('li').width(trafficWidth).end();
                $scroller.width($scroller.width() + (trafficWidth + (40 * 2)) * 2);
                that.$el.find('#actions').append($traffic);

                that.tscrollers[that.tscrollers.length] = new iScroll('wrapper-traffic-' + action.action, {
                  snap: true,
                  momentum: false,
                  hScrollbar: false,
                  vScrollbar: false,
                  vScroll: false,
                  onScrollEnd: function () {
                    // that.updateTraffic();
                  }
                });
              }
            });

            $.mobile.loading('hide');
            that.updateTraffic();
          }
        );

      });

    },
    updateTraffic: function (traffic2update) {
      var that = this,
          actions = this.curActions,
          trafficTasks = [], // of each action
          trafficTimes = []; // of each action
      $.mobile.loading('show');

      // collects all traffic query task
      $.each(actions, function (a, action) {
        if (a < (actions.length - 1)) {
          if (
            $.isArray(traffic2update) &&
            ($.inArray(a, traffic2update) === -1)
          ) {
            // not target traffic => continue
            return true;
          }
          var from = a,
              to = a + 1,
              fromOption = actions[from].options[that.getSelectedOptionOfAction(from)],
              toOption = actions[to].options[that.getSelectedOptionOfAction(to)];
          if (fromOption && toOption) {
            that.$el.find('.wapper-traffic:eq(' + a + ')').animate({ opacity: 0 }, 500);
            trafficTasks.push([a, fromOption.address, toOption.address ]);
          }
        }
      });

      // do all query task
      var t = 0;
      setTimeout(function () {
        (function (t) {
          var fromAddr = trafficTasks[t][1],
              toAddr = trafficTasks[t][2];
          that.queryTrafficTime(fromAddr, toAddr, function (times) {
            trafficTimes[t] = times;
            if (trafficTimes.length === trafficTasks.length) {
              // all tasks are done!
              $.each(trafficTimes, function (t, time) {
                var tIndex = trafficTasks[t][0],
                    time = {
                      walk: trafficTimes[t].walk,
                      mass: trafficTimes[t].mass
                    };
                that.$el.find('.wapper-traffic:eq(' + tIndex + ')')
                .find('.timeWalk').text(time.walk.text).end()
                .find('.timeMass').text(time.mass.text).end()
                .data("time", [ time.walk, time.mass ])
                .animate({ opacity: 1 }, 500);
                that.tscrollers[tIndex].scrollToPage(
                  time.walk.value < time.mass.value ? 0 : 1,
                  0,
                  200
                );
              });
              $.mobile.loading('hide');
            }
          });

        })(t);
        t++;
        if (t <= (trafficTasks.length - 1)) {
          setTimeout(arguments.callee, 1000 * t);
        }
      }, 1000);
    },
    queryTrafficTime: function (addrFrom, addrTo, callback) {
      var url = "//maps.googleapis.com/maps/api/directions/json",
          params = function (type) {
            return {
              origin: addrFrom,
              destination: addrTo,
              sensor: false,
              mode: type, //'transit',
              departure_time: 1383390824,
              language: 'zh_TW'
            };
          },
          times = {
            walk: { text: '[Google大神不爽]', value: 0 },
            mass: { text: '[Google大神不爽]', value: 0 }
          };
      // query time for walk
      $.getJSON(
        url,
        params('walking'),
        function (d) {
          if (d.routes.length) {
            times.walk = d.routes[0].legs[0].duration;
          }
          // query time for mass
          $.getJSON(
            url,
            params('transit'),
            function (d) {
              if (d.routes.length) {
                times.mass = d.routes[0].legs[0].duration;
              }

              callback(times);
            }
          );
        }
      );

    },
    goNext: function () {
      var that = this,
          actions = this.curActions,
          schedule = [],
          time;
      $.each(actions, function (a, action) {
        schedule.push({
          type: 'action',
          data: $.extend(
            {},
            {
              timeFrom: action.start_time,
              timeTo: action.start_time + action.duration
            },
            action.options[that.getSelectedOptionOfAction(a)]
          )
        });
        if (a !== (actions.length - 1)) {
          time = that.$el.find('.wapper-traffic:eq(' + a +')').data('time');
          schedule.push({
            type: 'traffic',
            data: {
              type: that.getSelectedOptionOfTraffic(a),
              time: time[that.getSelectedOptionOfTraffic(a)] 
            }
          });
        }
      });

      $.jStorage.set('schedule', schedule);
      $.mobile.changePage('#pageView', { transition: this.AppView.transition });
    }
  });

});
