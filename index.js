module.exports = class SthreeEnvPlugin {
  constructor(serverless, options) {
    this._serverless = serverless;
    this._options = options;
    this.hooks = {
      //'before:package:createDeploymentArtifacts': this.beforeDeployResource.bind(this),
      'after:s3sync:sync': this.beforeDeployResource.bind(this),
    };
  }

  beforeDeployResource() {
    this._serverless.cli.log('SthreeEnvPlugin : ' + 'is running');
    let stage = this._options.stage ? this._options.stage : this._serverless.service.provider.stage;
    let region = this._serverless.service.provider.region;

    let resourceName = this._serverless.service.custom.Loglist.Bucket;
    let keyName = this._serverless.service.custom.Loglist.Key;

    return this.getSThreeBucket(resourceName, keyName, stage, region).then(
      function(data, err) {
        this._serverless.cli.log('SthreeEnvPlugin : getting config from bucket ' + resourceName);
        if (err) {
          this._serverless.cli.log('SthreeEnvPlugin : ' + err);
        }
        let body = data.Body;

        // TODO: append to list instead of re-assign,
        // because of setting the entire object (which is then used by cfn in a diff)
        // it'll think it's adding "new" filters when it should be at most updating "old" ones
        this._serverless.service.functions.logs.events = JSON.parse(body);

        return true;
      }.bind(this),
    );
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
};
