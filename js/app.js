'use strict';

(function() {
  function repoName() {
    return $('#repositoryName').val().toString();
  }

  function renderListView() {
    var repo = repoName();
    if(!repo || repo === "") {
      return;
    }
    var db = new PouchDB(repo);
    db.allDocs({ include_docs: true })
      .then(function(docs) {
        $(".issue-list").empty();
        var plainDocs = _.map(docs.rows, function(d) { return d.doc; });
        var views = _.map(plainDocs, renderIssueView);
        $(".issue-list").append(views);
      });

    function renderIssueView(issue) {
      var container = $("<a href='#' class='list-group-item'>");
      var heading = $("<h4 class='list-group-item-heading'></h4>")
      container.attr('id', issue.id);
      heading.html(issue.title);
      container.append(heading);
      container.click(showIssueDetail);
      return container;
    }

    function showIssueDetail(ev) {
      var id = $(this).attr('id');
      var db = new PouchDB(repoName());
      db.get(id)
        .then(function(issue) {
          var container = $('.issue-detail');
          var backButton = $("<div class='col-xs-12'><button>Back</button></div>");
          backButton.click(hideIssueDetails);
          container.append(backButton);

          var title = $("<div class='col-xs-11'><h4>"+ issue.title +"</h4></div>");
          var issueNumber = $("<div class='col-xs-1'><h4 class='issue-number'>#"+ issue.number +"</h4></div>");
          var text = $("<div class='col-xs-12'><p>" + issue.body + "</p></div>");
          container.append(issueNumber);
          container.append(title);
          container.append($("<div class='clearfix'>"));
          container.append(text);
          $(container).show();
          $(".issue-list").hide();
        })
        .catch(function(err) {
          console.log("ERR", err);
        });
    }

    function hideIssueDetails() {
      $(".issue-list").show();
      $(".issue-detail").hide();
      $(".issue-detail").empty();
    }
  }

  function fetchIssues(ev) {
    ev.preventDefault();
    var repo = repoName();
    if(!repo || repo === "") {
      return;
    }

    var gh = new GitHub();
    var issueHandle = gh.getIssues(repo);
    issueHandle.listIssues({}, function(_none, issues) {
      var db = new PouchDB(repo);
      db.bulkDocs(_.map(issues, setDocId))
      .then(function() {
          renderListView();
      })
      .catch(function(err){
        console.log("ERR", err);
      });
    });

    function setDocId(issue) {
      issue['_id'] = issue.id.toString();
      return issue;
    }
  }

  function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').then(function(registration) {
        // Registration was successful
        console.log('ServiceWorker registration successful with scope: ', registration.scope);
      }).catch(function(err) {
        // registration failed :(
        console.log('ServiceWorker registration failed: ', err);
      });
    }
  }

  function loadAvailableRepositories() {
    PouchDB.allDbs().then(function (dbs) {
      var dbEntries = dbs.map(function(db) {
        return $("<a href='#' class='list-group-item' id='"+ db +"'>" + db + "</a>");
      });
      $(".repository-list").append(dbEntries);
    }).catch(function (err) {
      // handle err
      console.error("Failed to fetch all databases", err);
    });
  }

  $(document).ready(function() {
    registerServiceWorker();
    $('.fetch-issues').click(fetchIssues);
    loadAvailableRepositories();
    renderListView();
  });
})();