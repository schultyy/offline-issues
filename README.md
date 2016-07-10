# Offline Issues

This is your GitHub Issues client in the browser.

## Usage

You open the application from here: [https://schultyy.github.io/offline-issues/](https://schultyy.github.io/offline-issues/).

**Please note**: In order to use the application with all features you will need a personal access token from GitHub. You can
configure it here: [https://github.com/settings/tokens](https://github.com/settings/tokens).
**You only need permissions for the Repo scope.**
With this token configured you can access private repositories as well as public ones and also the access quota is not as low as
without this token.

## Start it locally

Install a http server to deliver the page:
```
$ npm install -g http-server
```

Then start it:
```
$ http-server
```

## Third party libraries used

- [https://github.com/michael/github](https://github.com/michael/github)
- [lodash](https://lodash.com/)
- jquery
- PouchDB
- PouchDB all-dbs
- markdown.js