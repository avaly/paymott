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

	Copyright (C) 2010, Valentin Agachi. All Rights Reserved.
*/

var paymott =
{
	initialized: false,
	sConsole: null,
	preferences: {},
	statusPanel: null,
	popupProjects: null,

	menuitemStop: null,
	menuitemStart: null,
	
	tooltipDefault: null,
	tooltipUser: null,
	tooltipUsername: null,
	tooltipTask: null,
	tooltipTime: null,
	tooltipStart: null,
	tooltipDiff: null,
	
	activeTask: 0,
	active: false,
	timeStart: 0,

	iconIndex: 1,
	iconTimer: null,

	onLoad: function()
	{
		this.strings = document.getElementById("paymott-strings");

		window.setTimeout(function(){ paymott.onLoadAfter() }, 1000);
	},
	
	onLoadAfter: function()
	{
		this.sConsole = Components.classes["@mozilla.org/consoleservice;1"].getService(Components.interfaces.nsIConsoleService);

		this.statusPanel = this.$('paymott-statuspanel');

		this.popupProjects = this.$('paymott-menupopup-projects');

		this.menuitemStop = this.$('paymott-menuitem-stop');
		this.menuitemStop.disabled = true;
		
		this.menuitemStart = this.$('paymott-menuitem-start');
		this.menuitemStart.disabled = true;

		this.tooltipUser = this.$('paymott-tooltip-user');
		this.tooltipUser.hidden = true;
		this.tooltipUsername = this.$('paymott-tooltip-username');
		this.tooltipTask = this.$('paymott-tooltip-task');
		this.tooltipTask.hidden = true;
		this.tooltipTime = this.$('paymott-tooltip-time');
		this.tooltipTime.hidden = true;
		this.tooltipStart = this.$('paymott-tooltip-start');
		this.tooltipDiff = this.$('paymott-tooltip-diff');

		paymottPreferencesObserver.register();

		this.loadPreferences();

		this.initialized = true;
	},
	
	loadPreferences: function()
	{
		var prefs = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService);
		prefs = prefs.getBranch("extensions.paymott.");

		this.preferences = {
			apikey: prefs.getCharPref("apikey"),
			username: prefs.getCharPref("username"),
			password: prefs.getCharPref("password")
		};

		paymoAPI.apikey = this.preferences.apikey;

		if (!this.preferences.apikey.length)
		{
			this.tooltipTask.value = 'Please setup the API key and login data in Options!';
			this.tooltipTask.hidden = false;
		}

		return true;
	},


	onClickLogin: function()
	{
		paymoAPI.login(this.preferences.username, this.preferences.password);
	},

	onClickLogout: function()
	{
		paymoAPI.logout();

		this.statusPanel.contextMenu = 'paymott-menupopup-logout';
		this.statusPanel.image = 'chrome://paymott/skin/paymo-bw-16x16.png';

		this.menuitemStop.disabled = true;
		this.menuitemStart.disabled = true;
	},

	doLogin: function()
	{
		this.statusPanel.contextMenu = 'paymott-menupopup-projects';
		this.statusPanel.image = 'chrome://paymott/skin/clock-paused.png';

		this.$('paymott-menuitem-loggedin').label = 'Logged in as: ' + this.preferences.username;

		this.tooltipUser.hidden = false;
		this.tooltipUsername.textContent = this.preferences.username;

		paymoAPI.getProjects();
	},

	onClickRefresh: function()
	{
		paymoAPI.getProjects();
	},

	doProjects: function(projects)
	{
		var items = this.popupProjects.children;
		if (items.length > 5)
		{
			for (var i = items.length - 1; i > 4; i--)
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
						child.addEventListener('command', function(e){ paymott.onClickTaskItem(e) }, false);
						this.popupProjects.appendChild(child);
					}
				}
			}
		}
	},

	test: function()
	{
		
	},

	onClickTaskItem: function(event)
	{
		this.activeTask = [parseInt(event.target.id.split('-')[1]), event.target.label];

		this.tooltipTask.hidden = false;

		this.menuitemStop.disabled = true;
		this.menuitemStart.disabled = false;
	},

	onClickStart: function()
	{
		this.active = true;

		this.timeStart = new Date();

		this.statusPanel.image = 'chrome://paymott/skin/clock-active-1.png';

		this.menuitemStop.disabled = false;
		this.menuitemStart.disabled = true;

		this.iconIndex = 1;
		this.iconTimer = setInterval(this.onTimerIcon, 2000);
	},

	onClickStop: function()
	{
		this.active = false;

		this.timeEnd = new Date();

		paymoAPI.timeAdd(this.timeStart, this.timeEnd);

		this.statusPanel.image = 'chrome://paymott/skin/clock-paused.png';

		this.menuitemStop.disabled = true;
		this.menuitemStart.disabled = false;

		clearInterval(this.iconTimer);
	},
	
	onTimerIcon: function()
	{
		paymott.iconIndex++;
		if (paymott.iconIndex > 8)
			paymott.iconIndex = 1;

		paymott.statusPanel.image = 'chrome://paymott/skin/clock-active-' + paymott.iconIndex + '.png';
	},

	onTooltipShow: function()
	{
//		this.tooltipTask.hidden = (this.activeTask == 0);
		this.tooltipTime.hidden = !this.active;

		if (this.activeTask)
		{
			this.tooltipTask.value = this.activeTask[1];
		}
		if (this.active)
		{
			this.tooltipStart.textContent = this.timeStart.format('HH:MM');
			this.tooltipDiff.textContent = this.timeDiff(this.timeStart, new Date())
		}
	},

	log: function(msg)
	{
		if (!this.sConsole)
			return;

		if ((msg.constructor != String) || (msg.indexOf('{') != 0))
			msg = JSON.stringify(msg);

		this.sConsole.logStringMessage('PaymoTT: ' + msg);
	},

	timeDiff: function(start, end)
	{
		var ts = start.getTime(), te = end.getTime(), diff = Math.floor((te - ts) / 1000);

		var h = Math.floor(diff / 3600);
		diff = diff % 3600;
		var m = Math.floor(diff / 60);
		var s = diff % 60;

		var t = (h.toString().length == 1 ? '0' + h : h) + ':';
		t += (m.toString().length == 1 ? '0' + m : m) + ':';
		t += (s.toString().length == 1 ? '0' + s : s);

		return t;
	},

	$: function(id){
		return document.getElementById(id);
	}
};

window.addEventListener("load", function(){ paymott.onLoad() }, false);




var paymottPreferencesObserver =
{
	register: function(){
		var prefService = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService);
		this._branch = prefService.getBranch("extensions.paymott.");
		this._branch.QueryInterface(Components.interfaces.nsIPrefBranch2);
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
}




