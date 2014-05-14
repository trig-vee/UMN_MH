define(['libs/media/mediaelement-and-player.min', 'libs/soundmanager2/soundmanager2', 'net/data/AppData'], function(me, sm, AppData){


	function Media(){
	
		this.player = {};
			
	}
	
	/* ------ SETUP ------- */
	Media.setupPlayers = function(){
	
		this.setupSoundManager();
		this.setupVideoPlayer();
	
	};
	
	/* -------------------- */
	/* ------ VIDEO ------- */
	/* ---(MediaElement)--- */
	
	Media.setupVideoPlayer = function() {
		
		this.player = new MediaElementPlayer("#global_player", {
		
											    // shows debug errors on screen
											    enablePluginDebug: false,
											    // remove or reorder to change plugin priority
											    plugins: ['flash','silverlight'],
											    // specify to force MediaElement to use a particular video or audio type
											    type: '',
											    // path to Flash and Silverlight plugins
											    pluginPath: '/js/libs/media/',
											    // name of flash file
											    flashName: 'flashmediaelement.swf',
											    // name of silverlight file
											    silverlightName: 'silverlightmediaelement.xap',
											    // default if the <video width> is not specified
											    defaultVideoWidth: 640,
											    // default if the <video height> is not specified     
											    defaultVideoHeight: 360
											    
										    });
										    
		//Listen to global close button
		var thisRef = this;
		$("#vid_player_overlay #player_close").on("click", function(event){
			console.log("close video");
		    thisRef.killVideo();
		});
		$("#vid_player_overlay #player_bg").on("click", function(event){
			console.log("close video bg");
		    thisRef.killVideo();
		});
										    
	
	}
	
	Media.launchVideo = function( videoId, autoplay ) {
	
		var t = $("#vid_player_overlay");
		var pl = $("#vid_player_overlay #player_container");
		
		$(t).show();
		TweenLite.set( $(t), { css: { autoAlpha:0 } } );
		TweenLite.to( $(t), 0.75, { css: { autoAlpha:1 }, ease:Power2.easeOut } );
		
		TweenLite.set( $(pl), { css: { autoAlpha:0, scale: 0.85 } } );
		TweenLite.to( $(pl), 0.5, { css: { autoAlpha:1, scale:1 }, delay:0.25, ease:Power2.easeOut } );
		
		console.log("launchVideo:" + AppData.videoFolder + videoId + AppData.videoExtension );

		this.player.pause();
		this.player.setSrc( AppData.videoFolder + videoId + AppData.videoExtension );
		
		autoplay = typeof autoplay !== 'undefined' ? autoplay : false;
		
		if (autoplay==true) {
			this.player.play();
		}
	
	}

	Media.killVideo = function( ) {
		
		this.player.pause();
		
		var t = $("#vid_player_overlay");
		var pl = $("#vid_player_overlay #player_container");
		TweenLite.to( $(t), 0.5, { css: { autoAlpha:0 }, ease:Power2.easeInOut } );
		TweenLite.to( $(pl), 0.25, { css: { autoAlpha:0 }, ease:Power2.easeOut } );
		
	}
	
	
	
	
	/* -------------------- */
	/* ------ AUDIO ------- */ 
	/* --(SoundManager2)--- */
	
	Media.setupSoundManager = function() {
		
		soundManager.setup({
			 url: 'js/libs/soundmanager2/',
			 // ignore Flash where possible, use 100% HTML5 mode
			 preferFlash: false,
			 onready: function() {
			   // Ready to use; soundManager.createSound() etc. can now be called.
			   console.log("soundManager ready...");
			  	
			 }
		});
		
	}
	
	return Media;
    
});