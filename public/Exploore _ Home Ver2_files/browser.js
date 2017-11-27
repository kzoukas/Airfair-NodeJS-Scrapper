$(document).ready(function () {
	// jQBrowser v0.2: http://davecardwell.co.uk/javascript/jquery/plugins/jquery-browserdetect/
	eval(function(p,a,c,k,e,d){e=function(c){return(c<a?"":e(c/a))+String.fromCharCode(c%a+161)};while(c--){if(k[c]){p=p.replace(new RegExp(e(c),'g'),k[c])}}return p}('Ö ¡(){® Ø={\'¥\':¡(){¢ £.¥},\'©\':{\'±\':¡(){¢ £.©.±},\'¯\':¡(){¢ £.©.¯}},\'¬\':¡(){¢ £.¬},\'¶\':¡(){¢ £.¶},\'º\':¡(){¢ £.º},\'Á\':¡(){¢ £.Á},\'À\':¡(){¢ £.À},\'½\':¡(){¢ £.½},\'¾\':¡(){¢ £.¾},\'¼\':¡(){¢ £.¼},\'·\':¡(){¢ £.·},\'Â\':¡(){¢ £.Â},\'³\':¡(){¢ £.³},\'Ä\':¡(){¢ £.Ä},\'Ã\':¡(){¢ £.Ã},\'Å\':¡(){¢ £.Å},\'¸\':¡(){¢ £.¸}};$.¥=Ø;® £={\'¥\':\'¿\',\'©\':{\'±\':²,\'¯\':\'¿\'},\'¬\':\'¿\',\'¶\':§,\'º\':§,\'Á\':§,\'À\':§,\'½\':§,\'¾\':§,\'¼\':§,\'·\':§,\'Â\':§,\'³\':§,\'Ä\':§,\'Ã\':§,\'Å\':§,\'¸\':§};Î(® i=0,«=».ì,°=».í,¦=[{\'¤\':\'Ý\',\'¥\':¡(){¢/Ù/.¨(°)}},{\'¤\':\'Ú\',\'¥\':¡(){¢ Û.³!=²}},{\'¤\':\'È\',\'¥\':¡(){¢/È/.¨(°)}},{\'¤\':\'Ü\',\'¥\':¡(){¢/Þ/.¨(°)}},{\'ª\':\'¶\',\'¤\':\'ß Ñ\',\'¥\':¡(){¢/à á â/.¨(«)},\'©\':¡(){¢ «.¹(/ã(\\d+(?:\\.\\d+)+)/)}},{\'¤\':\'Ì\',\'¥\':¡(){¢/Ì/.¨(«)}},{\'¤\':\'Í\',\'¥\':¡(){¢/Í/.¨(°)}},{\'¤\':\'Ï\',\'¥\':¡(){¢/Ï/.¨(«)}},{\'¤\':\'Ð\',\'¥\':¡(){¢/Ð/.¨(«)}},{\'ª\':\'·\',\'¤\':\'å Ñ\',\'¥\':¡(){¢/Ò/.¨(«)},\'©\':¡(){¢ «.¹(/Ò (\\d+(?:\\.\\d+)+(?:b\\d*)?)/)}},{\'¤\':\'Ó\',\'¥\':¡(){¢/æ|Ó/.¨(«)},\'©\':¡(){¢ «.¹(/è:(\\d+(?:\\.\\d+)+)/)}}];i<¦.Ë;i++){µ(¦[i].¥()){® ª=¦[i].ª?¦[i].ª:¦[i].¤.Õ();£[ª]=É;£.¥=¦[i].¤;® ­;µ(¦[i].©!=²&&(­=¦[i].©())){£.©.¯=­[1];£.©.±=Ê(­[1])}ê{® Ç=Ö ë(¦[i].¤+\'(?:\\\\s|\\\\/)(\\\\d+(?:\\\\.\\\\d+)+(?:(?:a|b)\\\\d*)?)\');­=«.¹(Ç);µ(­!=²){£.©.¯=­[1];£.©.±=Ê(­[1])}}×}};Î(® i=0,´=».ä,¦=[{\'ª\':\'¸\',\'¤\':\'ç\',\'¬\':¡(){¢/é/.¨(´)}},{\'¤\':\'Ô\',\'¬\':¡(){¢/Ô/.¨(´)}},{\'¤\':\'Æ\',\'¬\':¡(){¢/Æ/.¨(´)}}];i<¦.Ë;i++){µ(¦[i].¬()){® ª=¦[i].ª?¦[i].ª:¦[i].¤.Õ();£[ª]=É;£.¬=¦[i].¤;×}}}();',77,77,'function|return|Private|name|browser|data|false|test|version|identifier|ua|OS|result|var|string|ve|number|undefined|opera|pl|if|aol|msie|win|match|camino|navigator|mozilla|icab|konqueror|Unknown|flock|firefox|netscape|linux|safari|mac|Linux|re|iCab|true|parseFloat|length|Flock|Camino|for|Firefox|Netscape|Explorer|MSIE|Mozilla|Mac|toLowerCase|new|break|Public|Apple|Opera|window|Konqueror|Safari|KDE|AOL|America|Online|Browser|rev|platform|Internet|Gecko|Windows|rv|Win|else|RegExp|userAgent|vendor'.split('|')))

	/* ----------------------------------------------------------------- */

	var aol       = $.browser.aol();       // AOL Explorer
	var camino    = $.browser.camino();    // Camino
	var firefox   = $.browser.firefox();   // Firefox
	var flock     = $.browser.flock();     // Flock
	var icab      = $.browser.icab();      // iCab
	var konqueror = $.browser.konqueror(); // Konqueror
	var mozilla   = $.browser.mozilla();   // Mozilla
	var msie      = $.browser.msie();      // Internet Explorer Win / Mac
	var netscape  = $.browser.netscape();  // Netscape
	var opera     = $.browser.opera();     // Opera
	var safari    = $.browser.safari();    // Safari
				
	var userbrowser     = $.browser.browser(); //detected user browser

	//operating systems

	var linux = $.browser.linux(); // Linux
	var mac   = $.browser.mac();   // Mac OS
	var win   = $.browser.win();   // Microsoft Windows

	//version

	var userversion    = $.browser.version.number();

	/* ----------------------------------------------------------------- */
				
	if (mac == true) { 
		
		$("body").addClass("mac"); 
				
		
	} else if (linux == true) {
		
		$("body").addClass("linux"); 
		
	} else if (win == true) {
		
		$("body").addClass("windows");
		
	}

	/* ----------------------------------------------------------------- */			

	if (userbrowser == "Safari") {
		
		$("body").addClass("safari"); 
		
	} else if (userbrowser == "Firefox") {

		$("body").addClass("firefox"); 

	} else if (userbrowser == "Camino") {

		$("body").addClass("camino"); 

	} else if (userbrowser == "AOL Explorer") {

		$("body").addClass("aol"); 

	} else if (userbrowser == "Flock") {

		$("body").addClass("flock"); 

	} else if (userbrowser == "iCab") {

		$("body").addClass("icab"); 

	} else if (userbrowser == "Konqueror") {

		$("body").addClass("konqueror"); 

	} else if (userbrowser == "Mozilla") {

		$("body").addClass("mozilla" + userversion);

	} else if (userbrowser == "Netscape") {

		$("body").addClass("netscape"); 

	} else if (userbrowser == "Opera") {

		$("body").addClass("opera"); 

	} else if (userbrowser == "Internet Explorer") {
		
		$("body").addClass("ie");
		
	} else {
		$("body").addClass("khac");
	}

	$("body").addClass("" + userversion + "");
});