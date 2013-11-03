define([
  'backbone',
  'require',
  'jquery-ui-slider',
  'jquery-ui-datepicker-zh-tw',
  'moment',
], function (
  Backbone,
  require
) {
  "use strict";

  var baseUrl = require.toUrl('');

  return Backbone.View.extend({
    transition: 'slide',
    el: '#pageSearch',
    events: {
      'click #btnBack': function (e) {
        $.mobile.changePage('#pageIndex', { transition: this.transition, reverse: true });
      },
      'click #btnGo': function (e) {
        this.go();
      },
      'change #date #inputDate': function (e) {
        this.$el.find('#date .val').text(e.currentTarget.value);
      },
      'click #date': function (e) {
        this.$el.find('#inputDate').datepicker( this.$el.find('#ui-datepicker-div').is(':visible') ? 'hide' : 'show' );
      },
      'click #relationshipMenu a': function (e) {
        var $r = $(e.currentTarget);
        this.$el.find('#relationship')
        .data('value', $r.data('value'))
        .html($r.html());

        this.$el.find('#relationshipMenu').popup('close');
      },
      'click #ambianceMenu a': function (e) {
        var $r = $(e.currentTarget);
        this.$el.find('#ambiance')
        .data('value', $r.data('value'))
        .html($r.html());

        this.$el.find('#ambianceMenu').popup('close');
      }
    },
    initialize: function (AppView) {

      var that = this;
      this.$el.on('pageshow', function (e) {
        $.mobile.loading('show');

        // initialize relationship menu
        var $rList = that.$el.find('#relationshipMenu ul').empty(),
            relationships = $.jStorage.get('relationships');
        $.each(relationships, function (id, name) {
          $rList.append(
            $('<li />').append(
              $('<a />')
              .data('value', id)
              .html(name)
            )
          )
        });
        $rList.listview('refresh');
        var defaultRelationship = 1;
        that.$el.find('#relationship')
        .data('value', defaultRelationship)
        .html(relationships[defaultRelationship]);

        // initialize ambiance menu
        var $aList = that.$el.find('#ambianceMenu ul').empty(),
            ambiances = $.jStorage.get('ambiances');
        $.each(ambiances, function (id, name) {
          $aList.append(
            $('<li />').append(
              $('<a />')
              .data('value', id)
              .html(name)
            )
          )
        });
        $aList.listview('refresh');
        // set default value
        var defaultAmbiance = 1;
        that.$el.find('#ambiance')
        .data('value', defaultAmbiance)
        .html(ambiances[defaultAmbiance]);

        // initialize time range slider
        that.$el.find('#timeRange').slider({
          range: true,
          min: 0,
          max: 3,
          values: [ 1, 3 ],
          step: 1,
          animate: true,
          slide: function(event, ui) {
            // ui.values[ 0 ]
            // ui.values[ 1 ]
          }
        });

        // initialize date picker
        var date = moment().format("YYYY/MM/DD");
        that.$el.find('#date #inputDate').datepicker({
          dateFormat: 'yy/mm/dd',
          defaultDate: date,
          minDate: date
        });
        that.$el.find('#date input').val(date);
        that.$el.find('#date .val').text(date);

        $.mobile.loading('hide');
      });

    },
    go: function () {
      // prepare data for querying dating card
      var search = {
        relationship: $('#relationship').data('value'),
        ambiance: $('#ambiance').data('value'),
        slot: $('#timeRange').slider('values').join(','),
        date: $('#date input').val().replace(/\//g, '-')
      };
      $.jStorage.set('user-search', search);

      $.mobile.changePage('#pageCard', { transition: this.transition });
    }
  });

});
