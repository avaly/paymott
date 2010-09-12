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

var paymoAPI =
{
	apikey: null,
	authToken: null,
	authenticated: false,
	requests: [],


	login: function(username, password)
	{
		this._method('auth.login', { 'username': username, 'password': password });
	},

	logout: function()
	{
		this._method('auth.logout');
	},

	getProjects: function()
	{
		this._method('projects.getList', { 'include_tasks': 1 });
	},

	timeAdd: function(start, end, description)
	{
		var ts = paymottDate.format(start, 'yyyy-mm-dd HH:MM:ss');
		var te = paymottDate.format(end, 'yyyy-mm-dd HH:MM:ss');

		this._method('entries.add', {
			'start': ts,
			'end': te,
			'task_id': paymott.activeTask[0],
			'added_manually': 0,
			'description': description
		});
	},



	_method: function(method, args)
	{
		var url = 'http://api.paymo.biz/service/paymo.' + method + '?api_key=' + this.apikey + '&format=json';
		if (this.authenticated && this.authToken.length)
		{
			url += '&auth_token=' + this.authToken;
		}
		for (var k in args)
		{
			url += '&' + k + '=' + encodeURI(args[k]);
		}

		this.requests[this.requests.length] = [method, url];

		paymott.log(this.requests);

		if (this.authenticated || (method == 'auth.login'))
		{
			this._request();
		}
		else
		{
			return false;
		}
	},

	_complete: function(responseText)
	{
		if (!this.requests.length)
			return false;

		var request = this.requests.shift();

		this.log(request);
		this.log(responseText);

		var response = JSON.parse(responseText);

		if (response['status'] != 'ok')
		{
			this.log('_complete() error in response: ' + responseText);

			return false;
		}

		switch (request[0])
		{
		case 'auth.login':

			this.authToken = response['token']['_content'];
			this.authenticated = true;

			paymott.doLogin();

			break;		

		case 'auth.logout':

			this.authenticated = false;

			paymott.doLogout();

			break;		

		case 'projects.getList':

			var projects = [];
			for (var i = 0; i < response['projects']['project'].length; i++)
			{
				var project = response['projects']['project'][i];
				if (project['retired'] == 0)
				{
					projects.push(project);
				}
			}

			paymott.doProjects(projects);

			break;
		
		case 'entries.add':

			paymott.doTimeAdd();

			break;
		}
	},
	
	_request: function()
	{
		if (!this.requests.length)
			return false;

		var url = this.requests[0][1], method = 'GET';

		if (this.requests[0][0] == 'entries.add')
			method = 'POST';

		try
		{
			var x = new XMLHttpRequest();
			x.overrideMimeType("text/json");
			x.open(method, url, true);
			x.onreadystatechange = function()
			{
				if (x.status != 200)
					return;
			}
			x.onload = function()
			{
				var r = x.responseText;
				paymoAPI._complete(r);
			}
			x.send(null);
		}
		catch (e)
		{
			paymott.log('_request() exception');
			paymott.log(e);
		}

		if (this.requests.length > 1)
		{
			var timer = Components.classes["@mozilla.org/timer;1"].createInstance(Components.interfaces.nsITimer);  
			timer.initWithCallback(paymoAPITimer, 30000, Components.interfaces.nsITimer.TYPE_ONE_SHOT);
		}
	},
	
	log: function(msg)
	{
		paymottUtils.log(msg);
	}
};


var paymoAPITimer =
{
	notify: function(timer){
		paymoAPI._request();
	},
};
