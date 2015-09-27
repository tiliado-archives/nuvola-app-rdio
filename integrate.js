/*
 * Copyright 2013 Michael Mims <mims.michael@gmail.com>
 * Copyright 2014 Martin Pöhlmann <martin.deimos@gmx.de>
 * Copyright 2014 Jiří Janoušek <janousek.jiri@gmail.com>
 * Copyright 2015 Aaron Cripps <acripps@gmail.com>
 * Copyright 2015 Jordan Klassen <forivall@gmail.com>
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *
 * 1. Redistributions of source code must retain the above copyright notice, this
 *    list of conditions and the following disclaimer.
 * 2. Redistributions in binary form must reproduce the above copyright notice,
 *    this list of conditions and the following disclaimer in the documentation
 *    and/or other materials provided with the distribution.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
 * ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR
 * ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 * SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

"use strict";

(function(Nuvola)
{
	// Create media player component
	var player = Nuvola.$object(Nuvola.MediaPlayer);

	// Handy aliases
	var PlaybackState = Nuvola.PlaybackState;
	var PlayerAction = Nuvola.PlayerAction;

	// Create new WebApp prototype
	var WebApp = Nuvola.$WebApp();

	// Initialization routines
	WebApp._onInitWebWorker = function(emitter)
	{
		Nuvola.WebApp._onInitWebWorker.call(this, emitter);

		var state = document.readyState;
		if (state === "interactive" || state === "complete")
			this._onPageReady();
		else
			document.addEventListener("DOMContentLoaded", this._onPageReady.bind(this));
	}

	WebApp._onPageReady = function()
	{
		// Connect handler for signal ActionActivated
		Nuvola.actions.connect("ActionActivated", this);

		// Start update routine
		this.update();
	}

	// Extract data from the web page
	WebApp.update = function()
	{
		var canPrev = false;
		var canNext = false;
		var canPlay = false;
		var canPause = false;
		var track = {
			title:       null,
			artist:      null,
			album:       null,
			artLocation: null
		}

		var state = PlaybackState.UNKNOWN;

		try
		{
			var playingTrack = R.Services.Player.model.get("playingTrack").attributes;
			track = {
				title:  playingTrack.name,
				artist: playingTrack.artist,
				album: playingTrack.album,
				artLocation: playingTrack.icon400 || playingTrack.icon
			}

			switch (R.Services.Player.model.attributes.playState)
			{
				case 0:
					state = PlaybackState.PAUSED;
					canPause = false;
					canPlay = true;
					break;
				case 1:
					state = PlaybackState.PLAYING;
					canPause = true;
					canPlay = false;
					break;
			}

			if (state != PlaybackState.UNKNOWN)
				canPrev = canNext = true;
		}
		catch (e)
		{
			// console.debug("Unable to obtain state info: " + e.message);
			canPrev = canNext = false;
		}

		player.setTrack(track);
		player.setPlaybackState(state);
		player.setCanGoNext(canNext);
		player.setCanGoPrev(canPrev);
		player.setCanPlay(canPlay);
		player.setCanPause(canPause);

		// synchronise stream volume with app volume
		if (state == PlaybackState.PLAYING) {
			try {
				var playerVolume = R.Services.Player.volume();
				var streamVolume = R.Services.Player._audio._element.volume;
				if (streamVolume != null) {
					streamVolume = Math.sqrt(streamVolume);
					if (Math.abs(streamVolume - playerVolume) >= 0.01) {
						R.Services.Player.volume(streamVolume);
					}
				}
			}
			catch (e) {
				// do nothing
			}
		}

		// Schedule the next update
		setTimeout(this.update.bind(this), 500);
	}

	// Handler of playback actions
	WebApp._onActionActivated = function(emitter, name, param)
	{
		try
		{
			switch (name)
			{
				case PlayerAction.PLAY:
					R.Services.Player.play();
					break;
				case PlayerAction.PAUSE:
					R.Services.Player.pause();
					break;
				case PlayerAction.TOGGLE_PLAY:
					R.Services.Player.playPause();
					break;
				case PlayerAction.PREV_SONG:
					R.Services.Player.previous();
					break;
				case PlayerAction.NEXT_SONG:
					R.Services.Player.next();
					break;
				default:
					// Other commands are not supported
					throw {"message": "Not supported."};
			}
			console.log(Nuvola.format("{1} : comand '{2}' executed.", this.name, name));
		}
		catch (e)
		{
			console.log("Radio service is not available.");
		}
	}
	WebApp.start();
})(this);  // function(Nuvola)
