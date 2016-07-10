'use strict';

function Label(text, color) {
  this.text = text;
  this.color = color;
}

Label.prototype.render = function() {
  var label = $("<span class='label col-xs-12 col-sm-3'>");
  label.html(this.text);
  label.css('background-color', "#" + this.color);
  return label;
};

function IssueDetailView(issue) {
  this.issue = issue;
}

IssueDetailView.prototype.renderAvatar = function() {
  return $("<div class='col-xs-3 col-sm-2'><img class='img-responsive img-thumbnail issue-avatar' src='"+ this.issue.user.avatar_url +"'/></div>");
};

IssueDetailView.prototype.renderLabels = function() {
  return _.map(this.issue.labels, function(label) {
    return new Label(label.name, label.color).render();
  });
};

IssueDetailView.prototype.renderIssueAuthorAndDate = function() {
  var authorLink = $("<a target='_new' class='issue-user-url' href='"+ this.issue.user.html_url +"'>" + this.issue.user.login + "</a>");
  var createdAt = $("<time class='issue-created-at'>"+ moment(this.issue.created_at).format("lll") +"</time>");

  var authorAndDate = $("<div class='issue-author-and-date'></div>");
  authorAndDate.append(authorLink);
  authorAndDate.append(createdAt);
  var container = $("<div class='col-xs-12 col-sm-12'></div>");
  container.append(authorAndDate);
  return container;
};

IssueDetailView.prototype.render = function() {
  var container = $('.issue-detail');
  var backButton = $("<div class='col-xs-12 col-sm-12'><div class='back-button'></div></div>");
  backButton.click(this.hide);
  container.append(backButton);

  var title = $("<div class='col-xs-12 col-sm-9'><span class='issue-number'>#"+ this.issue.number +"</span><span class='issue-title'>"+ this.issue.title +"</span></div>");
  var text = $("<div class='col-xs-12 col-sm-12'><div class='issue-detail-text'>" + prepareBody(this.issue.body) + "</div></div>");
  var labels = $("<div class='col-xs-12 col-sm-12'></div>");
  labels.append(this.renderLabels());

  container.append(this.renderAvatar());
  container.append(title);
  container.append($("<div class='clearfix'>"));
  container.append(labels);
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

function IssueListView(issues, detailCallback) {
  this.issues = issues;
  this.detailCallback = detailCallback;
}

IssueListView.prototype.render = function(detailCallback) {
  $(".issue-list").empty();
  var sortedIssues = _.sortBy(this.issues, function(issue) { return issue.created_at; })
  var views = _.map(sortedIssues.reverse(), this.renderIssueView.bind(this));
  $(".issue-list").append(views);
};

IssueListView.prototype.renderIssueView = function(issue) {
  var container = $("<a href='#' class='list-group-item'>");
  var heading = $("<h4 class='list-group-item-heading'></h4>")
  container.attr('id', issue.id);
  heading.html(buildHeading());
  container.append(heading);
  container.click(this.detailCallback);
  return container;

  function buildHeading() {
    if(isPR()) {
      return "#" + issue.number + " [Pull Request] " + issue.title;
    }
    return "#" + issue.number + " " + issue.title;
  }

  function isPR() {
    return issue.hasOwnProperty("pull_request");
  }
};

function IssueStore(repositoryName) {
  this.repositoryName = repositoryName;
  this.database = new PouchDB(this.repositoryName);
}

IssueStore.prototype.getIssue = function(id) {
  return this.database.get(id);
};

IssueStore.prototype.allIssues = function() {
  return this.database.allDocs({include_docs: true});
};

IssueStore.prototype.bulkInsertIssues = function(docs) {
  return this.database.bulkDocs(_.map(docs, setDocId));
  function setDocId(issue) {
    issue['_id'] = issue.id.toString();
    return issue;
  }
};

(function() {
  var issueDetailView = null;
  var database = null;

  function renderListView() {
    database.allIssues()
      .then(function(docs) {
        return Promise.resolve(_.map(docs.rows, function(d) { return d.doc; }));
      })
      .then(function(plainDocs) {
        new IssueListView(plainDocs, showIssueDetail).render();
      });

    function showIssueDetail(ev) {
      var id = $(this).attr('id');
      database.getIssue(id)
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
    var repo = $('#repositoryName').val().toString();
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
        database = new IssueStore(repo);
        return database.bulkInsertIssues(resultSet.data);
      })
      .then(function(){
        renderListView();
        $(".add-new-repo").hide();
      })
      .catch(function(err) {
        console.log("ERR", err);
        new ErrorBanner("Fetching issues for " + repo + " failed");
      });
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
          database = new IssueStore(db);
          renderListView();
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