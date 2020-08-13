function createCommonjsModule(fn, basedir, module) {
	return module = {
	  path: basedir,
	  exports: {},
	  require: function (path, base) {
      return commonjsRequire(path, (base === undefined || base === null) ? module.path : base);
    }
	}, fn(module, module.exports), module.exports;
}

function getCjsExportFromNamespace (n) {
	return n && n['default'] || n;
}

function commonjsRequire () {
	throw new Error('Dynamic requires are not currently supported by @rollup/plugin-commonjs');
}

var vendors = [
	{
		name: "AppVeyor",
		constant: "APPVEYOR",
		env: "APPVEYOR",
		pr: "APPVEYOR_PULL_REQUEST_NUMBER"
	},
	{
		name: "Azure Pipelines",
		constant: "AZURE_PIPELINES",
		env: "SYSTEM_TEAMFOUNDATIONCOLLECTIONURI",
		pr: "SYSTEM_PULLREQUEST_PULLREQUESTID"
	},
	{
		name: "Bamboo",
		constant: "BAMBOO",
		env: "bamboo_planKey"
	},
	{
		name: "Bitbucket Pipelines",
		constant: "BITBUCKET",
		env: "BITBUCKET_COMMIT",
		pr: "BITBUCKET_PR_ID"
	},
	{
		name: "Bitrise",
		constant: "BITRISE",
		env: "BITRISE_IO",
		pr: "BITRISE_PULL_REQUEST"
	},
	{
		name: "Buddy",
		constant: "BUDDY",
		env: "BUDDY_WORKSPACE_ID",
		pr: "BUDDY_EXECUTION_PULL_REQUEST_ID"
	},
	{
		name: "Buildkite",
		constant: "BUILDKITE",
		env: "BUILDKITE",
		pr: {
			env: "BUILDKITE_PULL_REQUEST",
			ne: "false"
		}
	},
	{
		name: "CircleCI",
		constant: "CIRCLE",
		env: "CIRCLECI",
		pr: "CIRCLE_PULL_REQUEST"
	},
	{
		name: "Cirrus CI",
		constant: "CIRRUS",
		env: "CIRRUS_CI",
		pr: "CIRRUS_PR"
	},
	{
		name: "AWS CodeBuild",
		constant: "CODEBUILD",
		env: "CODEBUILD_BUILD_ARN"
	},
	{
		name: "Codeship",
		constant: "CODESHIP",
		env: {
			CI_NAME: "codeship"
		}
	},
	{
		name: "Drone",
		constant: "DRONE",
		env: "DRONE",
		pr: {
			DRONE_BUILD_EVENT: "pull_request"
		}
	},
	{
		name: "dsari",
		constant: "DSARI",
		env: "DSARI"
	},
	{
		name: "GitLab CI",
		constant: "GITLAB",
		env: "GITLAB_CI"
	},
	{
		name: "GoCD",
		constant: "GOCD",
		env: "GO_PIPELINE_LABEL"
	},
	{
		name: "Hudson",
		constant: "HUDSON",
		env: "HUDSON_URL"
	},
	{
		name: "Jenkins",
		constant: "JENKINS",
		env: [
			"JENKINS_URL",
			"BUILD_ID"
		],
		pr: {
			any: [
				"ghprbPullId",
				"CHANGE_ID"
			]
		}
	},
	{
		name: "Magnum CI",
		constant: "MAGNUM",
		env: "MAGNUM"
	},
	{
		name: "Netlify CI",
		constant: "NETLIFY",
		env: "NETLIFY_BUILD_BASE",
		pr: {
			env: "PULL_REQUEST",
			ne: "false"
		}
	},
	{
		name: "Sail CI",
		constant: "SAIL",
		env: "SAILCI",
		pr: "SAIL_PULL_REQUEST_NUMBER"
	},
	{
		name: "Semaphore",
		constant: "SEMAPHORE",
		env: "SEMAPHORE",
		pr: "PULL_REQUEST_NUMBER"
	},
	{
		name: "Shippable",
		constant: "SHIPPABLE",
		env: "SHIPPABLE",
		pr: {
			IS_PULL_REQUEST: "true"
		}
	},
	{
		name: "Solano CI",
		constant: "SOLANO",
		env: "TDDIUM",
		pr: "TDDIUM_PR_ID"
	},
	{
		name: "Strider CD",
		constant: "STRIDER",
		env: "STRIDER"
	},
	{
		name: "TaskCluster",
		constant: "TASKCLUSTER",
		env: [
			"TASK_ID",
			"RUN_ID"
		]
	},
	{
		name: "TeamCity",
		constant: "TEAMCITY",
		env: "TEAMCITY_VERSION"
	},
	{
		name: "Travis CI",
		constant: "TRAVIS",
		env: "TRAVIS",
		pr: {
			env: "TRAVIS_PULL_REQUEST",
			ne: "false"
		}
	}
];

var vendors$1 = /*#__PURE__*/Object.freeze({
	__proto__: null,
	'default': vendors
});

var vendors$2 = getCjsExportFromNamespace(vendors$1);

var ciInfo = createCommonjsModule(function (module, exports) {



var env = process.env;

// Used for testing only
Object.defineProperty(exports, '_vendors', {
  value: vendors$2.map(function (v) { return v.constant })
});

exports.name = null;
exports.isPR = null;

vendors$2.forEach(function (vendor) {
  var envs = Array.isArray(vendor.env) ? vendor.env : [vendor.env];
  var isCI = envs.every(function (obj) {
    return checkEnv(obj)
  });

  exports[vendor.constant] = isCI;

  if (isCI) {
    exports.name = vendor.name;

    switch (typeof vendor.pr) {
      case 'string':
        // "pr": "CIRRUS_PR"
        exports.isPR = !!env[vendor.pr];
        break
      case 'object':
        if ('env' in vendor.pr) {
          // "pr": { "env": "BUILDKITE_PULL_REQUEST", "ne": "false" }
          exports.isPR = vendor.pr.env in env && env[vendor.pr.env] !== vendor.pr.ne;
        } else if ('any' in vendor.pr) {
          // "pr": { "any": ["ghprbPullId", "CHANGE_ID"] }
          exports.isPR = vendor.pr.any.some(function (key) {
            return !!env[key]
          });
        } else {
          // "pr": { "DRONE_BUILD_EVENT": "pull_request" }
          exports.isPR = checkEnv(vendor.pr);
        }
        break
      default:
        // PR detection not supported for this vendor
        exports.isPR = null;
    }
  }
});

exports.isCI = !!(
  env.CI || // Travis CI, CircleCI, Cirrus CI, Gitlab CI, Appveyor, CodeShip, dsari
  env.CONTINUOUS_INTEGRATION || // Travis CI, Cirrus CI
  env.BUILD_NUMBER || // Jenkins, TeamCity
  env.RUN_ID || // TaskCluster, dsari
  exports.name ||
  false
);

function checkEnv (obj) {
  if (typeof obj === 'string') return !!env[obj]
  return Object.keys(obj).every(function (k) {
    return env[k] === obj[k]
  })
}
});
