program
  .command('oauthlogin')
  .alias('l')
  .description('Login to Yappes')
  .action(() => {
    inquirer.prompt(loginQuestion).then((answers) => {
      if (answers != 'q') {
        // 1st approach
        (async function () {
          await ypopn('http://yappes.local/login', { wait: true });
          // console.log(response);
        }());

        // 2nd approach
        opn('http://yappes.local/login', { wait: true }).then((results) => {
          console.log('resulst');
        }, (err) => {
          if (err) {
            console.log('err');
          }
        });

        // 3rd approach
        const childObj = spawn('/usr/bin/xdg-open', ['http://yappes.local']);
        childObj.stdout.on('data', (data) => {
          console.log(`stdout: ${data}`);
        });
        childObj.stderr.on('error', (data) => {
          console.log(`stderror: ${data}`);
        });
        childObj.on('close', (data) => {
          console.log(`srdclose: ${data}`);
        });
        childObj.on('error', (data) => {
          console.log(`error: ${data}`);
        });
      }
    });
  });
