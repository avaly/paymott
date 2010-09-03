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

var paymottPassword = 
{
	hostname: 'chrome://paymott',
	formURL: null,
	httpRealm: 'paymo.biz',

	passManager: null,
	loginInfo: null,

	init: function()
	{
		this.passManager = Components.classes["@mozilla.org/login-manager;1"].getService(Components.interfaces.nsILoginManager);  
		this.loginInfo = new Components.Constructor("@mozilla.org/login-manager/loginInfo;1", Components.interfaces.nsILoginInfo, "init");
	},

/*
	test: function(){
		this.add('username1', Date.now());
		paymott.log('get(username1): ' + this.get('username1'));
	},
*/

	add: function(username, password)
	{
		this.log('Password.add(' + username + ', password hidden)');
		var loginOld= this.getLogin(username);
		var loginNew = new this.loginInfo(this.hostname, this.formURL, this.httpRealm, username, password, '', ''); 		
		if (loginOld)
		{
			this.passManager.modifyLogin(loginOld, loginNew); 
		}
		else
		{
			this.passManager.addLogin(loginNew);
		}
	},

	getLogin: function(username)
	{
		this.log('Password.getLogin(' + username + ')');
		try
		{
			var logins = this.passManager.findLogins({}, this.hostname, this.formURL, this.httpRealm);  
			for (var i = 0; i < logins.length; i++)
			{
				if (logins[i].username == username)
				{
					return logins[i];
				}
			}
		}
		catch (e) {
		}
		return null;
	},

	get: function(username)
	{
		this.log('Password.get(' + username + ')');
		var login = this.getLogin(username);
		if (login)
			return login.password;
		return '';
	},

	log: function(msg)
	{
		paymottUtils.log(msg);
	}
};


