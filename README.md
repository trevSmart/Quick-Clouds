# Quick Clouds

The Quick Clouds for Salesforce extension for Visual Studio Code connects to our centralized, curated set of best practices and rules and checks your code against it in real time.
Our ruleset includes best practices for Salesforce, Quick Clouds' own recommendations, and other industry standards.

> **Note**: This extension is a fork of the original [Live Check Quality for Salesforce](https://marketplace.cursorapi.com/items/?itemName=qualityclouds.livecheckqualityforsalesforce) extension, customized and enhanced for Quick Clouds' specific requirements.

Quick Clouds for Salesforce makes SaaS platforms such as Salesforce easier to govern and grow.
Designed by experts to deliver rich insights for both business and IT, it offers unrivalled transparency over the entire software development lifecycle.
Its comprehensive selection of automated solutions empower users to deliver high quality platforms in a fraction of the time.

Once installed and configured, your Quick Clouds extension lets you check and improve your code with best practices from our rulesets.

## Features

### Checking on demand
Every time you wish, you can run a check on the file you are working on.


## Extension Settings

You need to provide a valid API key to connect the Quality Clouds ruleset against which your code will be checked.
To obtain an API key, contact your Quality Clouds admin.
If you're an admin, check out our [Administering API keys](https://docs.qualityclouds.com/display/QCD/Administering+API+keys) article.

Available settings:

- `QuickClouds.API-key`: Quick Clouds API Key.
- `QuickClouds.showSettingsButton`: Show Quick Clouds settings in the status bar (default: true).
- `QuickClouds.showQualityCenterButton`: Show Quality Center in the status bar (default: true).
- `QuickClouds.debugMode`: Enable debug mode to simulate write-off requests instead of sending them to the server.

## Supported configuration element (CE) types
You can check the following types of CEs: Classes, Triggers, Pages, Components, Objects, Reports, Workflows, Javascript.
