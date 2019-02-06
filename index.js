#!/usr/bin/env node
const program = require('commander');
const inquirer = require('inquirer');
const yappesCli = require('./app/yappes_cli_processor');

let yappesCliObj = new yappesCli();


let loginQuestion = [
	{
		type: 'input',
		name: 'username',
		message: 'Enter your email address'
	},
	{
		type: 'input',
		name: 'password',
		message: 'Enter your password'
	}
];

program
	.version('0.0.1')
	.description('Yappes CLI');

program
	.command('login')
	.alias('l')
	.description('Login to Yappes')
	.action(function(cmd) {
		inquirer.prompt(loginQuestion).then(function(answers){
				yappesCliObj.executeCommand('login',answers, function(err, results){
					if(err){
						console.log(err);
					} else {
						console.log(results);
					}
				});
		});
	});

program
    .command('whoami')
    .alias('wh')
    .description('Logged in User details')
    .action(function() {
    	let inputData = {};
        yappesCliObj.executeCommand('whoami',inputData, function(err, results) {
            if (err) {
                console.log(err);
            } else {
                console.log(results);
            }
        });
    });

program
    .command('logout')
    .alias('lg')
    .description('Log out the current yappes user')
    .action(function() {
    	let inputData = {};
        yappesCliObj.executeCommand('logout',inputData,function(err, results) {
            if (err) {
                console.log(err);
            } else {
                console.log(results);
            }
        });
    });
program
    .command('clone')
    .alias('cl')
    .description('clone the api resources')
    .arguments('<apiIdentifier>')
    .action(function(apiIdentifier) {
        let inputData = {
            "apiIdentifier": apiIdentifier,
        };
        yappesCliObj.executeCommand('clone', inputData, function(err, results) {
            if (err) {
                console.log(err);
            } else {
                console.log(results);
            }
        });
    });
program
    .command('status')
    .alias('st')
    .description('status of the api endpoint')
    .option('--apiName <apiName>', 'api name for status')
    .action(function(options) {
        let inputData = {
            "apiName":options.apiName
        };
        yappesCliObj.executeCommand('status', inputData, function(err, results) {
            if (err) {
                console.log(err);
            } else {
                console.log(results);
            }
        });
    });
program.parse(process.argv);