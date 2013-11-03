define([
  'backbone',
  'require',
], function (
  Backbone,
  require
) {
  "use strict";

  var baseUrl = require.toUrl('');

  return Backbone.View.extend({
    el: '#pageIndex',
    events: {
      'click .emptyMsg .logo, #btnNew': function (e) {
        this.newDate();
      }
    },
    initialize: function (options) {
      this.AppView = options.AppView;
      this.$el.on('pageshow', function (e) {
        $.mobile.loading('show');

        $.mobile.loading('hide');
      });
    },
    newDate: function () {
      $.mobile.changePage('#pageSearch', { transition: this.AppView.transition });
    }
  });

});
