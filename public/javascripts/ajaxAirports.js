$(document).ready(function() {

  $.ajaxSetup({
    cache: false
  });
  

  $('input:radio[name="flightType"]').change(
    function () {
      if (this.checked && this.value == 'roundTrip') {
        $('#epsi').toggle(200);
      }else{
        $('#epsi').hide(200);
      }
    });

});
