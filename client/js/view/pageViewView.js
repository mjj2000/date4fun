define([
  'backbone',
  'require',
  'text!../../template/viewAction.html',
  'text!../../template/viewTraffic.html',
], function (
  Backbone,
  require,
  htmlViewAction,
  htmlViewTraffic
) {
  "use strict";

  var baseUrl = require.toUrl('')

  return Backbone.View.extend({
    el: '#pageView',
    events: {
      'click #btnEdit': function (e) {
        $.mobile.changePage('#pageEdit', { transition: this.AppView.transition, reverse: true });
      },
      'click #btnDone': function (e) {
        // save schedule then back to index
        $.mobile.changePage('#pageIndex', { transition: this.AppView.transition });
      }
    },
    initialize: function (options) {

      var that = this,
          tplViewAction = _.template(htmlViewAction),
          tplViewTraffic = _.template(htmlViewTraffic);
      this.AppView = options.AppView;
      this.$el.on('pageshow', function (e) {
        $.mobile.loading('show');

        var schedule = $.jStorage.get('schedule'),
            startTime = null;

        that.$el.find('#actions').empty();
        $.each(schedule, function (s, item) {
          if (item.type === 'action') {
            if (!startTime) {
              startTime = item.data.timeFrom;
            }
            that.$el.find('#actions').append(tplViewAction({
              icon: item.data.image_url,
              timeFrom: item.data.timeFrom,
              timeTo: item.data.timeTo,
              name: item.data.title,
              description: item.data.description
            }));
          } else if (item.type === 'traffic') {
            that.$el.find('#actions').append(tplViewTraffic({
              type: item.data.type === 0 ? 'walk' : 'mass',
              name: item.data.type === 0 ? '步行' : '大眾交通工具',
              time: item.data.time.text
            }));            
          }
        });

        // render timeline
        $('#timeline').empty().fadeOut();
        for (var t = startTime; t <= 24; t++) {
          $('#timeline').append(
            $('<li />').text(
              [(t < 10 ? '0' : ''), t, ':00'].join('')
            )
          );
        }
        $('#timeline').fadeIn();

        $.mobile.loading('hide');
      });

    }
  });

});
