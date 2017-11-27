jQuery(function($) {
    "use strict";

    var SLZ = window.SLZ || {};


    /*=======================================
    =            SAMPLE FUNCTION            =
    =======================================*/

    SLZ.mainFunction = function() {
        // banner homepage default
        var width_boder = $('.homepage-default .title').width() - $('.homepage-default .text').width() - 10;
        $('.homepage-default .text .boder').width(width_boder);

        

        // slide section AWESOME TOURS
        $('.tours-list').not('.slick-initialized').slick({
            infinite: true,
            speed: 1000,
            slidesToShow: 3,
            slidesToScroll: 1,
            arrows: false,
            dots: false,
            responsive: [{
                breakpoint: 769,
                settings: {
                    slidesToShow: 2,
                    slidesToScroll: 2,
                    dots: true
                }
            }, {
                breakpoint: 601,
                settings: {
                    slidesToShow: 1,
                    slidesToScroll: 1,
                    dots: true,
                    speed: 600
                }
            }, {
                breakpoint: 481,
                settings: {
                    slidesToShow: 1,
                    slidesToScroll: 1,
                    dots: true,
                    speed: 600
                }
            }]
        });

        // Slide section HAPPY TRAVELER
     
        $('.traveler-list').not('.slick-initialized').slick({
            infinite: true,
            slidesToShow: 2,
            slidesToScroll: 2,
            autoplay: false,
            speed: 700,
            responsive: [{
                breakpoint: 769,
                settings: {
                    slidesToShow: 2,
                    slidesToScroll: 2,
                    dots: true,
                    arrows: false
                }
            }, {
                breakpoint: 601,
                settings: {
                    slidesToShow: 1,
                    slidesToScroll: 1,
                    dots: true,
                    arrows: false
                }
            }]
        });

        // slide section NEWS AND UPDATES
        $('.news-list').not('.slick-initialized').slick({
            infinite: true,
            dots: true,
            speed: 700,
            slidesToShow: 1,
            slidesToScroll: 1,
            // fade: true,
            cssEase: 'linear',
            arrows: false

        });


        ////Responsive for Tab search
        $(window).on('resize load', function(event) {
            //Responsive slider for Tab search default
            if ($(window).width() <= 480) {
                if (!$('.tab-search-default .nav-tabs').hasClass('slick-slider')) {
                    $('.tab-search-default .nav-tabs').not('.slick-initialized').slick({
                        fade: true,
                        mobileFirst: true,
                        swipe: false,
                        responsive: [{
                            breakpoint: 480,
                            settings: "unslick"
                        }]
                    });
                    $('.tab-search-default .slick-prev, .tab-search-default .slick-next').on('click', function(event) {
                        console.log($('.tab-search-default .nav-tabs li.slick-current a').attr('href'));
                        $('.tab-search-default .nav-tabs li.slick-current a').tab('show');
                    });
                }
                $('.tab-search-condensed .nav-tabs, .tab-search-transparent .nav-tabs').each(function() {
                    var height = $(this).height();
                    $(this).css('margin-bottom', height * (-1));
                });
            } else {
                $('.tab-search-condensed .nav-tabs, .tab-search-transparent .nav-tabs').removeAttr('style');
            }
        });

        //parallax banner sale 2
        if ($('.banner-sale-2').length) {
            $('.banner-sale-2').mousemove(function(e) {
                $('.banner-sale-2 .text-parallax').parallax(25, e);
                // $( '.background' ).parallax( -30, e );
            });
        }

        if($(".input-daterange").length) {
            // DATE PICKER
            console.log("reeeee");
            $('.input-daterange').datepicker({
                format: 'yyyy-mm-dd',
                maxViewMode: 0,
                autoclose: true
            });
        }

    };

    /*=====  End of SAMPLE FUNCTION  ======*/




    /*======================================
    =            INIT FUNCTIONS            =
    ======================================*/

    $(document).ready(function() {
        SLZ.mainFunction();
    });

    /*=====  End of INIT FUNCTIONS  ======*/


});
