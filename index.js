#!/usr/bin/env node
const program = require('commander');
const inquirer = require('inquirer');
const yappesCli = require('./app/yappes_cli_processor');

let yappesCliObj = new yappesCli();

let loginQuestion = [{
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
        inquirer.prompt(loginQuestion).then(function(answers) {
            yappesCliObj.executeCommand('login', answers, function(err, results) {
                if (err) {
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
        yappesCliObj.executeCommand('whoami', inputData, function(err, results) {
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
        yappesCliObj.executeCommand('logout', inputData, function(err, results) {
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
    .description('Clone the API resources')
    .option('-a, --apiname <apiIdentifier>', 'API name for cloning')
    .action(function(options) {
        let inputData = {
            "apiIdentifier": options.apiname,
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
    .description('Status of the API endpoint')
    .option('-a, --apiname <apiName>', 'API name for status')
    .action(function(options) {
        let inputData = {
            "apiName": options.apiname
        };
        yappesCliObj.executeCommand('status', inputData, function(err, results) {
            if (err) {
                console.log(err);
            } else {
                console.log(results);
            }
        });
    });
program
    .command('deploy')
    .alias('dp')
    .description('Deploying the business logic changes to the remote')
    .option('-a, --apiname <apiname>', 'API Name to enter')
    .option('-e, --endpointname <endpointname>', 'Endpoint Name to enter')
    .action(function(options) {
        let inputData = {
            "apiName": options.apiname,
            "endPointName": options.endpointname
        };
        yappesCliObj.executeCommand('deploy', inputData, function(err, results) {
            if (err) {
                console.log(err);
            } else {
                console.log(results);
            }
        });
    });

program
    .command('execute')
    .alias('ex')
    .description('execute the business logic for the endpoint')
    .option('-a, --apiname <apiname>', 'API Name to enter')
    .option('-e, --endpointname <endpointname>', 'Endpoint Name to enter')
    .option('-r, --run <runflag>', 'execute the business logic in remote or local')
    .action(function(options) {
        let inputData = {
            "apiName": options.apiname,
            "endPointName": options.endpointname
        };
       yappesCliObj.executeCommand('execute', inputData, function(err, results) {
            if (err) {
                console.log(err);
            } else {
                console.log(results);
            }
        });
    });

program
    .command('pull')
    .alias('pl')
    .description('Pulling the business logic changes to local')
    .option('-a, --apiname <apiname>', 'API Name to enter')
    .option('-e, --endpointname <endpointname>', 'Endpoint Name to enter')
    .action(function(options) {
        let inputData = {
            "apiName": options.apiname,
            "endPointName": options.endpointname
        };
        yappesCliObj.executeCommand('pull', inputData, function(err, results) {
            if (err) {
                console.log(err);
            } else {
                console.log(results);
            }
        });
    });

program.on('command:*', function () {
  console.error('Invalid command: %s\nSee --help for a list of available commands.', program.args.join(' '));
  program.help();
});

program.parse(process.argv);