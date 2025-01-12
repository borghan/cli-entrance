﻿function getHitokoto() {
    $.ajax({  
         type : "get",  
         async: false,  
         url : "http://api.hitokoto.us/rand?encode=jsc",  
         dataType : "jsonp",  
         jsonp: "fun", 
         jsonpCallback:"hitokoto",  
         success : function(json){
        var html="<span class='hitokoto' title='";
        html+="分类："+json.catname+"&#10;";
        html+="出自："+json.source+"&#10;";
        html+="喜欢："+json.like+"&#10;";
        html+="投稿："+json.author+" @ "+json.date+"'>";
        html+=json.hitokoto;
        html+="</span><span id='control'> - X </span>";
        $("#hitokoto").html(html); 
         },  
         error:function(e){
            alert('fail');  
         }  
     });
}

getHitokoto();

function pathFilename(path) {
	var match = /\/([^\/]+)$/.exec(path);
	if (match) {
		return match[1];
	}
}

function getRandomInt(min, max) {
	// via https://developer.mozilla.org/en/Core_JavaScript_1.5_Reference/Global_Objects/Math/random#Examples
	return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomChoice(items) {
	return items[getRandomInt(0, items.length-1)];
}

var xkcd = {
	latest: null,
	last: null,
	cache: {},
	
	get: function(num, success, error) {
		if (num == null) {
			path = '';
		} else if (Number(num)) {
			path = String(num);
		} else {
			error(false);
			return false;
		}
		
		if (num in this.cache) {
			this.last = this.cache[num];
			success(this.cache[num]);
		} else {
			return false;
		}
	}
};

TerminalShell.commands['sudo'] = function(terminal) {
	var cmd_args = Array.prototype.slice.call(arguments);
	cmd_args.shift(); // terminal
	if (cmd_args.join(' ') == 'make me a sandwich') {
		terminal.print('Okay.');
	} else {
		var cmd_name = cmd_args.shift();
		cmd_args.unshift(terminal);
		cmd_args.push('sudo');
		if (TerminalShell.commands.hasOwnProperty(cmd_name)) {
			this.sudo = true;
			this.commands[cmd_name].apply(this, cmd_args);
			delete this.sudo;
		} else if (!cmd_name) {
			terminal.print('sudo what?');
		} else {
			terminal.print('sudo: '+cmd_name+': command not found');
		}
	}
};

TerminalShell.filters.push(function (terminal, cmd) {
	if (/!!/.test(cmd)) {
		var newCommand = cmd.replace('!!', this.lastCommand);
		terminal.print(newCommand);
		return newCommand;
	} else {
		return cmd;
	}
});

TerminalShell.commands['shutdown'] = TerminalShell.commands['poweroff'] = function(terminal) {
	if (this.sudo) {
		terminal.print('Broadcast message from guest@0x0d.im');
		terminal.print();
		terminal.print('The system is going down for maintenance NOW!');
		terminal.print('El Psy Congroo!');
		return $('#screen').fadeOut();
	} else {
		terminal.print('Must be root.');
	}
};

TerminalShell.commands['logout'] =
TerminalShell.commands['exit'] = 
TerminalShell.commands['quit'] = function(terminal) {
	terminal.print('El Psy Congroo!');
	$('#prompt, #cursor').hide();
	terminal.promptActive = false;
};

TerminalShell.commands['restart'] = TerminalShell.commands['reboot'] = function(terminal) {
	if (this.sudo) {
		TerminalShell.commands['poweroff'](terminal).queue(function(next) {
			window.location.reload();
		});
	} else {
		terminal.print('Must be root.');
	}
};

function linkFile(url) {
	return {type:'dir', enter:function() {
		window.location = url;
	}};
}

Filesystem = {
	'welcome.txt': {type:'file', read:function(terminal) {
		terminal.print();
		terminal.print($('<h4>').text('~ Welcome to the 0x0d.im command line entrance ~'));
		terminal.print('Use "ls", "cat", and "cd" to navigate the filesystem.');
		terminal.print('If confused, type "help" for assistance.');
		terminal.print();
	}},
	'about.txt': {type:'file', read:function(terminal) {
		terminal.print();
		terminal.print($('<h4>').text('ABOUT THE SITE'));
		terminal.print();
		$.each([
			'This is the homepage, and also the command line entrance of 0x0d.im.',
			'0x0d.im is the personal website of mine, here you can find the way',
			'to my blog. For more about me, you can check the \"AboutMe\" directory or the blogs.',
			'',
			'Also you may try to take an adventure here, just have fun~',
			''
		], function(num, line) {
			terminal.print(line);
		});
	}}
};
Filesystem['blog'] = linkFile('http://0x0d.im');
Filesystem['github'] = linkFile('http://github.com/borghan');
Filesystem['AboutMe'] = linkFile('http://0x0d.im/i');
TerminalShell.pwd = Filesystem;

TerminalShell.commands['cd'] = function(terminal, path) {
	if (path in this.pwd) {
		if (this.pwd[path].type == 'dir') {
			this.pwd[path].enter(terminal);
		} else if (this.pwd[path].type == 'file') {
			terminal.print('cd: '+path+': Not a directory');
		}
	} else {
		terminal.print('cd: '+path+': No such file or directory');
	}
};

TerminalShell.commands['dir'] =
TerminalShell.commands['ls'] = function(terminal, path) {
	var name_list = $('<ul>');
	$.each(this.pwd, function(name, obj) {
		if (obj.type == 'dir') {
			name += '/';
		}
		name_list.append($('<li>').text(name));
	});
	terminal.print(name_list);
};

TerminalShell.commands['cat'] = function(terminal, path) {
	if (path in this.pwd) {
		if (this.pwd[path].type == 'file') {
			this.pwd[path].read(terminal);
		} else if (this.pwd[path].type == 'dir') {
			terminal.print('cat: '+path+': Is a directory');
		}
	} else if (pathFilename(path) == 'alt.txt') {
		terminal.setWorking(true);
		num = Number(path.match(/^\d+/));
		xkcd.get(num, function(data) {
			terminal.print(data.alt);
			terminal.setWorking(false);
		}, function() {
			terminal.print($('<p>').addClass('error').text('cat: "'+path+'": No such file or directory.'));
			terminal.setWorking(false);
		});
	} else {
		terminal.print('Nyan~ nyan~~ nyaan~~~~~');
	}
};

TerminalShell.commands['rm'] = function(terminal, flags, path) {
	if (flags && flags[0] != '-') {
		path = flags;
	}
	if (!path) {
		terminal.print('rm: missing operand');
	} else if (path in this.pwd) {
		if (this.pwd[path].type == 'file') {
			delete this.pwd[path];
		} else if (this.pwd[path].type == 'dir') {
			if (/r/.test(flags)) {
				delete this.pwd[path];
			} else {
				terminal.print('rm: cannot remove '+path+': Is a directory');
			}
		}
	} else if (flags == '-rf' || flags == '-Rf' && path == '/') {
		if (this.sudo) {
			TerminalShell.commands = {};
		} else {
			terminal.print('rm: cannot remove /: Permission denied');
		}
	}
};

TerminalShell.commands['wget'] = TerminalShell.commands['curl'] = function(terminal, dest) {
	if (dest == "blog" || dest == "blog-cn") {
		terminal.setWorking(true);
		var browser = $('<div>')
			.addClass('browser')
			.append($('<iframe>')
					.prop('src', "http://0x0d.im").width("100%").height(600)
					.one('load', function() {
						terminal.setWorking(false);
					}));
		terminal.print(browser);
		terminal.print("If returned a 404 error, please add http://, https:// or ftp:// at start of the URL.");
		return browser;
	} else if (dest == "github") {
		terminal.setWorking(true);
		var browser = $('<div>')
			.addClass('browser')
			.append($('<iframe>')
					.prop('src', "http://github.com/borghan").width("100%").height(600)
					.one('load', function() {
						terminal.setWorking(false);
					}));
		terminal.print(browser);
		terminal.print("If returned a 404 error, please add http://, https:// or ftp:// at start of the URL.");
		return browser;
	} else if (dest == "AboutMe" || dest == "aboutme") {
		terminal.setWorking(true);
		var browser = $('<div>')
			.addClass('browser')
			.append($('<iframe>')
					.prop('src', "http://0x0d.im/i").width("100%").height(600)
					.one('load', function() {
						terminal.setWorking(false);
					}));
		terminal.print(browser);
		terminal.print("If returned a 404 error, please add http://, https:// or ftp:// at start of the URL.");
		return browser;
	} else if (dest) {
		terminal.setWorking(true);
		var browser = $('<div>')
			.addClass('browser')
			.append($('<iframe>')
					.prop('src', dest).width("100%").height(600)
					.one('load', function() {
						terminal.setWorking(false);
					}));
		terminal.print(browser);
		terminal.print("If returned a 404 error, please add http://, https:// or ftp:// at start of the URL.");
		return browser;
	} else {
		terminal.print("Please specify a URL.");
	}
};

TerminalShell.commands['apt-get'] = TerminalShell.commands['aptitude'] = function(terminal, subcmd) {
	if (!this.sudo && (subcmd in {'update':true, 'upgrade':true, 'dist-upgrade':true})) {
		terminal.print('E: Unable to lock the administration directory, are you root?');
	} else {
		if (subcmd == 'update') {
			terminal.print('Reading package lists... Done');
		} else if (subcmd == 'upgrade') {
			if (($.browser.name == 'msie') || ($.browser.name == 'firefox' && $.browser.versionX < 3)) {
				terminal.print($('<p>').append($('<a>').prop('href', 'http://abetterbrowser.org/').text('To complete installation, click here.')));
			} else {
				terminal.print('This looks pretty good to me.');
			}
		} else if (subcmd == 'dist-upgrade') {
			var longNames = {'win':'Windows', 'mac':'OS X', 'linux':'Linux'};
			var name = $.os.name;
			if (name in longNames) {
				name = longNames[name];
			} else {
				name = 'something fancy';
			}
			terminal.print('You are already running '+name+'.');
		} else if (subcmd == 'moo') {
			terminal.print('        (__)');
			terminal.print('        (oo)');
			terminal.print('  /------\\/ ');
			terminal.print(' / |    ||  ');
			terminal.print('*  /\\---/\\  ');
			terminal.print('   ~~   ~~  '); 
			terminal.print('...."Have you mooed today?"...');
		} else if (!subcmd) {
			terminal.print('This APT has Super Cow Powers.');
		} else {
			terminal.print('E: Invalid operation '+subcmd);
		}
	}
};

function oneLiner(terminal, msg, msgmap) {
	if (msgmap.hasOwnProperty(msg)) {
		terminal.print(msgmap[msg]);
		return true;
	} else {
		return false;
	}
}

TerminalShell.commands['man'] = function(terminal, what) {
	pages = {
		'last': 'Man, last night was AWESOME.',
		'help': 'Man, help me out here.',
		'next': 'Request confirmed; you will be reincarnated as a man next.',
		'cat':  'Well now, are you a half-blood human from Nyan Planet?'
	};
	if (!oneLiner(terminal, what, pages)) {
		terminal.print('Oh, I\'m sure you can figure it out.');
	}
};

TerminalShell.commands['locate'] = function(terminal, what) {
	keywords = {
		'ninja': 'Ninja can not be found!',
		'keys': 'Have you checked your coat pocket?',
		'joke': 'Joke found on user.',
		'problem': 'Problem exists between keyboard and chair.',
		'raptor': 'BEHIND YOU!!!',
		'IBN5100': 'BE CAREFUL! Kikan is watching you!',
		'ibn5100': 'BE CAREFUL! Kikan is watching you!'
	};
	if (!oneLiner(terminal, what, keywords)) {
		terminal.print('Locate what?');
	}
};

Adventure = {
	rooms: {
		0:{description:'You are at a Future Gadget.', exits:{west:1, south:10}},
		1:{description:'Life is peaceful there.', exits:{east:0, west:2}},
		2:{description:'In the open air.', exits:{east:1, west:3}},
		3:{description:'Where the skies are blue.', exits:{east:2, west:4}},
		4:{description:'This is what we\'re gonna do.', exits:{east:3, west:5}},
		5:{description:'Sun in wintertime.', exits:{east:4, west:6}},
		6:{description:'We will do just fine.', exits:{east:5, west:7}},
		7:{description:'Where the skies are blue.', exits:{east:6, west:8}},
		8:{description:'This is what we\'re gonna do.', exits:{east:7}},
		10:{description:'A dark hallway.', exits:{north:0, south:11}, enter:function(terminal) {
				if (!Adventure.status.lamp) {
					terminal.print('You are eaten by a grue.');
					Adventure.status.alive = false;
					Adventure.goTo(terminal, 666);
				}
			}
		},
		11:{description:'Bed. This is where you sleep.', exits:{north:10}},
		666:{description:'You\'re dead!'}
	},
	
	status: {
		alive: true,
		lamp: false
	},
	
	goTo: function(terminal, id) {
		Adventure.location = Adventure.rooms[id];
		Adventure.look(terminal);
		if (Adventure.location.enter) {
			Adventure.location.enter(terminal);
		}
	}
};
Adventure.location = Adventure.rooms[0];

TerminalShell.commands['look'] = Adventure.look = function(terminal) {
	terminal.print(Adventure.location.description);	
	if (Adventure.location.exits) {
		terminal.print();
		
		var possibleDirections = [];
		$.each(Adventure.location.exits, function(name, id) {
			possibleDirections.push(name);
		});
		terminal.print('Exits: '+possibleDirections.join(', '));
	}
};

TerminalShell.commands['go'] = Adventure.go = function(terminal, direction) {
	if (Adventure.location.exits && direction in Adventure.location.exits) {
		Adventure.goTo(terminal, Adventure.location.exits[direction]);
	} else if (!direction) {
		terminal.print('Go where?');
	} else if (direction == 'up') {
		terminal.print("I don't have a swing.");
	} else if (direction == 'down') {
		terminal.print("On our first date?");
	} else {
		terminal.print('You cannot go '+direction+'.');
	}
};

TerminalShell.commands['light'] = function(terminal, what) {
	if (what == "lamp" || what == "candle") {
		if (!Adventure.status.lamp) {
			terminal.print('You set your lamp ablaze.');
			Adventure.status.lamp = true;
		} else {
			terminal.print('Your lamp is already lit!');
		}
	} else {
		terminal.print('Light what?');
	}
};

TerminalShell.commands['sleep'] = function(terminal, duration) {
	duration = Number(duration);
	if (!duration) {
		duration = 5;
	}
	terminal.setWorking(true);
	terminal.print("You take a nap.");
	$('#screen').fadeOut(1000);
	window.setTimeout(function() {
		terminal.setWorking(false);
		$('#screen').fadeIn();
		terminal.print("You awake refreshed.");
	}, 1000*duration);
};

// No peeking!
TerminalShell.commands['help'] = TerminalShell.commands['halp'] = function(terminal) {
	terminal.print();
	terminal.print($('<h4>').text('This would be cheating!'));
	terminal.print('Here\'re basic skills you may need:');
	terminal.print('- Use "ls" or "dir" to browse a directory.');
	terminal.print('- Use "cd" to move to a directory.');
	terminal.print('- Use "cat" to read a file in pure text.');
	terminal.print('And try out anything you like, most Unix commands would work.');
	terminal.print();
}; 

TerminalShell.fallback = function(terminal, cmd) {
	oneliners = {
		'make me a sandwich': 'What? Make it yourself.',
		'make love': 'I put on my robe and wizard hat.',
		'i read the source code': '<3',
		'pwd': 'You are in a maze of twisty passages, all alike.',
		'lpr': 'PC LOAD LETTER',
		'hello joshua': 'How about a nice game of Global Thermonuclear War?',
		'xyzzy': 'Nothing happens.',
		'date': 'You\'re a good human.',
		'hello': 'Why hello there!',
		'who': 'President Who?',
		'xkcd': 'You may call me 0x0d.',
		'0x0d': 'Hm?',
		'su': 'God mode activated. Remember, with great power comes great ... aw, screw it, go have fun.',
		'fuck': 'I have a headache.',
		'Fuck': 'I have a headache.',
		'whoami': 'You\'re a good human being.',
		'nano': 'Seriously? Why don\'t you just use Notepad.exe? Or MS Paint?',
		'top': 'It\'s up there --^',
		'moo':'moo',
		'ping': 'There is another submarine three miles ahead, bearing 225, forty fathoms down.',
		'find': 'What do you want to find? IBN5100?',
		'hello':'Hello.',
		'more':'Oh, yes! More! More!',
		'your gay': 'Keep your hands off it!',
		'hi':'Hi.',
		'echo': 'Echo ... echo ... echo ...',
		'bash': 'You bash your head against the wall. It\'s not very effective.',
		'ssh': 'ssh, Kikan is watching.',
		'uname': 'Future Gadget',
		'uname -a': 'Future Gadget 0x0d.im C204 3nd EDITION ver3.16 #1 Last Update: Sun Oct 11 2015',
		'uptime': 'From the past to the future, it\'s up to time.',
		'free': 'Yes you can look around for free.',
		'touch': 'Across the Great Wall, we can touch every corner in the world!',
		'finger': 'Mmmmmm...',
		'kill': 'Terminator deployed to 1973.',
		'use the force luke': 'I believe you mean source.',
		'use the source luke': 'I\'m not luke, you\'re luke!',
		'serenity': 'You can\'t take the sky from me.',
		'enable time travel': 'FATAL error: You didn\'t find IBN5100.',
		'IBN5100': 'No I\'m not IBN5100, I\'m Future Gadget C204',
		'ibn5100': 'No I\'m not IBN5100, I\'m Future Gadget C204',
		'ed': 'You are not a diety.',
		'netstat': 'CODE 418: are you a teapot?',
		'whereis': 'Where your treasure is, there will your heart be also.'
	};
	oneliners['emacs'] = 'You should really use vim.';
	oneliners['vi'] = oneliners['vim'] = 'You should really use emacs.';
	
	cmd = cmd.toLowerCase();
	if (!oneLiner(terminal, cmd, oneliners)) {
		if (cmd == "asl" || cmd == "a/s/l") {
			terminal.print(randomChoice([
				'2/AMD64/Server Rack',
				'328/M/Transylvania',
				'6/M/Battle School',
				'48/M/The White House',
				'7/F/Rapture',
				'Exactly your age/A gender you\'re attracted to/Far far away.',
				'7,831/F/Lothlórien',
				'42/M/FBI Field Office'
			]));
		} else if  (cmd == "hint") {
			terminal.print(randomChoice([
 				'We offer some really nice polos.',
 				$('<p>').html('This terminal will remain available at <a href="http://xkcd.com/unixkcd/">http://xkcd.com/unixkcd/</a>'),
 				'Use the source, Luke!',
 				'There are cheat codes.'
 			]));
		} else if (cmd == 'find IBN5100' || cmd == 'find ibn5100') {
			terminal.print('find: "IBN5100": No such Future Gadget');
		} else if (cmd == 'buy stuff') {
			Filesystem['store'].enter();
		} else if (cmd == 'time travel') {
			terminal.print('Error: No IBN5100 available.');
		} else if (/:\(\)\s*{\s*:\s*\|\s*:\s*&\s*}\s*;\s*:/.test(cmd)) {
			Terminal.setWorking(true);
		} else {
			$.get("/unixkcd/missing", {cmd: cmd});
			return false;
		}
	}
	return true;
};

$(document).ready(function() {
	Terminal.promptActive = false;
	$('#screen').bind('cli-load', function(e) {
		$('#screen').one('cli-ready', function(e) {
			Terminal.runCommand('cat welcome.txt');
		});
		Terminal.print($("<h4>").text("Enter 'help' for a list of built-in commands.").css("color", "#228B22"));
		Terminal.print();
		Terminal.runCommand('cat welcome.txt');
	});
	
});
