$(document).ready(function() {

  $.ajaxSetup({
    cache: false
  });
  $('#fromDestination').keyup(function() {
    $('#resultFromDestination').html('');
    $('#state').val('');
    var searchField = $('#fromDestination').val();
    var expression = new RegExp(searchField, "i");
    $.getJSON('airports', function(airports) {

      $.each(airports, function(key, value) {
        if (value.name.search(expression) != -1 || value.iata.search(expression) != -1) {
          $('#resultFromDestination').append('<li class="list-group-item link-class"> ' + value.name + ' | <span class="text-muted">' + value.iata + '</span>' + ' | <span class="text-muted">' + value.lon + '</span>' +
            ' | <span class="text-muted">' + value.lat + '</span></li>');
        }
      });
    });
  });

  $('#resultFromDestination').on('click', 'li', function() {
    var click_text = $(this).text().split('|');
    var lon = $.trim(click_text[2]);
    var lat = $.trim(click_text[3]);

    $('#fromDestination').val($.trim(click_text));
    $("#resultFromDestination").html('');
  });

});
