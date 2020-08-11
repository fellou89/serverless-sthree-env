module.exports = class SthreeEnvPlugin {
  constructor(serverless, options) {
    this._serverless = serverless;
    this._options = options;
    this.hooks = {
      // this has to happen before the stack is built so the lambda functions are configured
      'before:package:createDeploymentArtifacts': this.beforeDeployResource.bind(this),
    };
  }

  beforeDeployResource() {
    this._serverless.cli.log('SthreeEnvPlugin : ' + 'is running');
    let stage = this._options.stage ? this._options.stage : this._serverless.service.provider.stage;
    let region = this._serverless.service.provider.region;
    let logLists = this._serverless.service.custom.Loglists;

    return Promise.all(logLists.map((loglist) => {
      let resourceName = loglist.Bucket;
      let keyName = loglist.Key;

      this.getSThreeBucket(resourceName, keyName, stage, region).then(
        function(data, err) {
          this._serverless.cli.log('SthreeEnvPlugin : getting config from bucket ' + resourceName + ' with key ' + keyName);
          if (err) {
            this._serverless.cli.log('SthreeEnvPlugin : ' + err);
          }
          let body = data.Body;
          var functionName = loglist.Function;

          this._serverless.cli.log(body);

          // TODO: append to list instead of re-assign,
          // because of setting the entire object (which is then used by cfn in a diff)
          // it'll think it's adding "new" filters when it should be at most updating "old" ones
          this._serverless.service.functions[functionName].events = JSON.parse(body);
          return true
        }.bind(this),
      );
    }));
  }

  getSThreeBucket(bucketName, keyName, stage, region) {
    return this._serverless.getProvider(this._serverless.service.provider.name).request(
      'S3',
      'getObject',
      {
        Bucket: bucketName,
        Key: keyName,
      },
      stage,
      region,
    );
  }
}
