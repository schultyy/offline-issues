'use strict';

onmessage = function(event) {
  self.importScripts("pouchdb-5.4.5.js");
  self.importScripts("github.bundle.min.js");
  self.importScripts("lodash.js");
  var repoName = event.data.repoName;
  var accessToken = event.data.accessToken;
  var dbIdentifier = repoName + "/comments";
  var commentDB = new PouchDB(dbIdentifier);
  var apiClient = new GitHub({
    token: accessToken
  });
  apiClient
    .getIssues(repoName)
    .listIssues()
    .then(function(issues) {
      return Promise.all(_.map(issues.data, function(issue){
        return Promise.resolve(issue.number);
      }));
    })
    .then(function(issueNumbers) {
      return Promise.all(_.map(issueNumbers, function(number) {
        return Promise.resolve(apiClient
                  .getIssues(repoName)
                  .listIssueComments(number)
        ).then(function(comments) {
          if(comments.data.length === 0) {
            return Promise.resolve([]);
          }
          return Promise.resolve(_.map(comments.data, function(comment) {
            return Object.assign(comment, {issueId: number});
          }));
        });
      }));
    })
    .then(function(results) {
      var filteredComments = _.filter(results, function(result) { return result.length > 0; });
      return Promise.all(_.map(filteredComments, function(commentList) {
        return commentDB.bulkDocs(commentList);
      }));
    })
    .then(function() {
      self.postMessage({finished: true});
    })
    .catch(function(err) {
      console.log("ERR", err);
    });
}