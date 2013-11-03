(function () {
  'use strict';
  var require;

  // create a new context of requirejs only for this app module
  require = requirejs.config({
      baseUrl: 'js/' // base path of this app
    , context: 'date4fun-app' // unique context name
    , paths: {
          // paths to enable loading text and css files
          // These paths are used by requirejs optimizer, so should always be included in optimized bundle!
          'text': '../components/text/text'
        , 'json': '../components/requirejs-plugins/src/json'
          // common packages(do not include these path to optimized bundle)
        , 'bootstrap': '../components/bootstrap-sass/dist/js/bootstrap.min'
        , 'backbone': '../components/backbone/backbone-min'
        , 'underscore': '../components/underscore/underscore-min'
        , 'moment': '../components/moment/min/moment.min'
        , 'debug': '../components/javascript-debug/ba-debug.min'
        , 'modernizr': '../components/modernizr/modernizr'
        , 'handlebars': '../components/handlebars.js/dist/handlebars'
        , 'jstorage': '../components/jStorage/jstorage.min'
        , 'fastclick': '../components/fastclick/lib/fastclick'
        , 'jquery.mobile': '../components/jquery-mobile/dist/jquery.mobile.min'
        , 'jquery.mobile-config': 'jqm-config'
        , 'jquery': '../components/jquery/jquery.min'
        , 'jquery.easing': '../components/jquery.easing/js/jquery.easing.min'
        , 'jquery-migrate': '../components/jquery/jquery-migrate.min'
        , 'jquery-ui': '../components/jquery-ui/ui/minified/jquery-ui.min'
        , 'jquery-ui-slider': '../components/jquery-ui/ui/minified/jquery.ui.slider.min'
        , 'jquery-ui-datepicker': '../components/jquery-ui/ui/minified/jquery.ui.datepicker.min'
        , 'jquery-ui-datepicker-zh-tw': '../components/jquery-ui/ui/i18n/jquery.ui.datepicker-zh-TW'
        , 'roundabout': '../components/roundabout/jquery.roundabout.min'
        , 'roundabout-shapes': '../components/roundabout-shapes/jquery.roundabout-shapes.min'
        , 'theatre': '../vendor/theatre/jquery.theatre.min'
        , 'theatre-effect-css3': '../vendor/theatre/effect.css3'
        , 'iscroll': '../components/iscroll/src/iscroll'
      }
    , shim: {
          'underscore': { deps: [], exports: '_'}
        , 'backbone': {
              deps: [ 'underscore' ]
            , exports: 'Backbone'
          }
        , 'jquery.mobile': {
              deps: [ 'jquery.mobile-config' ]
          }
        , 'jquery-ui-slider': {
              deps: [ 'jquery-ui' ]
          }
        , 'jquery-ui-datepicker-zh-tw': {
              deps: [ 'jquery-ui-datepicker' ]
          }
        , 'jquery-ui-datepicker': {
              deps: [ 'jquery-ui' ]
          }
        , 'roundabout-shapes': {
              deps: [ 'roundabout']
          }
        , 'theatre-effect-css3': {
              deps: [ 'theatre' ]
          }
      }
  });

  require([
    './view/AppView',
    'fastclick',
    'jstorage',
  ], function (
    AppView
  ) {
    var TRANSITION = "slide";

    $(document).ready(function() {

      $.mobile.initializePage()

      FastClick.attach(document.body);

      new AppView();

      $.mobile.loading('show');
      $.get('http://date4fun-api.yslin.tw/configuration', function (d) {
        $.mobile.loading('hide');

        var relationships = {};
        $.each(d.data.relationship, function (r, item) {
          relationships[item.id] = item.name;
        });
        $.jStorage.set('relationships', relationships);
        var ambiances = {};
        $.each(d.data.ambiance, function (a, item) {
          ambiances[item.id] = item.name;
        });
        $.jStorage.set('ambiances', ambiances);
        var actions = {};
        $.each(d.data.action, function (a, item) {
          actions[item.id] = {
            name: item.name,
            icon: item.icon
          }
        });
        $.jStorage.set('actions', actions);

        $('#pageSplash').click(function () {
          $.mobile.changePage('#pageIndex', { transition: TRANSITION });
        });
        // if (!window.location.hash) {
        //   $.mobile.changePage('#pageIndex', { transition: TRANSITION });
        // }
      });


    });

  });

}());
