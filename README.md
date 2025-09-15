# Quick Clouds

The Quick Clouds for Salesforce extension for Visual Studio Code connects to our centralized, curated set of best practices and rules and checks your Salesforce code for adherence to best practices.
Our ruleset includes best practices for Salesforce, Quick Clouds' own recommendations, and other industry standards.

> **Note**: This extension is a fork of the original [Live Check Quality for Salesforce](https://marketplace.cursorapi.com/items/?itemName=qualityclouds.livecheckqualityforsalesforce) extension, customized and enhanced for Quick Clouds' specific requirements.

Quick Clouds for Salesforce makes SaaS platforms such as Salesforce easier to govern and grow.
Designed by experts to deliver rich insights for both business and IT, it offers unrivalled transparency over the entire software development lifecycle.
Its comprehensive selection of automated solutions empower users to deliver high quality platforms in a fraction of the time.

Once installed and configured, your Quick Clouds extension lets you check and improve your code with best practices from our rulesets.

## Features

### Checking on demand
You can run a check on any file you're working on at any time.


## Extension Settings

You need to provide a valid API key to connect to the Quality Clouds ruleset for code checking.
To obtain an API key, contact your Quality Clouds admin.
If you're an admin, check out our [Administering API keys](https://docs.qualityclouds.com/display/QCD/Administering+API+keys) article.

Available settings:

- `QuickClouds.API-key`: Quick Clouds API Key.
- `QuickClouds.showSettingsButton`: Show Quick Clouds settings in the status bar (default: true).
- `QuickClouds.showQualityCenterButton`: Show Quality Center in the status bar (default: true).
- `QuickClouds.debugMode`: Enable debug mode to simulate write-off requests instead of sending them to the server.

## Supported configuration element (CE) types
You can check the following types of CEs: Classes, Triggers, Pages, Components, Objects, Reports, Workflows, Javascript.

## License & Attribution

This project is licensed under the MIT License. See [LICENSE.md](LICENSE.md) for details.

**Original Extension**: This extension is based on the original [Live Check Quality for Salesforce](https://marketplace.visualstudio.com/items?itemName=QualityClouds.livecheckqualityforsalesforce) extension by QualityClouds, which is also licensed under the MIT License.

**Attribution**:
- Original extension: Copyright 2023 QualityClouds
- Quick Clouds fork: Copyright (c) 2025 trevSmart