'use strict';

(function() {
  function repoName() {
    return $('#repositoryName').val().toString();
  }

  function renderListView(repoName) {
    if(!repoName) {
      throw new Error("expected repoName");
    }
    var db = new PouchDB(repoName);
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
      heading.html("#" + issue.number + " " + issue.title);
      container.append(heading);
      container.click(showIssueDetail);
      return container;
    }

    function prepareBody(body) {
      return markdown.toHTML(body);
    }

    function showIssueDetail(ev) {
      var id = $(this).attr('id');
      var db = new PouchDB(repoName);
      db.get(id)
        .then(function(issue) {
          var container = $('.issue-detail');
          var backButton = $("<div class='col-xs-12'><div class='back-button'></div></div>");
          backButton.click(hideIssueDetails);
          container.append(backButton);

          var title = $("<div class='col-xs-11'><h4>"+ issue.title +"</h4></div>");
          var issueNumber = $("<div class='col-xs-1'><h4 class='issue-number'>#"+ issue.number +"</h4></div>");
          var text = $("<div class='col-xs-12'><p>" + prepareBody(issue.body) + "</p></div>");
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
  }

  function hideIssueDetails() {
      $(".issue-list").show();
      $(".issue-detail").hide();
      $(".issue-detail").empty();
    }

  function fetchIssues(ev) {
    ev.preventDefault();
    var repo = repoName();
    if(!repo || repo === "") {
      return;
    }
    hideIssueDetails();

    var gh = new GitHub();
    gh.getIssues(repo).listIssues()
      .then(function(resultSet) {
        var db = new PouchDB(repo);
        return db.bulkDocs(_.map(resultSet.data, setDocId));
      })
      .then(function(){
        renderListView(repo);
        $(".add-new-repo").hide();
      })
      .catch(function(err) {
        console.log("ERR", err);
      });

    function setDocId(issue) {
      issue['_id'] = issue.id.toString();
      return issue;
    }
  }

  function loadAvailableRepositories() {
    PouchDB.allDbs().then(function (dbs) {
      var dbEntries = dbs.map(function(db) {
        var dbEntry = $("<a href='#' class='list-group-item'>" + db + "</a>");
        dbEntry.click(function(ev) {
          renderListView(db);
          $('.available-repos').hide();
        });
        return dbEntry;
      });
      $(".repository-list").append(dbEntries);
    }).catch(function (err) {
      // handle err
      console.error("Failed to fetch all databases", err);
    });
  }

  $(document).ready(function() {
    $('.fetch-issues').click(fetchIssues);
    loadAvailableRepositories();
    $(".show-available-repo-button").click(function() {
      $(".available-repos").toggle();
      $(".add-new-repo").hide();
    });

    $(".add-repo-button").click(function() {
      $(".add-new-repo").toggle();
      $(".available-repos").hide();
    });
  });
})();