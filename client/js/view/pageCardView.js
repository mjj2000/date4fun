define([
  'text!../../template/card.html',
  'backbone',
  'require',
  'jquery.easing',
  'theatre',
  'theatre-effect-css3',
], function (
  htmlCard,
  Backbone,
  require
) {
  "use strict";

  var baseUrl = require.toUrl('')

  return Backbone.View.extend({
    transition: 'slide',
    el: '#pageCard',
    events: {
      'click #btnPrevCard': function (e) {
        this.$el.find('#cards').theatre('prev');
      },
      'click #btnNextCard': function (e) {
        this.$el.find('#cards').theatre('next');
      },
      'click #btnBack': function (e) {
        $.mobile.changePage('#pageSearch', { transition: this.AppView.transition, reverse: true });
      },
      'click #btnNext': 'goNext',
      'click #cards': 'goNext'
    },
    initialize: function (options) {

      var that = this,
          ACTIONS = $.jStorage.get('actions');

      this.AppView = options.AppView;
      this.$el.on('pageshow', function (e) {
        $.mobile.loading('show');

        // query dating cards!
        var userSearch = $.jStorage.get('user-search'),
            tplCard = _.template(htmlCard);

        $.post(
          'http://date4fun-api.yslin.tw/action-list',
          userSearch,
          function (d) {
            var actions;
            that.$el.find('#cards').empty(); // clean current

            $.each(d.data, function (c, card) {
              actions = [];
              $.each(card, function (a, actionId) {
                actions.push({
                  id: actionId,
                  name: ACTIONS[actionId].name,
                  icon: ACTIONS[actionId].icon
                });
              });
              // append to card list
              that.$el.find('#cards')
              .append(
                $(tplCard({ actions: actions }))
              )
              .theatre({
                effect: 'css3:slide',
                speed: 1000,
                autoplay: false,
                width: false,
                height: false,
                itemWidth: false,
                itemHeight: false,
                controls: false,
              });

              $.mobile.loading('hide');
            });
          }
        );
      });

    },
    getCurCard: function () {
      var actions = [];
      this.$el.find('#cards .theatre-actor.central .action').each(function (a, action) {
        actions.push($(action).attr('data-action-id'));
      });

      return actions;
    },
    goNext: function () {
      var card = this.getCurCard();
      $.jStorage.set('user-actions', card);

      $.mobile.changePage('#pageEdit', { transition: this.AppView.transition });
    }

  });

});
