define([
  'backbone',
  'require',
  './pageIndexView',
  './pageSearchView',
  './pageCardView',
  './pageEditView',
  './pageViewView',
], function (
  Backbone,
  require,
  pageIndexView,
  pageSearchView,
  pageCardView,
  pageEditView,
  pageViewView
) {
  "use strict";

  var baseUrl = require.toUrl('');

  return Backbone.View.extend({
    transition: 'slide',
    el: 'body',
    events: {
    },
    initialize: function () {

      this.pageIndex = new pageIndexView({ AppView: this });
      this.pageSearch = new pageSearchView({ AppView: this });
      this.pageCard = new pageCardView({ AppView: this });
      this.pageEdit = new pageEditView({ AppView: this });
      this.pageView = new pageViewView({ AppView: this });

    }
  });

});
