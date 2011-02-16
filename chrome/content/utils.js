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

var paymottUtils =
{
	sConsole: null,
	debug: false,

	onLoad: function()
	{
		this.sConsole = Components.classes["@mozilla.org/consoleservice;1"].getService(Components.interfaces.nsIConsoleService);

		var prefs = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService);
		prefs = prefs.getBranch("extensions.paymott.");

		this.debug = prefs.getBoolPref("debug");
	},

	log: function(msg)
	{
		if (!this.sConsole || !this.debug)
			return;

		if ((msg.constructor != String))
			msg = JSON.stringify(msg);

		this.sConsole.logStringMessage('PaymoTT: ' + msg);
	}
};

window.addEventListener("load", function(){ paymottUtils.onLoad() }, false);
