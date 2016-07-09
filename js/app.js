'use strict';

function IssueDetailView(issue) {
  this.issue = issue;
}

IssueDetailView.prototype.renderAvatar = function() {
  return $("<div class='col-xs-1'><img class='img-responsive img-thumbnail' src='"+ this.issue.user.avatar_url +"'/></div>");
};

IssueDetailView.prototype.renderIssueAuthorAndDate = function() {
  var authorLink = $("<a target='_new' class='issue-user-url' href='"+ this.issue.user.html_url +"'>" + this.issue.user.login + "</a>");
  var createdAt = $("<time class='issue-created-at'>"+ this.issue.created_at +"</time>");

  var authorAndDate = $("<div class='issue-author-and-date'></div>");
  authorAndDate.append(authorLink);
  authorAndDate.append(createdAt);
  var container = $("<div class='col-xs-12'></div>");
  container.append(authorAndDate);
  return container;
};

IssueDetailView.prototype.render = function() {
  var container = $('.issue-detail');
  var backButton = $("<div class='col-xs-12'><div class='back-button'></div></div>");
  backButton.click(this.hide);
  container.append(backButton);

  var title = $("<div class='col-xs-11'><span class='issue-number'>#"+ this.issue.number +"</span><span class='issue-title'>"+ this.issue.title +"</span></div>");
  var text = $("<div class='col-xs-12'><div class='issue-detail-text'>" + prepareBody(this.issue.body) + "</div></div>");

  container.append(this.renderAvatar());
  container.append(title);
  container.append($("<div class='clearfix'>"));
  container.append(this.renderIssueAuthorAndDate());
  container.append(text);
  $(container).show();
  $(".issue-list").hide();

  function prepareBody(body) {
    return markdown.toHTML(body);
  }
}

IssueDetailView.prototype.hide = function() {
  $(".issue-list").show();
  $(".issue-detail").hide();
  $(".issue-detail").empty();
};

(function() {
  var issueDetailView = null;

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

    function showIssueDetail(ev) {
      var id = $(this).attr('id');
      var db = new PouchDB(repoName);
      db.get(id)
        .then(function(issue) {
          issueDetailView = new IssueDetailView(issue);
          issueDetailView.render();
        })
        .catch(function(err) {
          console.log("ERR", err);
          new ErrorBanner(err);
        });
    }
  }

  function fetchIssues(ev) {
    ev.preventDefault();
    var repo = repoName();
    if(!repo || repo === "") {
      return;
    }

    if(issueDetailView) {
      issueDetailView.hide();
      issueDetailView = null;
    }
    $(".issue-list").empty();

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
        new ErrorBanner("Fetching issues for " + repo + " failed");
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
          if(issueDetailView) {
            issueDetailView.hide();
            issueDetailView = null;
          }
          renderListView(db);
          $('.available-repos').hide();
        });
        return dbEntry;
      });
      $(".repository-list").append(dbEntries);
    }).catch(function (err) {
      console.error("Failed to fetch all databases", err);
      new ErrorBanner("Failed to fetch all databases");
    });
  }

  function ErrorBanner(message) {
    this.timeoutHandler = null;

    $(".error-banner").html(message);
    $('.error-banner').show();

    this.hideError = function() {
      $(".error-banner").html('');
      $('.error-banner').hide();
      window.clearTimeout(this.timeoutHandler);
      this.timeoutHandler = null;
    }
    this.timeoutHandler = setTimeout(this.hideError, 1000 * 5);
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