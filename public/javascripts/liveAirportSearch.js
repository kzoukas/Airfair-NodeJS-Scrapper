$(document).ready(function () {
    $.ajaxSetup({
        cache: false
    });
    $('#search').keyup(function () {
        $("#result").show();
        $('#result').html('');
        $('#state').val('');
        if (($('#search').val().length != 0) && ($('#search').val().length > 2)) {
            $.ajax({
                type: 'GET',
                url: "/load/" + $('#search').val(),
                success: function (data) {
                    // var searchField = $('#search').val();
                    // var expression = new RegExp(searchField, "i");
                    // console.log(JSON.parse(data).length);
                    $.each(JSON.parse(data), function (key, value) {

                        // if (value.name.toLowerCase().search(expression) != -1 ||
                        //     value.iata.toLowerCase().search(
                        //         expression) != -1) {
                        $('#result').append(
                            '<li class="list-group-item link-class"> ' +
                            value.name + ' | <span class="text-muted">' +
                            value.iata + '</span>' +
                            '  <span class="text-muted longtitude">' +'|'+ value.location
                            .coordinates[0] + '</span>' +
                            '  <span class="text-muted latitude">' +'|'+ value.location
                            .coordinates[1] + '</span></li>');
                        // }
                    });
                }
            });
        }
    });
    $('#result').on('click', 'li', function () {
        var click_text = $(this).text().split('|');
        // var lon = $.trim(click_text[2]);
        // var lat = $.trim(click_text[3]);
        // console.log(lon);
        // console.log(lat);
        $('#search').val($.trim(click_text));
        
        $("#result").html('');
    });



    $('#search2').keyup(function () {
        $("#result2").show();
        $('#result2').html('');
        $('#state2').val('');
        if (($('#search2').val().length != 0) && ($('#search2').val().length > 2)) {
            $.ajax({
                type: 'GET',
                url: "/load/" + $('#search2').val(),
                success: function (data2) {
                    // var searchField2 = $('#search2').val();
                    // var expression2 = new RegExp(searchField2, "i");
                    // console.log(JSON.parse(data2).length);
                    $.each(JSON.parse(data2), function (key, value2) {
                        // if (value2.name.search(expression2) != -1 || value2.iata
                        //     .search(
                        //         expression2) != -1) {
                        $('#result2').append(
                            '<li class="list-group-item link-class"> ' +
                            value2.name +
                            ' | <span class="text-muted">' +
                            value2.iata + '</span>' +
                            ' <span class="text-muted longtitude">' +'|'+ value2.location
                            .coordinates[0] + '</span>' +
                            ' <span class="text-muted latitude">' +'|'+ value2.location
                            .coordinates[1] + '</span></li>');
                        // }
                    });
                }
            });
        }
    });
    $('#result2').on('click', 'li', function () {
         var click_text2 = $(this).text().split('|');
        // var lon2 = $.trim(click_text2[2]);
        // var lat2 = $.trim(click_text2[3]);
        // console.log(lon2);
        // console.log(lat2);
        $('#search2').val($.trim(click_text2));
        $('#search2').show($.trim(click_text2[0]));
        
        $("#result2").html('');
    });
});

$(function () {
    $("#result").click(function (e) {
        $("#result").hide();
        $(this).find("#result").toggle();

        e.preventDefault(); // Stop navigation
    });
    $("#result2").click(function (e) {
        $("#result2").hide();
        $(this).find("#result2").toggle();

        e.preventDefault(); // Stop navigation
    });
});

$(document).click(function (e) {
    var container = $("#result");
    if (!container.is(e.target) && container.has(e.target).length === 0) {
        $("#result").hide();
    }
    var container2 = $("#result2");
    if (!container2.is(e.target) && container2.has(e.target).length === 0) {
        $("#result2").hide();
    }
});