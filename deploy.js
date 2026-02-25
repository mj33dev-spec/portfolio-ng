const cmd = require('node-cmd');
const buildNumber = Date.now();

function build() {
    return new Promise(function (resolve, reject) {
        console.log('------------------------------------------------------------\n');
        console.log('build started');
        cmd.run(
            `
            ng build --configuration production
        `,
            function (error, success, stderr) {
                if (error) {
                    reject(error);
                } else {
                    console.log(success);
                    console.log('build ended');
                    console.log('------------------------------------------------------------\n');
                    resolve(success);
                }
            },
        );
    });
}
function commit() {
    return new Promise(function (resolve, reject) {
        console.log('------------------------------------------------------------\n');
        console.log('commit started');
        cmd.run(
            `
            git add *
            git commit -m "Build : ${Date()}"
            git push
            git log -1
        `,
            function (error, success, stderr) {
                if (error) {
                    reject(error);
                } else {
                    console.log(success);
                    console.log('commit ended');
                    console.log('------------------------------------------------------------\n');
                    resolve(success);
                }
            },
        );
    });
}

function uploadDev() {
    return new Promise(function (resolve, reject) {
        console.log('------------------------------------------------------------\n');
        console.log('upload started');
        cmd.run(
            `
            aws s3 cp dist/portfolio/browser s3://static-portfolio-prod --recursive --acl public-read-write --region ap-northeast-2 --profile mj
        `,
            function (error, success, stderr) {
                if (error) {
                    reject(error);
                } else {
                    console.log(success);
                    console.log('upload ended');
                    console.log('------------------------------------------------------------\n');
                    resolve(success);
                }
            },
        );
    });
}

function clear() {
    return new Promise(function (resolve, reject) {
        console.log('------------------------------------------------------------\n');
        console.log('upload started');
        cmd.run(
            `
            aws cloudfront create-invalidation --distribution-id E1XTTF8O9Z9ZNL --paths "/" "/*" --profile mj
        `,
            function (error, success, stderr) {
                if (error) {
                    reject(error);
                } else {
                    console.log(success);
                    console.log('upload ended');
                    console.log('------------------------------------------------------------\n');
                    resolve(success);
                }
            },
        );
    });
}

build().then(commit).then(uploadDev).then(clear);
