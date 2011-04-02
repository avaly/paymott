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

var paymottOptions =
{

	onLoad: function()
	{
		paymottUtils.log('Options.onLoad()');

		paymottPassword.init();

		var username = this.$('username-input').value;

		var password = paymottPassword.get(username);
		this.$('password-input').value = password;
	},

	onDialogAccept: function(a)
	{
		paymottUtils.log('Options.onDialogAccept()');

		this.save();

		return true;
	},

	onUnload: function(a)
	{
		paymottUtils.log('Options.onUnload()');

		if (paymottUtils.instant)
			this.save();

		return true;
	},

	save: function()
	{
		var username = this.$('username-input').value,
			password = this.$('password-input').value;

		paymottPassword.add(username, password);
	},

	$: function(id){
		return document.getElementById(id);
	}
};

window.addEventListener("load", function(){ paymottOptions.onLoad() }, false);
