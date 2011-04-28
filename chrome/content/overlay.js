/*
	The contents of this file are subject to the Mozilla Public License
	Version 1.1 (the "License"); you may not use this file except in
	compliance with the License. You may obtain a copy of the License at
	http://www.mozilla.org/MPL/

	Software distributed under the License is distributed on an "AS IS"
	basis, WITHOUT WARRANTY OF ANY KIND, either express or implied. See the
	License for the specific language governing rights and limitations
	under the License.

	The Original Code is Paymo.biz Time Tracker.

	The Initial Developer of the Original Code is Valentin Agachi, http://agachi.name/

	Copyright (C) 2010-2011, Valentin Agachi. All Rights Reserved.
*/

var paymott =
{
	version: '@VERSION@',
	initialized: false,
	prefsBranch: null,
	preferences: {},
	statusPanel: null,
	popupProjects: null,

	miStop: null,
	miStart: null,
	
	ttDefault: null,
	ttUser: null,
	ttUsername: null,
	ttTask: null,
	ttTime: null,
	ttDiff: null,
	
	activeTask: null,
	active: false,
	paused: false,
	timeStart: 0,
	timePaused: 0,
	secondsPaused: 0,
	panelText: '',

	iconIndex: 1,

	timerTime: null,
	timerStatus: null,

	onLoad: function()
	{
		this.strings = document.getElementById("paymott-strings");

		var timerInit = Components.classes["@mozilla.org/timer;1"].createInstance(Components.interfaces.nsITimer);  
		timerInit.initWithCallback(paymottTimer, 1000, Ci.nsITimer.TYPE_ONE_SHOT);
	},

	onUnload: function()
	{
		if (this.active)
			this.onClickStop();
	},
	
	onLoadAfter: function()
	{
		this.timerTime = Components.classes["@mozilla.org/timer;1"].createInstance(Components.interfaces.nsITimer);  
		this.timerStatus = Components.classes["@mozilla.org/timer;1"].createInstance(Components.interfaces.nsITimer);  

		this.statusPanel = this.$('paymott-statuspanel');

		this.popupProjects = this.$('paymott-menupopup-projects');

		this.miStop = this.$('paymott-menuitem-stop');
		this.miPause = this.$('paymott-menuitem-pause');
		this.miStart = this.$('paymott-menuitem-start');

		this.$('paymott-tooltip-default').value += ' ver.' + this.version;

		this.ttUser = this.$('paymott-tooltip-user');
		this.ttUsername = this.$('paymott-tooltip-username');
		this.ttTask = this.$('paymott-tooltip-task');
		this.ttTime = this.$('paymott-tooltip-time');
		this.ttDiff = this.$('paymott-tooltip-diff');

		paymottPreferencesObserver.register();

		this.prefsBranch = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService).getBranch("extensions.paymott.");

		this.loadPreferences();

		if (this.preferences.fastStart)
		{
			this.statusPanel.setAttribute('popup', '');
			this.statusPanel.addEventListener('click', function(ev){
				paymott.onPanelClick(ev);
			}, false);
		}

		this.initialized = true;

		this.log('onLoadAfter() complete');

		paymottPassword.init();

		if (this.preferences.autoLogin)
		{
			this.onClickLogin();
		}

		// TODO load dynamically paymo-api.js, date.js
	},
	
	loadPreferences: function()
	{
		this.log('loadPreferences()');

		this.preferences = {
			apikey: this.prefsBranch.getCharPref("apikey"),
			username: this.prefsBranch.getCharPref("username"),
			autoLogin: this.prefsBranch.getBoolPref("autoLogin"),
			panelShow: this.prefsBranch.getBoolPref("panelShow"),
			panelFormat: this.prefsBranch.getCharPref("panelFormat"),
			iconAnimate: this.prefsBranch.getBoolPref("iconAnimate"),
			rememberTask: this.prefsBranch.getBoolPref("rememberTask"),
			fastStart: this.prefsBranch.getBoolPref("fastStart"),
			timeDescription: this.prefsBranch.getCharPref("timeDescription"),
			lastTask: this.prefsBranch.getIntPref("lastTask")
		};

		paymoAPI.apikey = this.preferences.apikey;

		if (!this.preferences.apikey.length)
		{
			this.ttTask.value = 'Please setup the API key and login data in Options!';
		}
		this.ttTask.hidden = (this.preferences.apikey.length > 0);

		return true;
	},

	savePreferences: function(prefs)
	{
		for (var k in prefs)
		{
			if (typeof(prefs[k]) == 'string')
				this.prefsBranch.setCharPref(k, prefs[k]);

			if (typeof(prefs[k]) == 'number')
				this.prefsBranch.setIntPref(k, prefs[k]);

			if (typeof(prefs[k]) == 'boolean')
				this.prefsBranch.setBoolPref(k, prefs[k]);
		}
	},



	onClickOptions: function()
	{
		window.openDialog("chrome://paymott/content/options.xul", "", null)
	},

	onClickLogin: function()
	{
		this.log('onClickLogin()');

		var password = paymottPassword.get(this.preferences.username);

		this.showStatus('Logging in ...');

		paymoAPI.login(this.preferences.username, password);
	},

	doLogin: function()
	{
		this.log('doLogin()');

		this.statusPanel.contextMenu = 'paymott-menupopup-projects';
		this.statusPanel.image = 'chrome://paymott/skin/clock-inactive.png';

		this.$('paymott-menuitem-loggedin').label = 'Logged in as: ' + this.preferences.username;

		this.ttUser.hidden = false;
		this.ttUsername.textContent = this.preferences.username;

		this.showStatus('Logged in as ' + this.preferences.username);

		paymoAPI.getProjects();
	},

	onClickLogout: function()
	{
		this.log('onClickLogout()');

		if (this.active)
			this.onClickStop();

		paymoAPI.logout();

		this.statusPanel.contextMenu = 'paymott-menupopup-logout';
		this.statusPanel.image = 'chrome://paymott/skin/paymo-bw-16x16.png';

		this.ttUser.hidden = true;
		this.ttTask.hidden = true;

		this.miStop.disabled = true;
		this.miPause.disabled = true;
		this.miStart.disabled = true;
	},

	doLogout: function()
	{
		this.panelText = '';
		this.showStatus('Logged out');
	},

	onClickRefresh: function()
	{
		paymoAPI.getProjects();
	},

	doProjects: function(projects)
	{
		this.log('doProjects() - lastTask: ' + this.preferences.lastTask);

		this.activeTask = null;

		var items = this.popupProjects.children;
		if (items.length > 6)
		{
			for (var i = items.length - 1; i > 5; i--)
			{
				this.popupProjects.removeChild(items[i]);
			}
		}

		for (var i = 0; i < projects.length; i++)
		{
			var project = projects[i];

			var lists = project['task_lists']['task_list'];

			for (var j = 0; j < lists.length; j++)
			{
				var list = lists[j];

				if (list['tasks']['task'])
				{
					var tasks = list['tasks']['task'];

					for (var k = 0; k < tasks.length; k++)
					{
						var task = tasks[k];

						var child = document.createElement('menuitem');
						child.setAttribute('label', project['name'] + ': ' + task['name']);
						child.setAttribute('type', 'radio');
						child.setAttribute('id', 'task-' + task['id']);
						child.addEventListener('click', function(e){ paymott.onClickTaskItem(e) }, false);
						this.popupProjects.appendChild(child);

						if (this.preferences.rememberTask && (task['id'] == this.preferences.lastTask))
						{
							child.setAttribute('checked', true);
							child.click();
						}
					}
				}
			}
		}

		this.ttTask.hidden = true;
	},

	onClickTaskItem: function(event)
	{
		this.activeTask = [parseInt(event.target.id.split('-')[1]), event.target.getAttribute('label')];

		this.ttTask.hidden = false;

		this.miStop.disabled = true;
		this.miPause.disabled = true;
		this.miStart.disabled = false;
	
		this.showStatus('Active task: ' + this.activeTask[1]);

		this.savePreferences({ lastTask: this.activeTask[0] });

		if (this.preferences.panelShow && this.preferences.panelFormat.match(/%p/))
		{
			this.panelText = this.getPanelText('%p');
		}
	},

	onClickStart: function()
	{
		this.active = true;

		this.timeStart = new Date();
		this.secondsPaused = 0;

		this.statusPanel.image = 'chrome://paymott/skin/clock-active-1.png';
		if (this.preferences.panelShow)
		{
			this.showPanelText(this.getPanelText());
		}

		this.miStop.disabled = false;
		this.miPause.disabled = false;
		this.miStart.disabled = true;

		this.iconIndex = 1;
		this.timerTime.init(paymottTimer, 1000, Ci.nsITimer.TYPE_REPEATING_PRECISE);
	},

	onClickPause: function(stop)
	{
		this.paused = !this.paused;

		if (this.paused)
		{
			this.timePaused = new Date();

			this.miPause.label = 'Resume';

			this.statusPanel.image = 'chrome://paymott/skin/clock-paused.png';

			this.timerTime.cancel();

			this.onTimerIcon();
		}
		else
		{
			this.secondsPaused += paymottDate.diffSeconds(this.timePaused, new Date());

			this.miPause.label = 'Pause';

			if (!stop)
			{
				this.statusPanel.image = 'chrome://paymott/skin/clock-active-1.png';

				this.timerTime.init(paymottTimer, 1000, Ci.nsITimer.TYPE_REPEATING_PRECISE);
			}
		}
	},

	onClickStop: function()
	{
		if (this.paused)
			this.onClickPause(true);

		this.active = false;

		this.showStatus('Recording time ...');

		this.timeEnd = new Date();
		this.timeEnd = new Date(this.timeEnd.getTime() - this.secondsPaused * 1000);

		paymoAPI.timeAdd(this.timeStart, this.timeEnd, this.preferences.timeDescription);

		this.statusPanel.image = 'chrome://paymott/skin/clock-inactive.png';

		this.miStop.disabled = true;
		this.miPause.disabled = true;
		this.miStart.disabled = false;

		this.timerTime.cancel();

		if (this.preferences.panelShow && this.preferences.panelFormat.match(/%p/))
		{
			this.panelText = this.getPanelText('%p');
		}
	},


	onPanelClick: function(event)
	{
		if (event.button != 0)
			return;
	
		if (this.activeTask == null)
			return;

		this.active ? this.onClickStop() : this.onClickStart();
	},


	doTimeAdd: function()
	{
		var diff = this.timeDiff(this.timeStart, this.timeEnd, 0, true);
		this.showStatus('Time recorded: ' + diff);
	},
	
	onTimerIcon: function()
	{
		if (this.preferences.iconAnimate && !this.paused)
		{
			this.iconIndex++;
			if (this.iconIndex > 8)
				this.iconIndex = 1;
			this.statusPanel.image = 'chrome://paymott/skin/clock-active-' + paymott.iconIndex + '.png';
		}

		if (this.preferences.panelShow)
		{
			this.panelText = this.getPanelText();
			this.showPanelText(this.panelText);
		}
	},
	
	getPanelText: function(f)
	{
		var t = (f ? f : this.preferences.panelFormat);

		t = t.replace('%p', this.activeTask[1]);

		if (this.active)
		{
			if (!this.paused)
			{
				var diff = this.timeDiff(this.timeStart, new Date(), this.secondsPaused - 1, true);
				t = t.replace('%s', diff);
				t = t.replace('%t', diff.substr(0, 5));
			}
			else
			{
				t = t.replace('%s', 'PAUSED');
				t = t.replace('%t', 'PAUSED');
			}
		}

		return t;
	},

	onTooltipShow: function()
	{
		if (!this.initialized)
			return;

		this.ttTime.hidden = !this.active;

		if (this.activeTask)
		{
			this.ttTask.value = this.activeTask[1];
		}
		if (this.active)
		{
			var secPaused = this.secondsPaused;

			if (this.paused)
				secPaused += paymottDate.diffSeconds(this.timePaused, new Date());

			this.ttDiff.textContent = this.timeDiff(this.timeStart, new Date(), secPaused, true);
		}
	},

	showStatus: function(msg)
	{
		this.showPanelText(msg);

		this.timerStatus.cancel();

		var _event = {
			notify: function(){
				paymott.clearPanelText();
			}
		};

		this.timerStatus.initWithCallback(_event, 3000, Ci.nsITimer.TYPE_ONE_SHOT);
	},
	
	showPanelText: function(msg)
	{
		this.statusPanel.className = 'statusbarpanel-iconic-text';
		this.statusPanel.label = msg;
	},

	clearPanelText: function()
	{
		if (!this.panelText.length)
		{
			this.statusPanel.className = 'statusbarpanel-iconic';
		}
		this.statusPanel.label = this.panelText;
	},

	log: function(msg)
	{
		paymottUtils.log(msg);
	},

	timeDiff: function(start, end, paused, seconds)
	{
		var diff = paymottDate.diffSeconds(start, end) - paused;

		var h = Math.floor(diff / 3600);
		diff = diff % 3600;
		var m = Math.floor(diff / 60);
		var s = diff % 60;

		var t = (h.toString().length == 1 ? '0' + h : h);
		t += ':' + (m.toString().length == 1 ? '0' + m : m);
		if (seconds)
		{
			t += ':' + (s.toString().length == 1 ? '0' + s : s);
		}

		return t;
	},

	$: function(id){
		return document.getElementById(id);
	}
};

window.addEventListener("load", function(){ paymott.onLoad() }, false);
window.addEventListener("unload", function(){ paymott.onUnload() }, false);


var paymottTimer =
{
	notify: function(){
		paymott.onLoadAfter();
	},
	observe: function(){
		paymott.onTimerIcon();
	}
};


var paymottPreferencesObserver =
{
	register: function(){
		var prefService = Cc["@mozilla.org/preferences-service;1"].getService(Ci.nsIPrefService);
		this._branch = prefService.getBranch("extensions.paymott.");
		this._branch.QueryInterface(Ci.nsIPrefBranch2);
		this._branch.addObserver("", this, false);
	},

	unregister: function(){
		if(!this._branch) {
			return;
		}
		this._branch.removeObserver("", this);
	},

	observe: function(aSubject, aTopic, aData) {
		if (aTopic != "nsPref:changed") {
			return;
		}
		paymott.loadPreferences();
	}
};

