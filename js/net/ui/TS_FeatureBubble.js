define(['net/data/AppData', 'net/util/Util', 'net/ui/TS_Step', 'net/ui/TS_Feedback', 'net/ui/Tips', 'net/media/Media', 'net/ui/Quiz'], function(AppData, Util, TS_Step, TS_Feedback, Tips, Media, Quiz){


    function TS_FeatureBubble( containerDiv ){
    	
    	this.containerDiv = containerDiv;
    	
    	this.steps = [];
    	this.currentStep = {};
    	
    	this.curPersonnelIndex = -1;
    	this.numActivePersonnel = 0;
    	this.personnelOrderInterrupted = false;
 		this.curPersonnelDiv = {};
 		this.currentQuiz = {};
 		this.reviewCompleted = false;
 		
 		this.waitingFeedback = null;
 		this.curAudioDuration = 0;
 		this.curAudioProgress = 0;
 		this.curProgressRingTween = {};

    }
    
    TS_FeatureBubble.prototype.setupSteps = function() {
    	
    	//Get all steps from global config
    	var thisRef = this;
    	var stepConfigs = $(AppData.configXML).find("touchstone_steps step").each(function () {
    		
    		var st = new TS_Step( $(this) );
    		thisRef.steps.push(st);
    	
    	});   
    	    
    }
    
    TS_FeatureBubble.prototype.getStepInfo = function( stepId ) {
    	
    	//update current step config
    	for (var i = 0; i < this.steps.length; i++) {
    				
    		if ( this.steps[i].id == stepId ) {
    			
    			//return dimensions array and sound id
    			return [this.steps[i].dimensions, this.steps[i].introAudioId];
    			
    		}
    		
    	}
    
    }

    TS_FeatureBubble.prototype.setupAndShow = function( stepId ) {
    
    	var thisRef = this;
    	
    	//update current step config
    	for (var i = 0; i < this.steps.length; i++) {
					
			if ( this.steps[i].id == stepId ) {
			
				this.currentStep = this.steps[i];
				
			}
  		
    	}
    	
    	//Reset data from previous step feature
    	this.curPersonnelIndex = -1;
    	this.numActivePersonnel = 0;
    	this.reviewCompleted = false;
    	this.personnelOrderInterrupted = false;
    			
    	//Setup display based on step config
    	//TODO - bubble color
    	
    	//title
    	$(this.containerDiv).find("#step_feature_title").html( this.currentStep.dimensionsTitle );
    	
    	//center oval content
    	$(this.containerDiv).find("#center_oval #step_title").html( this.currentStep.descriptionTitle );
    	$(this.containerDiv).find("#center_oval #description").html( this.currentStep.descriptionContent );
    	
    	//show default view on center oval
    	$(thisRef.containerDiv).find("#center_oval div").hide();
    	$(thisRef.containerDiv).find("#center_oval #step_description_container").show();   
    	
    	//review buttons
    	$(this.containerDiv).find("#review_container button.rect-button").each( function (index) {
    		
    		//Remove any previous review click listeners
    		$(this).off( "click", thisRef.reviewBtnClicked );
    		
    		if (index < thisRef.currentStep.reviewBtns.length) {

    			//set button text
    			$(this).html(thisRef.currentStep.reviewBtns[index][0]);
    			
    			var vSrc = thisRef.currentStep.reviewBtns[index][1];
    			var aSrc = thisRef.currentStep.reviewBtns[index][2];
    			var qSrc = thisRef.currentStep.reviewBtns[index][3];
    			var rFeedback = thisRef.currentStep.reviewBtns[index][4];
    			
    			//add video links
    			if (typeof vSrc !== 'undefined' && vSrc !== false) {
    				$(this).attr('data-video', vSrc);
    				$(this).attr('id', 'video_'+index);
    			}
    			
    			//add audio link
    			if (typeof aSrc !== 'undefined' && aSrc !== false) {
    				$(this).attr('data-audio', aSrc);
    				$(this).attr('id', 'audio_'+index);
    			}
    			
    			//add Question/Answer link
    			if (typeof qSrc !== 'undefined' && qSrc !== false) {
    				$(this).attr('data-quiz', qSrc);
    			}
    			
    			//add optional feedback text. Will trigger leaf/feedback box.
    			if (typeof rFeedback !== 'undefined' && rFeedback !== false) {
    				$(this).attr('data-feedback', rFeedback);
    			}
    			
    			$(this).show();
    			$(this).on( "click", { thisRef: thisRef }, thisRef.reviewBtnClicked );
    			
    		} else {
    		
    			$(this).hide();
    			
    		}
    		
    		$(this).removeClass('visited');
    	
    	});

    	//activate personnel    	
    	$(this.containerDiv).find("#step_content .personnel").each(function () {
    	
    		$(this).removeClass("on");
    		$(this).removeClass("active");
    		//hide colored photo
    		$(this).find("#portrait_color").hide();
    		$(this).find("#portrait_bw").show();
    		//hide progress ring
    		$(this).find("#progress_ring").hide();
    	
    	});
    	for (var i = 0; i < this.currentStep.personnel.length; i++) {
    		
    		var roleId = Util.removeSpaces( this.currentStep.personnel[i][0] );
    		var persDiv = $(this.containerDiv).find("#role_" + roleId );
    		
    		//show colored photo
    		$(persDiv).find("#portrait_color").show();
			$(persDiv).find("#portrait_bw").hide();
			$(persDiv).addClass("on");
			$(persDiv).addClass("active");
			
  			this.numActivePersonnel ++;
  			
  			//Active personnel can be clicked at anytime
  			$(persDiv).off();
  			$(persDiv).on("click", function(event) {

  				var indexClicked  = thisRef.currentStep.getPersonnelIndexById( $(this).attr('id') );
  				  				
  				if ( indexClicked != thisRef.curPersonnelIndex ) {
  				
  					 thisRef.personnelOrderInterrupted = true;
  					 thisRef.curPersonnelIndex = indexClicked;
  					 
  				}
				
				thisRef.callOutPersonnel( thisRef.curPersonnelIndex, false );
  			    thisRef.personnelClicked( thisRef.currentStep.personnel[ thisRef.curPersonnelIndex ] );
  			    
  			});
  			
    	}

		this.transIn();
		
		//Show delayed scale up of active portraits, to draw attention
		TweenLite.set( $(this.containerDiv).find("#step_content .personnel"), { css: { scale:0.875 } } );
		TweenLite.to( $(this.containerDiv).find("#step_content .personnel.active"), 0.5, { css: { scale:1 }, delay:2,  ease:Elastic.easeOut });
		
		//Trigger first personnel
		TweenLite.delayedCall(2.5, function() { 
			thisRef.callOutNextPersonnel();
		});
    	
    }
    
    TS_FeatureBubble.prototype.reviewBtnClicked = function( event ) {
    	
    	var thisRef = event.data.thisRef;
    	
    	$(this).addClass('visited');
    	
    	console.log("reviewBtnClicked");
    	
    	//check for associated feedback
    	var fTxt = $(this).attr('data-feedback');
    	if (typeof fTxt !== 'undefined' && fTxt !== false) {
    		thisRef.waitingFeedback = fTxt;
    	}
    	
    	//check review progress
    	var numVisible = $(this).parent().find("button:visible").length;
    	var numVisited = $(this).parent().find("button.visited").length;
    	if (numVisited >= numVisible) {
    		thisRef.reviewCompleted = true;
    	}
    	    
    	//if quiz btn
    	var qSrc = $(this).attr('data-quiz');
    	if (typeof qSrc !== 'undefined' && qSrc !== false) {
    		thisRef.showQuiz( qSrc );
    		
    	} else {
    		//not quiz, no need to delay completion check
    		thisRef.checkForReviewCompletion();
    		
    	}

    }
    
    TS_FeatureBubble.prototype.showQuiz = function( quizId ) {
        	
    	//Setup up quiz
    	var quizData = this.currentStep.getQuizById( quizId );
    	
    	this.currentQuiz = new Quiz( $(this.containerDiv).find("#center_oval #question_answer_container"), $(quizData), this );
		this.currentQuiz.reset();
    	
    	//show review media/quiz
    	$(this.containerDiv).find("#center_oval #review_container").hide();   
    	$(this.containerDiv).find("#center_oval #question_answer_container").show();  

    }
    
    TS_FeatureBubble.prototype.onQuizFinished = function( ) {

    	//hide quiz, show review
    	$(this.containerDiv).find("#center_oval #question_answer_container").hide(); 
    	$(this.containerDiv).find("#center_oval #review_container").show();
    	
    	this.currentQuiz = {};
    	
    	this.checkForReviewCompletion();

    }
    
    TS_FeatureBubble.prototype.checkForReviewCompletion = function( ) {
    
    	//Drop leaf and show feedback if any is waiting. 
    	this.triggerAwaitingFeedback();

    	if (this.reviewCompleted == true) {
    		
    		Tips.showById("page_3_close_review");
    		
    	}
    	
    }
    
    TS_FeatureBubble.prototype.triggerAwaitingFeedback = function() {
    
    	if (this.waitingFeedback != null) {
	    	TS_Feedback.populateFeedback(this.waitingFeedback);
	    	TS_Feedback.dropLeaf();
	    	this.waitingFeedback = null;
    	}
    	
    }
    
    TS_FeatureBubble.prototype.callOutNextPersonnel = function( ) {
    	
    	this.curPersonnelIndex ++;
    	this.callOutPersonnel( this.curPersonnelIndex, true );
  
    }
    
    TS_FeatureBubble.prototype.callOutPersonnel = function( personnelIndex, doScale ) {
    	    	
    	var thisRef = this;
    	    	
    	//reset previous active personnel
    	this.killCurrentActivePersonnel();
    	
		thisRef.curPersonnelDiv = $( thisRef.containerDiv ).find( "#role_" + Util.removeSpaces( thisRef.currentStep.personnel[ personnelIndex ][0] ) );
	 	$(thisRef.curPersonnelDiv).addClass("active");
	 	this.liftPortrait( thisRef.curPersonnelDiv, doScale );
	 	this.startActivePortrait( "#e5c694", false );

    }

    TS_FeatureBubble.prototype.personnelClicked = function(personnelData) {

    	var sndId = personnelData[1];
    	var sndDelay = personnelData[2];
    	var thisRef = this;
    	
    	//start audio
    	Media.playTakeoverSound( sndId );
    	
    	//wait for end of audio. 
    	if (sndDelay == 'undefined' || sndDelay == null || sndDelay == undefined) sndDelay = 5; //default to 5 secs.
    	
    	//Things that happen AFTER end of sound. Can be interrupted.
    	TweenLite.delayedCall(sndDelay, function() {
    	
    		//drop leaf if there is feedback associated
    		var fTxt = personnelData[3];
    		if (typeof fTxt !== 'undefined' && fTxt !== false) {
    			thisRef.waitingFeedback = fTxt;
    			thisRef.triggerAwaitingFeedback();
    		}
    		
    		if (thisRef.personnelOrderInterrupted == false) {
    		
    			if (thisRef.curPersonnelIndex < thisRef.numActivePersonnel-1) {
    			
	    			//call out next personnel
	    			thisRef.callOutNextPersonnel();
	
	    		} else {
	    			//was last personnel to call out. 
	    			thisRef.killCurrentActivePersonnel();
	    			
	    			//show review media/quiz
	    			$(thisRef.containerDiv).find("#center_oval #step_description_container").hide();   
	    			$(thisRef.containerDiv).find("#center_oval #review_container").show();    
	    			
	    			Tips.showById("page_3_show_review");
	    					
	    		}
	    		
    		}

    	});

    	this.startPortraitProgressRing( sndDelay );
    	this.startActivePortrait( "#9dbbc5", true );
            
    };
    
    TS_FeatureBubble.prototype.startPortraitProgressRing = function( sndDelay ) {
    
    	//stop current progress ring if any
    	TweenLite.killTweensOf(this);
    	
    	var thisRef = this;
    	
    	//track audio to fill in portrait ring
    	this.curAudioDuration = sndDelay;
    	this.curAudioProgress = 0.0;

    	var cRadius = 54;
    	var cStroke = 9;
    	
    	$(this.curPersonnelDiv).find("#progress_ring").show(); //show progress ring
    	var c = $(this.curPersonnelDiv).find("#progress_ring").first();
    	var ctx = $(c)[0].getContext('2d');
    	
    	ctx.clearRect ( 0 , 0 , (cRadius+cStroke)*2, (cRadius+cStroke)*2 );
    	
    	ctx.strokeStyle = "#2a645e";//"#4d8b85";
    	ctx.lineWidth = cStroke;
    	ctx.webkitImageSmoothingEnabled=true;
    	
    	
    	this.curProgressRingTween = TweenLite.to( this, this.curAudioDuration, { curAudioProgress: 1,  ease:Linear.easeNone, onUpdate: 
    		function(){
    			
    			var num = 1 - thisRef.curAudioProgress;    			
    			if (num<0.01)num=0.001;
    			if (num>0.99)num=1.0;
    			
    			ctx.beginPath();
    			ctx.arc(cRadius+cStroke, cRadius+cStroke, cRadius, 0+(1.5*Math.PI),(2*num*Math.PI)+(1.5*Math.PI),true);
    			ctx.stroke();
    			
    			
    		} 
    	});  
    	
    }

    TS_FeatureBubble.prototype.killCurrentActivePersonnel = function( ) {
    	
    	if ( this.curPersonnelDiv ) {
    		
    		TweenLite.to( $(this.curPersonnelDiv), 0.5, { css: { scale:1, zIndex:0 },  ease:Power2.easeOut } );
    		TweenMax.killTweensOf( $(this.curPersonnelDiv).find(".circle-portrait img") );
    		
    		this.killActiveGlow();
    		this.curPersonnelDiv = null;
    		
    	}
    }
    
    TS_FeatureBubble.prototype.liftPortrait = function( portraitDiv, doFullScale ) {
    	
    	if (doFullScale){
    		//Initial scale up to draw attention
    		var portraitImg = $(portraitDiv).find(".circle-portrait img");
    		TweenLite.set( $(portraitImg), { boxShadow:"0px 0px 0px 0px rgba(0,0,0,0.2)", zIndex:1 });
    		TweenMax.to( $(portraitImg), 0.3, { css: { boxShadow:"0px 3px 10px 3px rgba(0,0,0,0.7)" }, delay:0.05,  ease:Power2.easeOut } );
    		TweenMax.from( $(portraitImg), 1.5, { css: { scale:1.05, boxShadow:"0px 0px 0px 0px rgba(0,0,0,0.2)" },  ease:Elastic.easeOut, repeatDelay:1, repeat:99 } );    	
    	} else {
    		//Only add shadow
    		TweenMax.to( $(portraitDiv).find(".circle-portrait img"), .25, { css: { boxShadow:"0px 2px 9px 2px rgba(0,0,0,0.5)" }, ease:Power1.easeIn });
    	}
	
    }
    
    TS_FeatureBubble.prototype.startActivePortrait = function( glowColor, isSpeaking ) {
    	
    	if ( this.curPersonnelDiv ) {
    		
    		if (isSpeaking == true) {
    		    		
    			//Make portrait 'wobble' as it talks
    			TweenMax.set( $(this.curPersonnelDiv).find(".circle-portrait img"), { css: { rotation:-3 } } ); 
    			TweenMax.to( $(this.curPersonnelDiv).find(".circle-portrait img"), 0.75, { css: { rotation:3 },  ease:Power1.easeInOut, yoyo: true, repeat:99 } ); // Teetering rotation
    			
    			//Display Speech bubble coming from active personnel
    			var tri = $(this.containerDiv).find("#speech_tri").first();
    			$(tri).show();
    			$(this.containerDiv).find("#speech_bubble").show();
    			var tX = parseInt( $(this.curPersonnelDiv).css("left") );
    			var tY = parseInt( $(this.curPersonnelDiv).css("top") );
    			var tR = 0;
    			
    			var position = $(this.curPersonnelDiv).attr('id');
    			switch (position) {
    				case 'role_CaseManager':
    					tX += 125;
    					tY += 60;
    					tR = -55;
    				break;
    				case 'role_Nurse':
    					tX += 130;
    					tY += 40;
    					tR = -65;
    				break;
    				case 'role_Counselor':
    					tX += 130;
    					tY += 20;
    					tR = -90;
    				break;
    				case 'role_Oncologist':
    					tX += 125;
    					tY -= 5;
    					tR = -115;
    				break;
    				case 'role_HealingTouchProvider':
    					tX += 120;
    					tY += 0;
    					tR = -135;
    				break;
    				case 'role_OccupationalTherapist':
    					tX -= 55;
    					tY += 45;
    					tR = 55;
    				break;
    				case 'role_Pharmacist':
    					tX -= 50;
    					tY += 35;
    					tR = 65;
    				break;
    				case 'role_FitnessSpecialist':
    					tX -= 50;
    					tY += 20;
    					tR = 90;
    				break;
    				case 'role_PMHNursePractitioner':
    					tX -= 40;
    					tY -= 25;
    					tR = 115;
    				break;
    				case 'role_ActivitiesCoordinator':
    					tX -= 45;
    					tY -= 10;
    					tR = 135;
    				break;
    				case 'role_Jenna':
    					//hide behind portrait
    					tX += 40;
    					tY += 40;
    					tR = 0;
    				break;
    			}
				
    			TweenMax.set( $(tri), { css: { left:tX, top:tY, rotation:tR } } ); 
    			
    			//Populate speech text
    			var speechTitle = this.currentStep.personnel[ this.curPersonnelIndex ][0] + ":";
    			var speechTxt = this.currentStep.personnel[ this.curPersonnelIndex ][4];
    			$(this.containerDiv).find("#center_oval #step_title").html( speechTitle );
    			$(this.containerDiv).find("#center_oval #description").html( speechTxt );
    			    		
    		} else {
    			
    			//Hide speech bubble
    			$(this.containerDiv).find("#speech_tri").hide();
    			$(this.containerDiv).find("#speech_bubble").hide();
    			
    			//Reset center oval text
    			$(this.containerDiv).find("#center_oval #step_title").html( this.currentStep.descriptionTitle );
    			$(this.containerDiv).find("#center_oval #description").html( this.currentStep.descriptionContent );
    			
    		}
    		
    	}
    	
    }
    
    TS_FeatureBubble.prototype.killActiveGlow = function( ) {
    	
    	if ( this.curPersonnelDiv ) {
    		
    		TweenMax.killTweensOf( $(this.curPersonnelDiv).find(".circle-portrait img") );
    		TweenMax.set( $(this.curPersonnelDiv).find(".circle-portrait img"), { boxShadow:"0px 0px 0px 0px #e5c694" });
    		$(this.curPersonnelDiv).removeClass("active");
    		
    		//Hide speech bubble
    		$(this.containerDiv).find("#speech_tri").hide();
    		$(this.containerDiv).find("#speech_bubble").hide();
    		
    	}
    }

    // kill() | stop everything
    TS_FeatureBubble.prototype.kill = function( ) {
    	
    	Media.killSounds();
    	
    	this.killCurrentActivePersonnel();
    	
    	this.transOut();
    	
    }
    
    TS_FeatureBubble.prototype.transIn = function() {
    	
    	var t = $(this.containerDiv);
    	var pl = $(this.containerDiv).find("#step_content");
    	
    	$(t).show();
    	TweenLite.set( $(t), { css: { autoAlpha:0, zIndex:1 } } );
    	TweenLite.to( $(t), 0.75, { css: { autoAlpha:1 }, delay:0.5,  ease:Power2.easeOut } );
    	
    	TweenLite.set( $(pl), { css: { autoAlpha:0, scale: 0.85, transformOrigin:"512px 350px" } } );
    	TweenLite.to( $(pl), 0.5, { css: { autoAlpha:1, scale:1 }, delay:0.75, ease:Power2.easeOut } );
    	    	
    }
    
    TS_FeatureBubble.prototype.transOut = function() {
    	
    	var t = $(this.containerDiv);
    	var pl = $(this.containerDiv).find("#step_content");
    	
    	TweenLite.to( $(t), 0.5, { css: { autoAlpha:0 }, ease:Power2.easeInOut } );
    	TweenLite.to( $(pl), 0.25, { css: { autoAlpha:0 }, ease:Power2.easeOut } );  
    	    
    }
    
    return TS_FeatureBubble;
    
});