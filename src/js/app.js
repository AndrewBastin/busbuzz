var ajax = require('ajax');
var UI = require('ui');
var Vector2 = require('vector2');

var locOptions = {
  enableHighAccuracy: true,
  maximumAge: 10000,
  timeout: 10000
};

navigator.geolocation.getCurrentPosition(onLocSuccess, onLocError, locOptions);

function getTimeString(date) {
  var hours = date.getHours();
  var minutes = date.getMinutes();
  var ampm = hours >= 12 ? 'pm' : 'am';
  hours = hours % 12;
  hours = hours ? hours : 12;
  minutes = minutes < 10 ? '0' + minutes : minutes;
  var strTime = hours + ':' + minutes + ' ' + ampm;
  return strTime;
}

var main = new UI.Card({
  title: 'busbuzz',
  subtitle: 'Loading',
  body: 'Finding nearby stops',
  subtitleColor: 'indigo', // Named colors
  bodyColor: '#9a0036' // Hex colors
});

main.show();

function onLocSuccess(pos) {
  console.log("Loc Success: ");
  console.log("lat = " + pos.coords.latitude);
  console.log("lon = " + pos.coords.longitude);
  
  ajax({ 
    url: "http://nextlift.ca/Tmix.Cap.Ti.Process.AnyRide/api/FindstopsNearLocation",
    method: "post",
    type: "json",
    data: {
      coordinate: {
        lat: pos.coords.latitude,
        lon: pos.coords.longitude
      },
      maxCount: 10
    },
    cache: false
  }, function (data) {
    items = [];
    
    for (var i = 0; i < data.length; i++) {
      items.push({
        title: data[i].text,
        subtitle: data[i].id
      });
    }

    var menu = new UI.Menu({
      sections: [{
        items: items
      }]
    });

    main.hide();

    menu.on('select', function (e) {
      
      var loading = new UI.Card({
        title: 'busbuzz',
        subtitle: 'Loading',
        body: e.item.title,
        subtitleColor: 'indigo', // Named colors
        bodyColor: '#9a0036' // Hex colors
      });

      loading.show();
      
      ajax({ 
        url: "http://nextlift.ca/Tmix.Cap.Ti.Process.AnyRide/api/GetCalls",
        method: "post",
        type: "json",
        data: {
          configuration: {
            grouping: ["Line", "Destination1"]
          },

          query: {
            directionId: 0,
            fromStopAreaQuery: e.item.title,
            lineId: 0,
            toStopAreaName: ""
          }
        },
        cache: false
      }, function (stopData) {
        stopItems = [];

        for (var j = 0; j < stopData.calls.length; j++) {
          stopItems.push({
            title: stopData.calls[j].calls[0].line + " : " + stopData.calls[j].calls[0].destination,
            subtitle: getTimeString(new Date(stopData.calls[j].calls[0].departure.forecastTime))
          });
        }

        var stopMenu = new UI.Menu({
          sections: [{
            items: stopItems 
          }]
        });

        loading.hide();
        stopMenu.show();
      });
    });
    
    menu.show();
  });
}

function onLocError(err) {
  console.log("Loc Error: ");
  console.log(err);
}
