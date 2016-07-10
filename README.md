# Offline Issues

This project is an offline capable GitHub Issues readonly client. It can cache issues from private and public projects in your browser.

To accomplish that task it uses the following technologies:

- Service Workers
- IndexedDB (via PouchDB)
- Web Workers

This requires you to use a decent browser if you want to use all technologies at once. The following browsers are capable:

- Chrome >= 45
- Firefox >= 46

## Usage

You open the application from here: [https://schultyy.github.io/offline-issues/](https://schultyy.github.io/offline-issues/).

**Please note**: In order to use the application with all features you will need a personal access token from GitHub. You can
configure it here: [https://github.com/settings/tokens](https://github.com/settings/tokens).
**You only need permissions for the Repo scope.**
With this token configured you can access private repositories as well as public ones and also the access quota is not as low as without this token.

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

## Contribute
Contributions are very welcome. Whether it's an issue or even a pull request. For pull requests you can use the following flow:

  1. Fork it
  2. Create your feature branch (git checkout -b my-new-feature)
  3. Commit your changes (git commit -am 'Add some feature')
  4. Push to the branch (git push origin my-new-feature)
  5. Create new Pull Request


## License

MIT
