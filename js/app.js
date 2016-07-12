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

function IssueDetailView(issue, issueStore) {
  this.issue = issue;
  this.issueStore = issueStore;
}

IssueDetailView.prototype.renderAvatar = function(avatar_url) {
  return $("<img class='img-responsive img-thumbnail avatar' src='"+ avatar_url +"'/>");
};

IssueDetailView.prototype.renderLabels = function() {
  return _.map(this.issue.labels, function(label) {
    return new Label(label.name, label.color).render();
  });
};

IssueDetailView.prototype.renderIssueAuthorAndDate = function() {
  var authorLink = $("<a target='_new' class='user-url' href='"+ this.issue.user.html_url +"'>" + this.issue.user.login + "</a>");
  var createdAt = $("<time class='created-at'>"+ moment(this.issue.created_at).format("lll") +"</time>");

  var authorAndDate = $("<div class='author-and-date'></div>");
  authorAndDate.append(authorLink);
  authorAndDate.append(createdAt);
  var container = $("<div class='col-xs-12 col-sm-12'></div>");
  container.append(authorAndDate);
  return container;
};

IssueDetailView.prototype.renderComments = function(container) {
  var self = this;
  this.issueStore.loadCommentsForIssue(this.issue.number)
  .then(function(comments) {
    container.append(_.map(comments, function(comment) {
      var comments = $("<div class='col-xs-12 col-sm-10'></div>");
      comments.append(createAuthorAndDate(comment));
      comments.append($("<p class='text'>" + comment.body + "</p>"));

      var container = $("<div>");
      var image = $("<div class='col-xs-2 col-sm-2'>");
      image.append(self.renderAvatar(comment.user.avatar_url));
      container.append(image);
      container.append(comments);
      container.append($('<div class="clearfix">'));
      return container;
    }));

    function createAuthorAndDate(comment) {
      var authorLink = $("<a target='_new' class='user-url' href='"+ comment.user.html_url +"'>" + comment.user.login + "</a>");
      var createdAt = $("<time class='created-at'>"+ moment(comment.created_at).format("lll") +"</time>");
      var authorAndDate = $("<div class='author-and-date'></div>");
      authorAndDate.append(authorLink);
      authorAndDate.append(createdAt);
      return authorAndDate;
    }
  })
  .catch(function (err) {
    new ErrorBanner("Error while fetching comments: " + err.message);
  });
};

IssueDetailView.prototype.renderAssignee = function() {
  var container = $("<div class='col-xs-6 col-sm-6 assignees'>");
  if(this.issue.assignee && this.issue.assignees && this.issue.assignees.length > 0) {
    var self = this;
    container.append("<div>Asignees: </div>");
    var assigneeList = $("<ul>");
    assigneeList.append(_.map(self.issue.assignees, function(assignee) {
      var assigneeLink = $("<a>");
      assigneeLink.attr("href", assignee.html_url);
      assigneeLink.html(assignee.login);
      var listItem = $("<li>");
      listItem.append(assigneeLink);
      return listItem;
    }));
    container.append(assigneeList);
  }
  return container;
};

IssueDetailView.prototype.renderMilestone = function() {
  var container = $("<div class='col-xs-6 col-sm-6'>");
  if(this.issue.milestone) {
    container.append("<span>Milestone: </span>");
    container.append("<div>" + this.issue.milestone.title + "</div>");
  }
  return container;
};

IssueDetailView.prototype.keyHandler = function(event) {
  if(event.keyCode == 8) { //backspace
    this.hide();
  }
};

IssueDetailView.prototype.render = function() {
  var container = $('.issue-detail');

  var backButton = $("<div class='col-xs-12 col-sm-12'><div class='back-button'></div></div>");
  backButton.click(this.hide);
  container.append(backButton);

  var title = $("<div class='col-xs-12 col-sm-9'><span class='number'>#"+ this.issue.number +"</span><span class='title'>"+ this.issue.title +"</span></div>");
  var text = $("<div class='col-xs-12 col-sm-12'><div class='text'>" + prepareBody(this.issue.body) + "</div></div>");
  var labels = $("<div class='col-xs-12 col-sm-12'></div>");
  labels.append(this.renderLabels());

  var image = $("<div class='col-xs-3 col-sm-2'>");
  image.append(this.renderAvatar(this.issue.user.avatar_url));
  container.append(image);
  container.append(title);
  container.append($("<div class='clearfix'>"));
  container.append(labels);
  container.append(this.renderAssignee());
  container.append(this.renderMilestone());
  container.append(this.renderIssueAuthorAndDate());
  container.append(text);
  $(container).show();
  $(".issue-list").hide();
  this.renderComments(container);
  $(document).keydown(this.keyHandler.bind(this));

  function prepareBody(body) {
    marked.setOptions({
      renderer: new marked.Renderer(),
      gfm: true,
      tables: true,
      breaks: false,
      pedantic: false,
      sanitize: false,
      smartLists: true,
      smartypants: false
    });
    return marked(body);
  }
}

IssueDetailView.prototype.hide = function() {
  $(".issue-list").show();
  $(".issue-detail").hide();
  $(".issue-detail").empty();
  $(document).off("keydown", this.keyHandler);
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

function IssueStore(repositoryName, accessToken) {
  this.repositoryName = repositoryName;
  this.issueDatabase = new PouchDB(this.repositoryName);
  this.commentsDatabase = new PouchDB(this.repositoryName + "/comments");
  this.apiClient = new GitHub({
    token: accessToken
  });
}

IssueStore.prototype.loadCommentsForIssue = function(issueNumber) {
  var designDocument = {
    _id: '_design/index',
    views: {
      index: {
        map: function mapFun(doc) {
          if (doc.issueId) {
            emit(doc.issueId);
          }
        }.toString()
      }
    }
  };

  var self = this;
  return this.commentsDatabase.put(designDocument).catch(function (err) {
    if (err.name !== 'conflict') {
      throw err;
    }
  }).then(function () {
    return self.commentsDatabase.query('index', {
      key: issueNumber,
      include_docs: true
    });
  }).then(function (result) {
    var comments = _.map(result.rows, function(row) {
      return row.doc;
    });

    return Promise.resolve(_.sortBy(comments, function(comment) { return comment.created_at; }));
  });
};

IssueStore.prototype.loadIssuesFromGitHub = function() {
  return this.apiClient.getIssues(this.repositoryName).listIssues();
};

IssueStore.prototype.getIssue = function(id) {
  return this.issueDatabase.get(id);
};

IssueStore.prototype.allIssues = function() {
  return this.issueDatabase.allDocs({include_docs: true});
};

IssueStore.prototype.bulkInsertIssues = function(docs) {
  return this.issueDatabase.bulkDocs(_.map(docs, setDocId));
  function setDocId(issue) {
    issue['_id'] = issue.id.toString();
    return issue;
  }
};

function storeToken(token) {
  var db = new PouchDB("appconfig");
  return db.get("accesstoken").catch(function(err) {
    if(err.name === 'not_found') {
      return {
        "_id": "accesstoken",
        "value": ""
      };
    } else {
      console.log('err caught', err);
      throw err;
    }
  }).then(function(doc) {
    doc.value = token.trim();
    return db.put(doc);
  });
};

function getToken() {
  var db = new PouchDB("appconfig");
  return db.get("accesstoken");
}

function TokenModalScreen() {
  $(".personal-access-token-input").val('');
  this.success = function() {};
  $(".personal-access-token-input").blur(function() {
    if($(this).val().length > 0) {
      $(".modal-footer button").removeClass('disabled');
    } else {
      $(".modal-footer button").addClass('disabled');
    }
  });
  $(".modal-footer button").click(this.onClose.bind(this));
}

TokenModalScreen.prototype.token = function() {
  return $(".personal-access-token-input").val().trim();
}

TokenModalScreen.prototype.onClose = function() {
  var self = this;
  storeToken(self.token())
  .then(function() {
    $(".modal").modal('hide');
    if(self.success) {
      self.success(self.token());
    }
  })
  .catch(function(err) {
    console.log(err);
  });
};

TokenModalScreen.prototype.show = function() {
  $('.modal').modal({
      show: true
  });
};

TokenModalScreen.prototype.removeHandlers = function() {
  $(".personal-access-token-input").unbind();
  $(".modal-footer button").unbind();
};

(function() {
  var issueDetailView = null;
  var database = null;
  var accessToken = null;

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
          issueDetailView = new IssueDetailView(issue, database);
          issueDetailView.render();
        })
        .catch(function(err) {
          console.log("ERR", err);
          new ErrorBanner(err);
        });
    }
  }

  function workerCompleted(ev) {
    new InfoBanner("Fetched comments ✅");
  }

  function workerFailed(ev) {
    new ErrorBanner("Fetching comments failed with:" + ev.message);
  }

  function startCommentworker(accessToken, repo) {
    var worker = new Worker("js/commentWorker.js");
    worker.postMessage({accessToken: accessToken, repoName: repo});
    worker.onmessage = workerCompleted;
    worker.onerror = workerFailed;
  }

  function disableForLoading() {
    $(".issue-list").hide();
    $(".loading-indicator").show();
  }

  function enableAfterLoading() {
    $(".issue-list").show();
    $(".loading-indicator").hide();
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
    disableForLoading();

    database = new IssueStore(repo, accessToken);
    database.loadIssuesFromGitHub()
      .then(function(resultSet) {
        return database.bulkInsertIssues(resultSet.data);
      })
      .then(function(){
        startCommentworker(accessToken, repo);
        renderListView();
        $(".add-new-repo").hide();
        enableAfterLoading();
      })
      .catch(function(err) {
        console.log("ERR", err);
        new ErrorBanner("Fetching issues for " + repo + " failed");
      });
  }

  function loadAvailableRepositories() {
    PouchDB.allDbs().then(function (dbs) {
      var dbEntries = dbs
      .filter(function(db) { return db !== 'appconfig' && db.indexOf("/comments") === -1 ; })
      .map(function(db) {
        var dbEntry = $("<a href='#' class='list-group-item'>" + db + "</a>");
        dbEntry.click(function(ev) {
          if(issueDetailView) {
            issueDetailView.hide();
            issueDetailView = null;
          }
          database = new IssueStore(db, accessToken);
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

  function configureAccessToken() {
    var modal = new TokenModalScreen();
    modal.show();
    modal.success = function(token) {
      accessToken = token;
      modal.removeHandlers();
      modal = null;
    };
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

  function InfoBanner(message) {
    this.timeoutHandler = null;

    $(".info-banner").html(message);
    $('.info-banner').show();

    this.hideInfo = function() {
      $(".info-banner").html('');
      $('.info-banner').hide();
      window.clearTimeout(this.timeoutHandler);
      this.timeoutHandler = null;
    }
    this.timeoutHandler = setTimeout(this.hideInfo, 1000 * 5);
  }

  $(document).ready(function() {
    getToken()
    .then(function(token) {
      accessToken = token.value;
      loadAvailableRepositories();
    })
    .catch(function(err) {
      var modal = new TokenModalScreen();
      modal.show();
      modal.success = function(token) {
        accessToken = token;
        loadAvailableRepositories();
        modal.removeHandlers();
        modal = null;
      };
    });

    $(".reconfigure-token-button").click(configureAccessToken);

    $('.fetch-issues').click(fetchIssues);
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